import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const body = await req.json();
    const { type, to, clientName, agentName, senderName, senderEmail, phone, messageSubject, messageBody } = body;

    let subject = '';
    let html = '';

    if (type === 'signature_request') {
      subject = 'Action Required: E-Sign Your Tax Return — TaxLounge';
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxLounge</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Secure Tax Filing Portal</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">E-Signature Required</h2>
            <p style="color: #475569; line-height: 1.6;">Hi ${clientName || 'there'},</p>
            <p style="color: #475569; line-height: 1.6;">Your tax return has been prepared and is ready for your review. Please log in to your TaxLounge portal to review and electronically sign your return to authorize e-filing with the IRS.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #64748b; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">What you need to do:</p>
              <ol style="color: #334155; margin: 8px 0 0 0; padding-left: 20px; line-height: 1.8;">
                <li>Log in to your TaxLounge portal</li>
                <li>Go to "E-Sign &amp; Approve"</li>
                <li>Review your return details</li>
                <li>Type your name to sign</li>
              </ol>
            </div>
            <p style="color: #475569; line-height: 1.6;">This electronic signature is equivalent to IRS Form 8879 and authorizes the electronic filing of your tax return.</p>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">— The TaxLounge Team</p>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">TaxLounge</p>
          </div>
        </div>
      `;
    } else if (type === 'signature_completed') {
      subject = 'Tax Return Signed — TaxLounge';
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxLounge</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Secure Tax Filing Portal</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">✅ Signature Confirmed</h2>
            <p style="color: #475569; line-height: 1.6;">Hi ${clientName || 'there'},</p>
            <p style="color: #475569; line-height: 1.6;">Your e-filing authorization has been successfully recorded. Your tax return will now be submitted to the IRS for processing.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-weight: 600;">What happens next?</p>
              <p style="color: #15803d; margin: 8px 0 0 0; line-height: 1.6;">Your return will be electronically filed with the IRS. You will receive a confirmation once the IRS accepts your return. This typically takes 24-48 hours.</p>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">— The TaxLounge Team</p>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">TaxLounge</p>
          </div>
        </div>
      `;
    } else if (type === 'signature_admin_notify') {
      subject = `Client ${clientName} Has Signed Their Tax Return`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxLounge Admin</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">New Signature Received</h2>
            <p style="color: #475569; line-height: 1.6;"><strong>${clientName}</strong> has signed their e-filing authorization. The return is now ready for submission to the IRS.</p>
            <p style="color: #475569; line-height: 1.6;">Log in to the admin dashboard to review and process the filing.</p>
          </div>
        </div>
      `;
    } else if (type === 'contact_form') {
      subject = `New Enquiry: ${messageSubject || 'Contact Form'}`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxLounge</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">New Website Enquiry</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="color: #64748b; padding: 8px 0; font-size: 13px; width: 100px;">Name:</td><td style="color: #1e293b; padding: 8px 0; font-weight: 600;">${senderName || 'N/A'}</td></tr>
              <tr><td style="color: #64748b; padding: 8px 0; font-size: 13px;">Email:</td><td style="color: #1e293b; padding: 8px 0;"><a href="mailto:${senderEmail}" style="color: #2563eb;">${senderEmail || 'N/A'}</a></td></tr>
              <tr><td style="color: #64748b; padding: 8px 0; font-size: 13px;">Phone:</td><td style="color: #1e293b; padding: 8px 0;">${phone || 'Not provided'}</td></tr>
              <tr><td style="color: #64748b; padding: 8px 0; font-size: 13px;">Subject:</td><td style="color: #1e293b; padding: 8px 0;">${messageSubject || 'N/A'}</td></tr>
            </table>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #64748b; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message:</p>
              <p style="color: #334155; margin: 0; line-height: 1.6; white-space: pre-wrap;">${messageBody || 'No message'}</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'new_message') {
      subject = `New Message from ${senderName || 'Your Tax Agent'} — TaxLounge`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a2332, #0d1520); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TaxLounge</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Secure Tax Filing Portal</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1a2332; margin: 0 0 16px 0;">You Have a New Message</h2>
            <p style="color: #475569; line-height: 1.6;">Hi ${clientName || 'there'},</p>
            <p style="color: #475569; line-height: 1.6;">${senderName || 'Your tax agent'} sent you a message while you were offline:</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #334155; margin: 0; line-height: 1.6; white-space: pre-wrap;">${messageBody || ''}</p>
            </div>
            <p style="color: #475569; line-height: 1.6;">Log in to your TaxLounge portal to reply.</p>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">— The TaxLounge Team</p>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">TaxLounge</p>
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
        from: 'TaxLounge <usa@taxlounge.co.uk>',
        to: [to],
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
