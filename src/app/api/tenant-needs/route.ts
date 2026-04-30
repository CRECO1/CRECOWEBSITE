import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // works on free Resend plan; swap to noreply@crecotx.com after domain verification

const STEP_LABELS: Record<string, string> = {
  space_type: 'Space type(s)',
  transaction_type: 'Lease or buy',
  size: 'Size needed',
  budget: 'Monthly budget',
  submarket: 'Preferred area / zip codes',
  timeline: 'Timeline',
  must_haves: 'Must-have features',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, company, email, phone, answers } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 });
    }

    const answerSummary = Object.entries(answers ?? {})
      .map(([k, v]) => `${STEP_LABELS[k] ?? k}: ${Array.isArray(v) ? (v as string[]).join(', ') : v}`)
      .join('\n');

    // ── Save lead to Supabase ───────────────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('leads').insert([{
        name,
        email,
        phone,
        company: company ?? null,
        source: 'tenant-needs',
        status: 'new',
        intake_data: answers ?? {},
        message: `Tenant Needs Submission:\n${answerSummary}`,
      }]);
    }

    // ── Send email notifications via Resend ────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Notify the team
      await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFICATION_EMAIL,
        subject: `New Tenant Needs: ${name}${company ? ` (${company})` : ''}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">New Tenant Needs Submission — CRECO</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Name</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${name}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Company</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${company ?? '—'}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Email</td><td style="padding:8px 12px;border:1px solid #E8E5E0"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Phone</td><td style="padding:8px 12px;border:1px solid #E8E5E0"><a href="tel:${phone}">${phone}</a></td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Source</td><td style="padding:8px 12px;border:1px solid #E8E5E0">Tenant Needs Form</td></tr>
            </table>
            <h3 style="color:#1A1A1A;margin-top:20px">Requirements:</h3>
            <pre style="background:#FAFAF8;padding:12px;border-radius:4px;white-space:pre-wrap;border:1px solid #E8E5E0">${answerSummary}</pre>
          </div>
        `,
      });

      // Auto-reply to the lead
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'We received your space requirements — CRECO',
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">Hi ${name},</h2>
            <p>Thanks for sharing your requirements with CRECO. A broker on our team will review your needs and reach out within one business day with vetted options that match your size, budget, and submarket.</p>
            <p>Need to talk sooner? Call us at <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a>.</p>
            <br/>
            <p>— The CRECO Team<br/>Commercial Real Estate Company<br/>San Antonio, TX</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Tenant needs error:', err);
    return NextResponse.json({ error: 'Failed to submit tenant needs' }, { status: 500 });
  }
}
