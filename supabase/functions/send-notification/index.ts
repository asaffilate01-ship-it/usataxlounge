import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ADMIN_EMAIL = 'hello@taxlounge.co.uk';
const PUBLIC_TYPES = ['contact_form'];

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const rawType = String(body?.type ?? '');
    const { clientName, senderName, senderEmail, phone, messageSubject, messageBody } = body;
    let to = body?.to;

    // ---- Authorisation ---------------------------------------------------
    if (PUBLIC_TYPES.includes(rawType)) {
      // Public path: recipient is always our own inbox, never caller-controlled.
      to = ADMIN_EMAIL;
      if (!isEmail(senderEmail)) throw new Error('Invalid sender email');

      const { data: allowed } = await admin.rpc('check_contact_rate_limit', { sender_email: senderEmail });
      const { count } = await admin
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('email', senderEmail)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

      // Must correspond to a genuine, recent form submission and stay in budget.
      if (!count || (allowed === false && count > 3)) {
        return new Response(JSON.stringify({ error: 'Rate limited' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const authHeader = req.headers.get('Authorization') ?? '';
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: userData } = await admin.auth.getUser(token);
      const user = userData?.user;
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (!isEmail(to)) throw new Error('Invalid recipient');
      if (!isAdmin && to !== user.email && to !== ADMIN_EMAIL) {
        return new Response(JSON.stringify({ error: 'Forbidden recipient' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- Templates -------------------------------------------------------
    let subject = '';
    let html = '';
    const type = rawType;

    if (type === 'signature_request') {
      subject = 'Action Required: E-Sign Your Tax Return — TaxCenda';
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxCenda</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Secure Tax Filing Portal</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">E-Signature Required</h2>
            <p style="color: #475569; line-height: 1.6;">Hi ${esc(clientName) || 'there'},</p>
            <p style="color: #475569; line-height: 1.6;">Your tax return has been prepared and is ready for your review. Please log in to your TaxCenda portal to review and electronically sign your return to authorize e-filing with the IRS.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">What you need to do:</p>
              <ol style="color: #334155; margin: 8px 0 0 0; padding-left: 20px; line-height: 1.8;">
                <li>Log in to your TaxCenda portal</li>
                <li>Go to "E-Sign &amp; Approve"</li>
                <li>Review your return details</li>
                <li>Type your name to sign</li>
              </ol>
            </div>
            <p style="color: #475569; line-height: 1.6;">Review the included final package and applicable IRS authorization carefully. Your signature records your approval; filing remains locked until a tax professional completes the final release checks.</p>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">— The TaxCenda Team</p>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">TaxCenda</p>
          </div>
        </div>
      `;
    } else if (type === 'signature_completed') {
      subject = 'Tax Return Signed — TaxCenda';
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxCenda</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Secure Tax Filing Portal</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">✅ Signature Confirmed</h2>
            <p style="color: #475569; line-height: 1.6;">Hi ${esc(clientName) || 'there'},</p>
            <p style="color: #475569; line-height: 1.6;">Your e-filing authorization has been recorded and the package is queued for final professional review.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-weight: 600;">What happens next?</p>
              <p style="color: #15803d; margin: 8px 0 0 0; line-height: 1.6;">We will notify you separately after actual transmission and again when an acknowledgement is received from the taxing authority.</p>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">— The TaxCenda Team</p>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">TaxCenda</p>
          </div>
        </div>
      `;
    } else if (type === 'signature_admin_notify') {
      subject = `Client ${esc(clientName)} Has Signed Their Tax Return`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxCenda Admin</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">New Signature Received</h2>
            <p style="color: #475569; line-height: 1.6;"><strong>${esc(clientName)}</strong> has signed their e-filing authorization. The return is ready for final release checks by an authorized tax professional.</p>
            <p style="color: #475569; line-height: 1.6;">Log in to the admin dashboard to review and process the filing.</p>
          </div>
        </div>
      `;
    } else if (type === 'payment_received') {
      subject = 'Payment Confirmed — TaxCenda';
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxCenda</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">Payment Confirmed</h2>
            <p style="color: #475569; line-height: 1.6;">Hi ${esc(clientName) || 'there'}, we've received your payment${messageSubject ? ` for the ${esc(messageSubject)} plan` : ''}. Your engagement is now active and your preparer will be in touch shortly.</p>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">— The TaxCenda Team</p>
          </div>
        </div>
      `;
    } else if (type === 'contact_form') {
      subject = `New Enquiry: ${esc(messageSubject) || 'Contact Form'}`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxCenda</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">New Website Enquiry</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="color: #64748b; padding: 8px 0; font-size: 13px; width: 100px;">Name:</td><td style="color: #1e293b; padding: 8px 0; font-weight: 600;">${esc(senderName) || 'N/A'}</td></tr>
              <tr><td style="color: #64748b; padding: 8px 0; font-size: 13px;">Email:</td><td style="color: #1e293b; padding: 8px 0;">${esc(senderEmail)}</td></tr>
              <tr><td style="color: #64748b; padding: 8px 0; font-size: 13px;">Phone:</td><td style="color: #1e293b; padding: 8px 0;">${esc(phone) || 'Not provided'}</td></tr>
              <tr><td style="color: #64748b; padding: 8px 0; font-size: 13px;">Subject:</td><td style="color: #1e293b; padding: 8px 0;">${esc(messageSubject) || 'N/A'}</td></tr>
            </table>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #64748b; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message:</p>
              <p style="color: #334155; margin: 0; line-height: 1.6; white-space: pre-wrap;">${esc(messageBody) || 'No message'}</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'new_message') {
      subject = `New Message from ${esc(senderName) || 'Your Tax Agent'} — TaxCenda`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxCenda</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Secure Tax Filing Portal</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">You Have a New Message</h2>
            <p style="color: #475569; line-height: 1.6;">Hi ${esc(clientName) || 'there'},</p>
            <p style="color: #475569; line-height: 1.6;">${esc(senderName) || 'Your tax agent'} sent you a message while you were offline:</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #334155; margin: 0; line-height: 1.6; white-space: pre-wrap;">${esc(messageBody)}</p>
            </div>
            <p style="color: #475569; line-height: 1.6;">Log in to your TaxCenda portal to reply.</p>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">— The TaxCenda Team</p>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">TaxCenda</p>
          </div>
        </div>
      `;
    } else {
      throw new Error('Unknown notification type');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TaxCenda <usa@taxlounge.co.uk>',
        to: [to],
        reply_to: type === 'contact_form' && isEmail(senderEmail) ? senderEmail : undefined,
        subject,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
