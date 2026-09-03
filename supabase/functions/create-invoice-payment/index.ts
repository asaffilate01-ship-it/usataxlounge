import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const publicSiteUrl =
  Deno.env.get("PUBLIC_SITE_URL") || "https://usa.taxlounge.co.uk";
const allowedOrigins = new Set([
  publicSiteUrl,
  "http://localhost:5173",
  "http://localhost:8080",
]);

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && allowedOrigins.has(origin) ? origin : publicSiteUrl,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  Vary: "Origin",
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers });

  try {
    const token = (req.headers.get("Authorization") || "").replace(
      "Bearer ",
      "",
    );
    if (!token) throw new Error("Authentication required");

    const service = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } },
    );
    const { data: authData } = await service.auth.getUser(token);
    const user = authData.user;
    if (!user?.email) throw new Error("Authentication required");

    const body = await req.json();
    const invoiceId = typeof body?.invoiceId === "string" ? body.invoiceId : "";
    if (!invoiceId) throw new Error("Invoice id is required");

    const { data: invoice, error: invoiceError } = await service
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single();
    if (invoiceError || !invoice) throw new Error("Invoice not found");
    if (["paid", "void", "refunded"].includes(invoice.status))
      throw new Error("This invoice is not payable");
    if (invoice.currency !== "usd")
      throw new Error("ACH checkout currently supports USD invoices only");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    if (invoice.stripe_checkout_session_id) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        invoice.stripe_checkout_session_id,
      );
      if (existingSession.status === "open" && existingSession.url) {
        return new Response(JSON.stringify({ url: existingSession.url }), {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    const customerId = existingCustomers.data[0]?.id;
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        mode: "payment",
        payment_method_types: ["card", "us_bank_account"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: invoice.currency,
              unit_amount: invoice.amount_cents,
              product_data: {
                name: `TaxCenda invoice ${invoice.invoice_number}`,
                description: invoice.description,
              },
            },
          },
        ],
        invoice_creation: { enabled: true },
        metadata: {
          kind: "client_invoice",
          invoice_id: invoice.id,
          user_id: user.id,
        },
        success_url: `${publicSiteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${publicSiteUrl}/client?payment=cancelled`,
      },
      {
        idempotencyKey: `invoice-checkout-${invoice.id}-${invoice.updated_at}`,
      },
    );

    await service
      .from("invoices")
      .update({ stripe_checkout_session_id: session.id, status: "viewed" })
      .eq("id", invoice.id);
    await service.from("payments").upsert(
      {
        user_id: user.id,
        email: user.email,
        plan: `invoice:${invoice.id}`,
        stripe_session_id: session.id,
        stripe_customer_id: customerId || null,
        amount: session.amount_total,
        currency: session.currency,
        status: "pending",
      },
      { onConflict: "stripe_session_id" },
    );

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-invoice-payment error", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
