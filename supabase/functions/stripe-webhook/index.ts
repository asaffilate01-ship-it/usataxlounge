import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

serve(async (request) => {
  if (request.method !== "POST")
    return respond({ error: "Method not allowed" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = request.headers.get("stripe-signature");
  if (!stripeKey || !webhookSecret) {
    return respond({ error: "Stripe webhook is not configured" }, 503);
  }
  if (!signature) return respond({ error: "Missing Stripe signature" }, 400);

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    return respond(
      { error: `Invalid signature: ${(error as Error).message}` },
      400,
    );
  }

  const service = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const { data: prior } = await service
    .from("provider_webhook_events")
    .select("id,status")
    .eq("provider", "stripe")
    .eq("event_id", event.id)
    .maybeSingle();
  if (prior && prior.status !== "failed") {
    return respond({ received: true, duplicate: true });
  }

  let eventRowId = prior?.id;
  if (!eventRowId) {
    const { data: created, error } = await service
      .from("provider_webhook_events")
      .insert({
        provider: "stripe",
        event_id: event.id,
        event_type: event.type,
      })
      .select("id")
      .single();
    if (error) {
      const { data: raced } = await service
        .from("provider_webhook_events")
        .select("id,status")
        .eq("provider", "stripe")
        .eq("event_id", event.id)
        .maybeSingle();
      if (!raced) return respond({ error: "Could not record webhook event" }, 500);
      if (raced?.status !== "failed")
        return respond({ received: true, duplicate: true });
      eventRowId = raced?.id;
    } else {
      eventRowId = created.id;
    }
  }

  try {
    const supported = new Set([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
    ]);
    if (!supported.has(event.type)) {
      await service
        .from("provider_webhook_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("id", eventRowId);
      return respond({ received: true, ignored: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const invoiceId = session.metadata?.invoice_id;
    const isInvoice =
      session.metadata?.kind === "client_invoice" && !!invoiceId && !!userId;
    const paid =
      event.type === "checkout.session.async_payment_succeeded" ||
      (event.type === "checkout.session.completed" &&
        session.payment_status === "paid");
    const failed = event.type === "checkout.session.async_payment_failed";
    const expired = event.type === "checkout.session.expired";
    const paymentStatus = paid
      ? "paid"
      : failed
        ? "failed"
        : expired
          ? "expired"
          : "pending";

    await service.from("payments").upsert(
      {
        user_id: userId || null,
        email: session.customer_details?.email || null,
        plan:
          session.metadata?.plan || (invoiceId ? `invoice:${invoiceId}` : null),
        stripe_session_id: session.id,
        stripe_payment_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
        amount: session.amount_total,
        currency: session.currency,
        status: paymentStatus,
      },
      { onConflict: "stripe_session_id" },
    );

    if (isInvoice) {
      let paymentMethod: "card" | "us_bank_account" | null = null;
      if (paid && typeof session.payment_intent === "string") {
        const intent = await stripe.paymentIntents.retrieve(
          session.payment_intent,
        );
        if (typeof intent.payment_method === "string") {
          const method = await stripe.paymentMethods.retrieve(
            intent.payment_method,
          );
          if (method.type === "card" || method.type === "us_bank_account") {
            paymentMethod = method.type;
          }
        }
      }
      const invoiceStatus = paid
        ? "paid"
        : failed
          ? "sent"
          : expired
            ? "sent"
            : "viewed";
      const { data: invoice } = await service
        .from("invoices")
        .update({
          status: invoiceStatus,
          paid_at: paid ? new Date().toISOString() : null,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          payment_method: paymentMethod,
        })
        .eq("id", invoiceId)
        .eq("user_id", userId)
        .select("id,engagement_id,invoice_number,amount_cents")
        .single();

      if (paid && invoice) {
        const { data: previousActivity } = await service
          .from("activity_events")
          .select("id")
          .eq("event_type", "invoice_paid")
          .eq("resource_id", invoice.id)
          .limit(1);
        if (!previousActivity?.length) {
          await service.from("activity_events").insert({
            user_id: userId,
            engagement_id: invoice.engagement_id,
            actor_user_id: userId,
            event_type: "invoice_paid",
            title: `Invoice ${invoice.invoice_number} paid`,
            detail: `Stripe verified a payment of ${((invoice.amount_cents || 0) / 100).toFixed(2)} USD.`,
            resource_type: "invoice",
            resource_id: invoice.id,
            metadata: {
              stripe_session_id: session.id,
              stripe_event_id: event.id,
            },
          });
        }
      }
    }

    await service
      .from("provider_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", eventRowId);
    return respond({ received: true });
  } catch (error) {
    await service
      .from("provider_webhook_events")
      .update({ status: "failed", error_message: (error as Error).message })
      .eq("id", eventRowId);
    return respond({ error: "Webhook processing failed" }, 500);
  }
});
