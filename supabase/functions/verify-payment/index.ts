import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const service = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = (req.headers.get("Authorization") ?? "").replace(
      "Bearer ",
      "",
    );
    const { data: userData } = await service.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string")
      throw new Error("Missing session id");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.user_id && session.metadata.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paid = session.payment_status === "paid";
    const status = paid
      ? "paid"
      : session.status === "expired"
        ? "expired"
        : "pending";

    await service.from("payments").upsert(
      {
        user_id: user.id,
        email: session.customer_details?.email ?? user.email,
        plan: session.metadata?.plan ?? null,
        stripe_session_id: session.id,
        stripe_payment_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
        amount: session.amount_total ?? null,
        currency: session.currency ?? null,
        status,
      },
      { onConflict: "stripe_session_id" },
    );

    if (
      session.metadata?.kind === "client_invoice" &&
      session.metadata.invoice_id
    ) {
      const invoiceId = session.metadata.invoice_id;
      let paymentMethod: "card" | "us_bank_account" | null = null;
      if (paid && typeof session.payment_intent === "string") {
        const intent = await stripe.paymentIntents.retrieve(
          session.payment_intent,
        );
        if (typeof intent.payment_method === "string") {
          const method = await stripe.paymentMethods.retrieve(
            intent.payment_method,
          );
          if (method.type === "card" || method.type === "us_bank_account")
            paymentMethod = method.type;
        }
      }
      const { data: invoice } = await service
        .from("invoices")
        .update({
          status: paid ? "paid" : "viewed",
          paid_at: paid ? new Date().toISOString() : null,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          payment_method: paymentMethod,
        })
        .eq("id", invoiceId)
        .eq("user_id", user.id)
        .select("id, engagement_id, invoice_number, amount_cents")
        .single();

      if (paid && invoice) {
        const { data: existingEvent } = await service
          .from("activity_events")
          .select("id")
          .eq("resource_id", invoice.id)
          .eq("event_type", "invoice_paid")
          .limit(1);
        if (!existingEvent?.length) {
          await service.from("activity_events").insert({
            user_id: user.id,
            engagement_id: invoice.engagement_id,
            actor_user_id: user.id,
            event_type: "invoice_paid",
            title: `Invoice ${invoice.invoice_number} paid`,
            detail: `Payment of ${((invoice.amount_cents || 0) / 100).toFixed(2)} USD was verified by Stripe.`,
            resource_type: "invoice",
            resource_id: invoice.id,
            metadata: { stripe_session_id: session.id },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        status,
        paid,
        plan: session.metadata?.plan ?? null,
        amount: session.amount_total,
        currency: session.currency,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("verify-payment error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
