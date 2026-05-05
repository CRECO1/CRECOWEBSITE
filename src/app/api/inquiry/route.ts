import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';

/**
 * Unified inquiry endpoint — handles all 5 paths from /get-started:
 *   tenant   — looking for space to lease/buy
 *   buyer    — investor/owner-user acquisition
 *   seller   — wants to sell or list a property
 *   pm       — needs property management
 *   exploring — generic interest
 *
 * Saves to public.leads with `source = '<path>-inquiry'`, then sends a
 * formatted notification email with a path-specific subject so the broker
 * can triage at a glance.
 */

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

const PATH_LABELS: Record<string, { subject: string; source: string; humanLabel: string }> = {
  tenant:    { subject: 'Tenant Inquiry',                  source: 'tenant-needs',      humanLabel: 'Looking for space' },
  buyer:     { subject: 'Buyer / Investment Inquiry',      source: 'buyer-inquiry',     humanLabel: 'Looking to buy' },
  seller:    { subject: 'Seller / Listing Inquiry',        source: 'owner-inquiry',     humanLabel: 'Want to sell or list' },
  pm:        { subject: 'Property Management Inquiry',     source: 'pm-inquiry',        humanLabel: 'Needs property management' },
  exploring: { subject: 'New Lead — Exploring',            source: 'exploring',         humanLabel: 'Just exploring' },
};

const FIELD_LABELS: Record<string, string> = {
  // shared
  property_types: 'Property type(s)',
  property_type: 'Property type',
  timeline: 'Timeline',
  notes: 'Notes',
  // tenant
  space_type: 'Space type(s)',
  transaction_type: 'Lease or buy',
  size: 'Size needed',
  budget: 'Monthly budget',
  submarket: 'Preferred area / zip codes',
  must_haves: 'Must-have features',
  // buyer
  acquisition_type: 'Acquisition type',
  exchange_1031: '1031 exchange?',
  submarkets: 'Preferred submarkets',
  priorities: 'Priorities',
  // seller
  value: 'Property value',
  address: 'Property address',
  goal: 'Sale priority',
  occupancy: 'Current occupancy',
  // pm
  portfolio_size: 'Portfolio size',
  current_pm: 'Current management',
  pain_point: 'Reason for change',
  portfolio_value: 'Portfolio value',
  service_area: 'Service area',
  // exploring
  interest: 'Area of interest',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, name, company, email, phone, answers, recaptchaToken, website } = body;

    // Honeypot — silent accept on bot
    if (typeof website === 'string' && website.length > 0) {
      return NextResponse.json({ success: true });
    }

    if (!path || !PATH_LABELS[path]) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 });
    }

    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Spam check failed', reason: captcha.reason }, { status: 400 });
    }

    const meta = PATH_LABELS[path];

    // Format the answers nicely for the email + DB message
    const answerSummary = Object.entries(answers ?? {})
      .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${Array.isArray(v) ? (v as string[]).join(', ') : v}`)
      .join('\n');

    // Save lead
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('leads').insert([{
        name,
        email,
        phone,
        company: company ?? null,
        source: meta.source,
        status: 'new',
        intake_data: { path, ...answers },
        message: `${meta.humanLabel}\n\n${answerSummary}`,
      }]);
    }

    // Notification email
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: getFromEmail(),
        to: NOTIFICATION_EMAIL,
        subject: `${meta.subject}: ${name}${company ? ` (${company})` : ''}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">${meta.subject} — CRECO</h2>
            <p style="color:#525252;font-style:italic;margin:0 0 16px">Path selected: <strong>${meta.humanLabel}</strong></p>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Name</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${name}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Company</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${company ?? '—'}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Email</td><td style="padding:8px 12px;border:1px solid #E8E5E0"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Phone</td><td style="padding:8px 12px;border:1px solid #E8E5E0"><a href="tel:${phone}">${phone}</a></td></tr>
            </table>
            <h3 style="color:#1A1A1A;margin-top:20px">Their Responses:</h3>
            <pre style="background:#FAFAF8;padding:12px;border-radius:4px;white-space:pre-wrap;border:1px solid #E8E5E0;font-family:monospace;font-size:13px">${answerSummary}</pre>
          </div>
        `,
      });

      // Auto-reply
      await resend.emails.send({
        from: getFromEmail(),
        to: email,
        subject: 'We received your inquiry — CRECO',
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">Hi ${name},</h2>
            <p>Thanks for reaching out to <strong>CRECO – Commercial Real Estate Company</strong>. A broker on our team will review your responses and reach out within one business day.</p>
            <p>Need to talk sooner? Call us at <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a>.</p>
            <br/>
            <p>— The CRECO Team<br/>San Antonio, TX</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Inquiry submission error:', err);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
