import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const siteUrl =
  Deno.env.get("PUBLIC_SITE_URL") || "https://usa.taxlounge.co.uk";
const allowedOrigins = new Set([
  siteUrl,
  "http://localhost:5173",
  "http://localhost:8080",
]);
const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && allowedOrigins.has(origin) ? origin : siteUrl,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  Vary: "Origin",
});
const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    const token = (req.headers.get("Authorization") || "").replace(
      "Bearer ",
      "",
    );
    const service = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } },
    );
    const { data: authData } = await service.auth.getUser(token);
    if (!authData.user) throw new Error("Authentication required");
    const { inviteId } = await req.json();
    const { data: invite, error } = await service
      .from("household_access")
      .select("*")
      .eq("id", inviteId)
      .eq("owner_user_id", authData.user.id)
      .eq("status", "pending")
      .single();
    if (error || !invite) throw new Error("Invitation not found");
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("Email provider is not configured");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TaxCenda <usa@taxlounge.co.uk>",
        to: [invite.invited_email],
        subject: "You have been invited to collaborate in TaxCenda",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1>TaxCenda</h1><p>You have been invited as a <strong>${esc(invite.relationship)}</strong> with <strong>${esc(invite.access_level)}</strong> access to a secure tax workspace.</p><p>Sign in using <strong>${esc(invite.invited_email)}</strong>. The invitation will appear in Organizer &amp; Payments for you to accept.</p><p><a href="${siteUrl}/auth" style="display:inline-block;padding:12px 18px;background:#0f766e;color:white;text-decoration:none;border-radius:8px">Open TaxCenda securely</a></p><p>This invitation expires ${esc(new Date(invite.expires_at).toLocaleDateString())}. Never send tax documents by reply email.</p></div>`,
      }),
    });
    if (!response.ok)
      throw new Error(
        `Email provider rejected the invitation (${response.status})`,
      );
    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
