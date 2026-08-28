import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const service = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: userData } = await service.auth.getUser(token);
    const user = userData.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const signatureId = typeof body?.signatureId === "string" ? body.signatureId : "";
    const typedName = typeof body?.typedName === "string" ? body.typedName.trim().replace(/\s+/g, " ") : "";
    const consented = body?.consented === true;

    if (!signatureId || typedName.length < 2 || typedName.length > 160 || !consented) {
      return json({ error: "A valid legal name and explicit consent are required" }, 400);
    }

    const { data: signature, error: signatureError } = await service
      .from("signatures")
      .select("id,user_id,filing_id,document_id,consent_text,signed_at")
      .eq("id", signatureId)
      .single();
    if (signatureError || !signature) return json({ error: "Signature request not found" }, 404);
    if (signature.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (signature.signed_at) return json({ error: "This authorization has already been signed" }, 409);

    const { data: filing, error: filingError } = await service
      .from("filings")
      .select("id,user_id,engagement_id,form_type,tax_year,status,file_url,updated_at")
      .eq("id", signature.filing_id)
      .single();
    if (filingError || !filing || filing.user_id !== user.id) return json({ error: "Filing not found" }, 404);
    if (!filing.file_url) return json({ error: "The final return package is not available for review" }, 409);
    if (filing.status !== "pending_signature") return json({ error: "The filing is not awaiting signature" }, 409);

    const { data: engagement } = filing.engagement_id
      ? await service.from("tax_engagements").select("final_package_hash").eq("id", filing.engagement_id).maybeSingle()
      : { data: null };
    if (!engagement?.final_package_hash) return json({ error: "The final package fingerprint is missing" }, 409);

    const signedAt = new Date().toISOString();
    const consentVersion = "taxcenda-efile-authorization-v1";
    const snapshotHash = await sha256(JSON.stringify({
      signatureId: signature.id,
      filingId: filing.id,
      userId: user.id,
      formType: filing.form_type,
      taxYear: filing.tax_year,
      fileUrl: filing.file_url,
      finalPackageHash: engagement.final_package_hash,
      filingUpdatedAt: filing.updated_at,
      consentText: signature.consent_text,
      consentVersion,
      typedName,
      signedAt,
    }));
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = req.headers.get("cf-connecting-ip") || forwarded || null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;

    const { data: updated, error: updateError } = await service
      .from("signatures")
      .update({
        typed_name: typedName,
        signed_at: signedAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        consent_version: consentVersion,
        filing_snapshot_hash: snapshotHash,
        signature_data: JSON.stringify({ method: "typed_name", consented: true, snapshotHash }),
      })
      .eq("id", signature.id)
      .is("signed_at", null)
      .select("id")
      .maybeSingle();
    if (updateError || !updated) return json({ error: "The authorization could not be recorded" }, 409);

    await service.from("filings").update({ status: "signed", updated_at: signedAt }).eq("id", filing.id).eq("status", "pending_signature");

    const { data: staffRoles } = await service
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "preparer", "reviewer"])
      .limit(20);
    if (staffRoles?.length) {
      await service.from("notifications").insert(staffRoles.map((role) => ({
        user_id: role.user_id,
        title: "Filing authorization signed",
        message: `${typedName} signed ${filing.form_type} for tax year ${filing.tax_year}. Final accountant release is still required before transmission.`,
        type: "action",
        link: "/admin",
      })));
    }

    return json({ success: true, signedAt, snapshotHash });
  } catch (error) {
    console.error("signing failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "The filing authorization could not be completed" }, 500);
  }
});
