import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

serve(async (request) => {
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);

  const configuredSecret = Deno.env.get("CRON_SECRET");
  if (
    !configuredSecret ||
    request.headers.get("x-cron-secret") !== configuredSecret
  ) {
    return json({ error: "Unauthorized" }, 401);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey)
    return json({ error: "Email provider is not configured" }, 503);

  const service = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
  const now = new Date();
  const cutoff = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
  const { data: items, error } = await service
    .from("organizer_items")
    .select("id,user_id,title,description,due_date,reminder_count")
    .lte("remind_at", now.toISOString())
    .not("status", "in", "(submitted,completed,waived)")
    .or(`last_reminded_at.is.null,last_reminded_at.lt.${cutoff}`)
    .limit(100);
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  const failures: Array<{ id: string; error: string }> = [];
  for (const item of items ?? []) {
    try {
      const { data: userData, error: userError } =
        await service.auth.admin.getUserById(item.user_id);
      const email = userData.user?.email;
      if (userError || !email) throw new Error("Client email is unavailable");

      const due = item.due_date
        ? new Date(`${item.due_date}T00:00:00`).toLocaleDateString("en-US", {
            dateStyle: "long",
          })
        : "as soon as possible";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TaxCenda <usa@taxlounge.co.uk>",
          to: [email],
          subject: `Reminder: ${item.title} — TaxCenda`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1>TaxCenda</h1><p>A requested item is still waiting in your secure organizer.</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description || "Open your organizer to review and submit this item.")}</p><p><strong>Due:</strong> ${escapeHtml(due)}</p><p><a href="https://usa.taxlounge.co.uk/client" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px">Open secure organizer</a></p><p>Do not send tax documents by email.</p></div>`,
        }),
      });
      if (!response.ok)
        throw new Error(`Email provider returned ${response.status}`);

      await service
        .from("organizer_items")
        .update({
          last_reminded_at: now.toISOString(),
          reminder_count: (item.reminder_count ?? 0) + 1,
          remind_at: new Date(
            now.getTime() + 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq("id", item.id);
      sent += 1;
    } catch (itemError) {
      failures.push({ id: item.id, error: (itemError as Error).message });
    }
  }

  return json({ processed: items?.length ?? 0, sent, failures });
});
