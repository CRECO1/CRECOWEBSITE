import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { escapeHtml, clampString, isValidEmail, MAX_LEN } from '@/lib/sanitize';
import { pushToCrm } from '@/lib/crm';
import { findGuide } from '@/lib/guides';
import { renderGuideEmailHtml } from '@/lib/guide-email';

/**
 * Unified subscribe endpoint — handles all 3 subscription types:
 *   - newsletter      (footer signup, /insights signup)
 *   - property-alerts (filter-driven listing alerts)
 *   - lead-magnet     (gated PDF/guide download)
 *
 * Inserts into public.subscribers, fires a confirmation email to the new
 * subscriber, and (for property-alerts and lead-magnet) notifies the team.
 *
 * For lead-magnet specifically we look up the guide by slug and email
 * the full content as a styled HTML body — so the prospect has a
 * keepable artifact in their inbox, not just an unlock-on-page session.
 *
 * Honeypot + reCAPTCHA + email validation all wired in like the leads
 * endpoint. If a subscriber re-submits with the same email + type, the
 * unique index lets the conflict bubble up — we treat it as success
 * (re-confirmation) rather than an error.
 *
 * All user-controlled values are escaped before being interpolated into
 * the HTML email bodies. Email is also validated strictly so it can't
 * carry header-injection payloads into Resend.
 */

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

const VALID_TYPES = ['newsletter', 'property-alerts', 'lead-magnet'] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email: rawEmail, name: rawName, subscription_type, filters,
      source: rawSource, asset_slug: rawAssetSlug,
      recaptchaToken, website,
    } = body;

    // Honeypot — silent accept
    if (typeof website === 'string' && website.length > 0) {
      return NextResponse.json({ success: true });
    }

    // Strict email validation — also rejects newline/whitespace that could
    // become a header-injection vector if forwarded to a raw SMTP header.
    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    if (!subscription_type || !VALID_TYPES.includes(subscription_type)) {
      return NextResponse.json({ error: 'Invalid subscription_type' }, { status: 400 });
    }

    // Clamp + sanitize all other user-controlled string inputs
    const name = clampString(rawName, MAX_LEN.name);
    const source = clampString(rawSource, MAX_LEN.shortField);
    const asset_slug = clampString(rawAssetSlug, MAX_LEN.shortField);

    // Cap the filters JSONB payload size so a poisoned URL can't write
    // a multi-megabyte blob into subscribers.filters. 2KB is generous
    // for legitimate filters (property_types + submarkets + size range +
    // a search term is well under 500 bytes in practice).
    if (filters !== null && filters !== undefined) {
      let filtersJson: string;
      try {
        filtersJson = JSON.stringify(filters);
      } catch {
        return NextResponse.json({ error: 'Invalid filters payload' }, { status: 400 });
      }
      if (filtersJson.length > 2048) {
        return NextResponse.json({ error: 'Filters payload too large' }, { status: 413 });
      }
    }

    // reCAPTCHA — fail-open if not configured
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Spam check failed' }, { status: 400 });
    }

    // Save to DB
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from('subscribers').insert([{
        email,
        name: name || null,
        subscription_type,
        filters: filters ?? null,
        source: source || null,
        asset_slug: asset_slug || null,
      }]);
      // Duplicate (re-subscribe) is OK — treat as success
      if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.error('Subscriber insert error:', error.message);
      }
    }

    // Mirror to CRM under "Prospects" — even newsletter subscribers count,
    // they're top-of-funnel and the broker may want to see them.
    await pushToCrm({
      event: 'subscriber.created',
      source: source || subscription_type,
      name: name || null,
      email,
      subscription_type,
      asset_slug: asset_slug || null,
      filters: filters ?? null,
    });

    // Confirmation email to the subscriber
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Lead-magnet gets the full guide content as a keepable HTML email.
      // Other types get a short confirmation note.
      if (subscription_type === 'lead-magnet' && asset_slug) {
        const guide = findGuide(asset_slug);
        if (guide) {
          await resend.emails.send({
            from: getFromEmail(),
            to: email,
            subject: `${guide.title} — your CRECO download`,
            html: renderGuideEmailHtml({ guide, recipientName: name || '' }),
          });
        } else {
          // Slug didn't match a known guide — fall back to generic ack so
          // the user still gets *something* and we don't 500 their unlock.
          console.warn('[subscribe] unknown guide slug:', asset_slug);
          await resend.emails.send({
            from: getFromEmail(),
            to: email,
            subject: 'Your CRECO download is unlocked',
            html: `
              <div style="font-family:sans-serif;max-width:600px">
                <h2 style="color:#1A1A1A">Hi ${escapeHtml(name || 'there')},</h2>
                <p>Your CRECO download is unlocked on the page you came from. If you'd like a re-share, just reply to this email.</p>
                <p>— The CRECO Team</p>
              </div>
            `,
          });
        }
      } else {
        const subjects = {
          'newsletter': 'Welcome to CRECO Insights',
          'property-alerts': "We'll send you matching Texas properties",
        };
        const bodies = {
          'newsletter': `<p>Thanks for subscribing to CRECO Insights. You'll receive market analysis, deal commentary, and Texas commercial real estate strategy roughly once a month — no spam, no fluff.</p>`,
          'property-alerts': `<p>You're set up to receive property alerts. As soon as a Texas commercial property matching your filters hits the CRECO listings, we'll send it your way.</p><p>Filters you set:</p><pre style="background:#FAFAF8;padding:12px;border-radius:4px">${escapeHtml(JSON.stringify(filters ?? {}, null, 2))}</pre>`,
        };
        const safeName = name || 'there';
        await resend.emails.send({
          from: getFromEmail(),
          to: email,
          subject: subjects[subscription_type as keyof typeof subjects],
          html: `
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#1A1A1A">Hi ${escapeHtml(safeName)},</h2>
              ${bodies[subscription_type as keyof typeof bodies]}
              <br/>
              <p>— The CRECO Team<br/>8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015 · <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a></p>
            </div>
          `,
        });
      }

      // Notify the team for property-alerts and lead-magnet (not for
      // newsletter — too noisy). The CRM mirror above handles per-lead
      // tracking; this email is just the at-a-glance heads up.
      if (subscription_type !== 'newsletter') {
        await resend.emails.send({
          from: getFromEmail(),
          to: NOTIFICATION_EMAIL,
          subject: `New ${subscription_type} subscriber: ${email}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#1A1A1A">New subscriber — ${escapeHtml(subscription_type)}</h2>
              <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
              ${name ? `<p><strong>Name:</strong> ${escapeHtml(name)}</p>` : ''}
              ${source ? `<p><strong>Signed up from:</strong> ${escapeHtml(source)}</p>` : ''}
              ${asset_slug ? `<p><strong>Asset:</strong> ${escapeHtml(asset_slug)}</p>` : ''}
              ${filters ? `<p><strong>Filters:</strong></p><pre style="background:#FAFAF8;padding:12px;border-radius:4px">${escapeHtml(JSON.stringify(filters, null, 2))}</pre>` : ''}
            </div>
          `,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
