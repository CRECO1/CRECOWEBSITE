import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { escapeHtml, clampString, isValidEmail, safePhone, MAX_LEN } from '@/lib/sanitize';
import { pushToCrm } from '@/lib/crm';
import { enforceRateLimit } from '@/lib/rate-limit';

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

/**
 * Tailored Day-0 confirmation email for valuation-request leads.
 * The standard "we received your inquiry" is too generic for someone who
 * just engaged with the cap-rate tool — this email previews what the full
 * broker valuation will include and primes the response.
 */
function valuationConfirmationHtml(name: string): string {
  const safeName = escapeHtml(name);
  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
      <div style="margin:0 0 20px;padding:0 0 18px;border-bottom:2px solid #C9A962">
        <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
          <img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0" />
        </a>
      </div>
      <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">Got it, ${safeName}.</h2>
      <p style="line-height:1.6">Thanks for using the CRECO valuation tool. A senior broker will follow up within one business day with a more thorough read on your property.</p>
      <p style="line-height:1.6;margin-top:16px"><strong>What the full broker valuation will cover that the preliminary range can't:</strong></p>
      <ul style="line-height:1.7;color:#3B3B3B;padding-left:20px">
        <li>Comparable Texas commercial transactions from the last 12 months in your submarket</li>
        <li>Lease analysis — WALT, tenant credit, escalators, expense recovery structure</li>
        <li>Condition adjustment — deferred capex, functional obsolescence, modernization upside</li>
        <li>Market-timing read — whether the current cycle favours a hold, list, or 1031 strategy</li>
        <li>Net-to-seller math at multiple price points if you're considering disposition</li>
      </ul>
      <p style="line-height:1.6;margin-top:20px">If anything changes about your timeline or what you need, reply to this email or call <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a>.</p>
      <p style="color:#525252;margin:24px 0 0">— The CRECO Team</p>
      <p style="color:#999;font-size:11px;margin:24px 0 0">TREC #9014367-BB · 8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015</p>
    </div>
  `;
}

/** Generic confirmation email — for everything that isn't a valuation request. */
function genericConfirmationHtml(name: string): string {
  const safeName = escapeHtml(name);
  return `
    <div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#1A1A1A">Hi ${safeName},</h2>
      <p>Thank you for reaching out to <strong>CRECO – Commercial Real Estate Company</strong>.</p>
      <p>A member of our team will be in touch within one business day.</p>
      <p>Need to talk sooner? Call us at <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a>.</p>
      <br/>
      <p>— The CRECO Team<br/>8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015</p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  // Per-IP rate limit before any parsing. See /lib/rate-limit.ts for
  // the design rationale (best-effort, defense in depth on top of
  // reCAPTCHA + honeypot). 8/min matches the inquiry endpoint — same
  // form-fill cadence assumption.
  const limited = enforceRateLimit(req, {
    namespace: 'leads',
    max: 8,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await req.json();
    const {
      name: rawName, company: rawCompany, email: rawEmail, phone: rawPhone,
      message: rawMessage, property_interest: rawPropertyInterest,
      source: rawSource, recaptchaToken, website,
      // Attribution payload — set by the client's analytics lib reading
      // the creco_attr cookie at submit time. All fields are optional;
      // anonymous direct visits will carry nothing here.
      utm_source: rawUtmSource, utm_medium: rawUtmMedium,
      utm_campaign: rawUtmCampaign, utm_term: rawUtmTerm,
      utm_content: rawUtmContent, referrer: rawReferrer,
      landing_page: rawLandingPage,
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

    // Clamp every attribution field to a safe length. These are user-
    // controllable (anyone can hand-craft utm_*), so we treat them as
    // unsafe strings and never interpolate raw into emails or HTML.
    const utm_source   = clampString(rawUtmSource,   MAX_LEN.shortField) || null;
    const utm_medium   = clampString(rawUtmMedium,   MAX_LEN.shortField) || null;
    const utm_campaign = clampString(rawUtmCampaign, MAX_LEN.shortField) || null;
    const utm_term     = clampString(rawUtmTerm,     MAX_LEN.shortField) || null;
    const utm_content  = clampString(rawUtmContent,  MAX_LEN.shortField) || null;
    const referrer     = clampString(rawReferrer,    MAX_LEN.shortField) || null;
    const landing_page = clampString(rawLandingPage, MAX_LEN.shortField) || null;

    // Anti-spam: reCAPTCHA v3 score check (no-op if RECAPTCHA_SECRET_KEY unset)
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Spam check failed', reason: captcha.reason }, { status: 400 });
    }

    let leadId: string | null = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('leads').insert([{
        name,
        email,
        phone: phone || null,
        company: company || null,
        message: message || null,
        property_interest: property_interest || null,
        source,
        status: 'new',
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        referrer, landing_page,
      }]).select('id').single();

      if (error) {
        console.error('[leads] DB insert failed:', error.message);
      } else {
        leadId = data?.id ?? null;
      }
    }

    // Mirror to external CRM (noop if CRM_WEBHOOK_URL unset). Awaiting is
    // fine — the helper has its own 5-second timeout, and we'd rather know
    // about CRM failures than fire-and-forget into the void.
    await pushToCrm({
      event: source === 'valuation-request' ? 'valuation.requested' : 'lead.created',
      lead_id: leadId,
      source,
      name,
      email,
      phone: phone || null,
      company: company || null,
      message: message || null,
      property_interest: property_interest || null,
    });

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

      // Prospect-facing confirmation. Tailored copy for valuation requests
      // (Day 0 of the valuation drip sequence); standard ack for everything
      // else. Subject line + body differ.
      const isValuation = source === 'valuation-request';
      await resend.emails.send({
        from: getFromEmail(),
        to: email,
        subject: isValuation
          ? 'Your CRECO broker valuation is on the way'
          : 'We received your inquiry — CRECO',
        html: isValuation ? valuationConfirmationHtml(name) : genericConfirmationHtml(name),
      });
    }

    return NextResponse.json({ success: true, message: 'Lead received', lead_id: leadId });
  } catch (err) {
    console.error('Lead submission error:', err);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }
}
