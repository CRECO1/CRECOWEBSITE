import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // works on free Resend plan; swap to noreply@crecotx.com after domain verification

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, company, email, phone, message, property_interest, source } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('leads').insert([{
        name,
        company: company ?? null,
        email,
        phone: phone ?? null,
        message: message ?? null,
        property_interest: property_interest ?? null,
        source: source ?? 'contact',
        status: 'new',
      }]);
    }

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFICATION_EMAIL,
        subject: `New Lead: ${name} — ${source ?? 'Contact Form'}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">New Lead — CRECO</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Name</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${name}</td></tr>
              ${company ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Company</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${company}</td></tr>` : ''}
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Email</td><td style="padding:8px 12px;border:1px solid #E8E5E0"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Phone</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${phone ?? '—'}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Source</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${source ?? 'contact'}</td></tr>
              ${property_interest ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Property</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${property_interest}</td></tr>` : ''}
              ${message ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Message</td><td style="padding:8px 12px;border:1px solid #E8E5E0;white-space:pre-line">${message}</td></tr>` : ''}
            </table>
          </div>
        `,
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'We received your inquiry — CRECO',
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">Hi ${name},</h2>
            <p>Thank you for reaching out to <strong>CRECO – Commercial Real Estate Company</strong>.</p>
            <p>A member of our team will be in touch within one business day.</p>
            <p>Need to talk sooner? Call us at <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a>.</p>
            <br/>
            <p>— The CRECO Team<br/>San Antonio, TX</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, message: 'Lead received' });
  } catch (err) {
    console.error('Lead submission error:', err);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }
}
