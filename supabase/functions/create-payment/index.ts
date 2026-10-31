import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { trustedCheckoutOrigin } from "../_shared/paymentSecurity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const PRICE_MAP: Record<string, string> = {
  individual: "price_1TBE63FFogsDQVs4gU9vmYvz",
  business: "price_1TBE64FFogsDQVs4GruajpJZ",
  expat: "price_1TBE65FFogsDQVs4MkAc6sha",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (data: Record<string, unknown>, status: number) => new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!url || !anonKey || !secret || !stripeKey) throw new Error("Missing payment provider configuration");

    const returnOrigin = trustedCheckoutOrigin(
      Deno.env.get("TAXCENDA_SITE_URL"),
      Deno.env.get("TAXCENDA_ALLOW_LOCAL_HTTP") === "true",
    );
    const supabase = createClient(url, anonKey);
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user?.email) return json({ error: "Unauthorized" }, 401);
    const user = auth.user;
    const payload = await req.json();
    const plan = payload && typeof payload.plan === "string" ? payload.plan : "";
    if (!Object.prototype.hasOwnProperty.call(PRICE_MAP, plan)) {
      return json({ error: "Invalid plan" }, 400);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = existing.data[0]?.id;
    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [{ price: PRICE_MAP[plan], quantity: 1 }],
      mode: "payment",
      metadata: { plan, user_id: user.id },
      success_url: `${returnOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnOrigin}/payment-success?cancelled=true`,
    });

    const service = createClient(url, secret, { auth: { persistSession: false } });
    const { error: recordError } = await service.from("payments").insert({
      user_id: user.id,
      email: user.email,
      plan,
      stripe_session_id: checkout.id,
      stripe_customer_id: customerId ?? null,
      amount: checkout.amount_total ?? null,
      currency: checkout.currency ?? null,
      status: "pending",
    });
    if (recordError || !checkout.url) {
      try { await stripe.checkout.sessions.expire(checkout.id); }
      catch { console.error("Unable to expire orphaned Checkout session"); }
      throw new Error("Unable to record a reconcilable Checkout session");
    }
    return json({ url: checkout.url }, 200);
  } catch (error) {
    console.error("create-payment failure type:", error instanceof Error ? error.name : "unknown");
    return json({ error: "Unable to create a payment session. Please contact support if this persists." }, 500);
  }
});
