import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { escapeHtml, clampString, isValidEmail, safePhone, MAX_LEN } from '@/lib/sanitize';

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';

// Resolved at request time (not module load) so env var changes from Vercel
// take effect on next deploy without code changes. Defaults to Resend's free
// shared sender; once the domain is verified set RESEND_FROM_VERIFIED=true
// (or override via RESEND_FROM_EMAIL) to send from noreply@crecotx.com.
function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name: rawName, company: rawCompany, email: rawEmail, phone: rawPhone,
      message: rawMessage, property_interest: rawPropertyInterest,
      source: rawSource, recaptchaToken, website,
    } = body;

    // Honeypot — `website` is an invisible field; if filled it's almost
    // certainly a bot. Return 200 OK so the bot thinks it succeeded and
    // doesn't retry with a different strategy.
    if (typeof website === 'string' && website.length > 0) {
      return NextResponse.json({ success: true, message: 'Lead received' });
    }

    // Strict email validation — also rejects header-injection-style strings.
    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const name = clampString(rawName, MAX_LEN.name);
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Sanitize / clamp all other user-controlled inputs before they hit DB
    // or get interpolated into HTML emails.
    const company = clampString(rawCompany, MAX_LEN.company);
    const phone = safePhone(rawPhone);
    const message = clampString(rawMessage, MAX_LEN.message);
    const property_interest = clampString(rawPropertyInterest, MAX_LEN.shortField);
    const source = clampString(rawSource, MAX_LEN.shortField) || 'contact';

    // Anti-spam: reCAPTCHA v3 score check (no-op if RECAPTCHA_SECRET_KEY unset)
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Spam check failed', reason: captcha.reason }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('leads').insert([{
        name,
        company: company || null,
        email,
        phone: phone || null,
        message: message || null,
        property_interest: property_interest || null,
        source,
        status: 'new',
      }]);
    }

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // All interpolated values escaped — even though our broker is the only
      // recipient of the notification, we don't want a malicious submission
      // to be able to inject markup into the inbox view.
      await resend.emails.send({
        from: getFromEmail(),
        to: NOTIFICATION_EMAIL,
        subject: `New Lead: ${name} — ${source}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">New Lead — CRECO</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Name</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${escapeHtml(name)}</td></tr>
              ${company ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Company</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${escapeHtml(company)}</td></tr>` : ''}
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Email</td><td style="padding:8px 12px;border:1px solid #E8E5E0"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Phone</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${escapeHtml(phone || '—')}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Source</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${escapeHtml(source)}</td></tr>
              ${property_interest ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Property</td><td style="padding:8px 12px;border:1px solid #E8E5E0">${escapeHtml(property_interest)}</td></tr>` : ''}
              ${message ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#FAFAF8;border:1px solid #E8E5E0">Message</td><td style="padding:8px 12px;border:1px solid #E8E5E0;white-space:pre-line">${escapeHtml(message)}</td></tr>` : ''}
            </table>
          </div>
        `,
      });

      await resend.emails.send({
        from: getFromEmail(),
        to: email,
        subject: 'We received your inquiry — CRECO',
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">Hi ${escapeHtml(name)},</h2>
            <p>Thank you for reaching out to <strong>CRECO – Commercial Real Estate Company</strong>.</p>
            <p>A member of our team will be in touch within one business day.</p>
            <p>Need to talk sooner? Call us at <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a>.</p>
            <br/>
            <p>— The CRECO Team<br/>8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015</p>
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
