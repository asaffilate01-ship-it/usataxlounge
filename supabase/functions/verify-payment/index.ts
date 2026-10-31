import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkoutOwnedBy } from "../_shared/paymentSecurity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!url || !secret || !stripeKey) throw new Error("Missing payment provider configuration");
    const service = createClient(url, secret, { auth: { persistSession: false } });
    const { data: auth, error: authError } = await service.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "Unauthorized" }, 401);
    const user = auth.user;

    const payload = await req.json();
    const sessionId = payload?.sessionId;
    if (typeof sessionId !== "string" || !/^cs_(?:test|live)_[A-Za-z0-9_]{6,220}$/.test(sessionId))
      return json({ error: "Invalid checkout identifier" }, 400);

    const { data: payment, error: dbError } = await service.from("payments")
      .select("user_id, plan").eq("stripe_session_id", sessionId).maybeSingle();
    if (dbError) throw dbError;
    if (!payment || payment.user_id !== user.id)
      return json({ error: "Checkout session not found for this account" }, 404);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    if (!checkoutOwnedBy(checkout.metadata?.user_id, checkout.client_reference_id, payment.user_id, user.id)
      || checkout.metadata?.plan !== payment.plan)
      return json({ error: "Forbidden" }, 403);

    const paid = checkout.payment_status === "paid";
    const status = paid ? "paid" : checkout.status === "expired" ? "expired" : "pending";
    const { error: updateError } = await service.from("payments").update({
      stripe_payment_intent: typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
      stripe_customer_id: typeof checkout.customer === "string" ? checkout.customer : null,
      amount: checkout.amount_total ?? null,
      currency: checkout.currency ?? null,
      status,
    }).eq("stripe_session_id", checkout.id).eq("user_id", user.id);
    if (updateError) throw updateError;
    return json({
      status, paid, plan: payment.plan, amount: checkout.amount_total, currency: checkout.currency,
    }, 200);
  } catch (error) {
    console.error("verify-payment failure type:", error instanceof Error ? error.name : "unknown");
    return json({ error: "Payment verification is temporarily unavailable. Please try again or contact support." }, 500);
  }
});
