import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { escapeHtml, clampString, isValidEmail, MAX_LEN } from '@/lib/sanitize';
import { pushToCrm } from '@/lib/crm';
import { findGuide } from '@/lib/guides';
import { renderGuideEmailHtml } from '@/lib/guide-email';
import { enforceRateLimit } from '@/lib/rate-limit';
import { buildSignupContext } from '@/lib/signup-context';
import { renderSubscriberNotification } from '@/lib/subscriber-notification-email';
import { renderConfirmEmail } from '@/lib/subscriber-confirm-email';
import { checkFormTiming } from '@/lib/form-timing';
import { checkEmailQuality, isOutOfMarket } from '@/lib/email-quality';
import { randomBytes } from 'node:crypto';

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
  // Per-IP rate limit. Newsletter / alert subscribes are typically
  // one-shot from a single user; 10/min handles legit edge cases
  // (a user signing up for multiple alert types from the same page)
  // while throttling scripted email-list-stuffing.
  // Tightened from 10/min. A person signs up once; the only caller who needs
  // several in a window is a script. 4 leaves room for a genuine retry after a
  // typo or a failed captcha without leaving the door open to list-stuffing.
  const limited = enforceRateLimit(req, {
    namespace: 'subscribe',
    max: 4,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await req.json();
    // Where this came from: the page (sent by useCaptureSubmit), the route in
    // (referrer), coarse geo + device (derived from this request's own
    // headers, never the raw IP). Built before validation so a rejected
    // submission still logs with its context.
    const ctx = buildSignupContext(req, body);
    const {
      email: rawEmail, name: rawName, subscription_type, filters,
      source: rawSource, asset_slug: rawAssetSlug,
      recaptchaToken, website,
    } = body;

    // Honeypot — silent accept
    if (typeof website === 'string' && website.length > 0) {
      return NextResponse.json({ success: true });
    }

    // Timing — a submission faster than a person can read the field. Answered
    // like the honeypot: success to the caller, nothing stored, so a bot gets
    // no signal about which layer caught it.
    const timing = checkFormTiming((body as Record<string, unknown>).form_rendered_at);
    if (!timing.ok) {
      console.warn('[subscribe] rejected on timing', { reason: timing.reason, elapsedMs: timing.elapsedMs });
      return NextResponse.json({ success: true });
    }

    // Email quality: shape, disposable domains, role addresses, and whether the
    // domain can receive mail at all. Unlike the silent gates above this one
    // answers honestly — a real person who typed "gmial.com" needs to be told.
    const quality = await checkEmailQuality(rawEmail, { checkMx: true });
    if (!quality.ok) {
      console.warn('[subscribe] rejected on email quality', { reason: quality.reason, domain: quality.domain });
      const message = quality.reason === 'disposable'
        ? 'Please use a permanent email address.'
        : quality.reason === 'no-mx'
          ? "That email domain can't receive mail — check the spelling?"
          : 'Valid email is required';
      return NextResponse.json({ error: message }, { status: 400 });
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

    // Newsletter and alerts require a click; a requested download does not.
    const needsConfirmation = subscription_type === 'property-alerts' || subscription_type === 'newsletter';
    const confirmToken = needsConfirmation ? randomBytes(32).toString('hex') : null;
    const outOfMarket = isOutOfMarket(
      req.headers.get('x-vercel-ip-country-region'),
      req.headers.get('x-vercel-ip-country'),
    );

    // Save to DB
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Server-side write: use the service-role key. The publishable key is the
    // browser's anon key, and the anon role no longer has INSERT on this table
    // (see supabase/rls-anon-write-lockdown.sql). Falling back to it would log a
    // row-level-security error and silently drop the submission.
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) console.error('[subscribe] SUPABASE_SERVICE_ROLE_KEY is not set — the submission cannot be stored.');
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from('subscribers').insert([{
        email,
        name: name || null,
        subscription_type,
        filters: filters ?? null,
        source: source || null,
        asset_slug: asset_slug || null,
        // Alerts and newsletter land unconfirmed and go nowhere until the link
        // in their inbox is clicked. Lead-magnet confirms itself: the guide is
        // emailed to that address, so delivery already proves reachability and
        // gating a requested download behind a second click is pure friction.
        confirmed_at: needsConfirmation ? null : new Date().toISOString(),
        confirm_token: needsConfirmation ? confirmToken : null,
        confirm_sent_at: needsConfirmation ? new Date().toISOString() : null,
        context: {
          page_path: ctx.pagePath,
          page_url: ctx.pageUrl,
          page_title: ctx.pageTitle,
          referrer: ctx.referrer,
          geo: ctx.geo,
          device: ctx.device,
          surface: clampString((body as Record<string, unknown>).surface, MAX_LEN.shortField) || null,
          // Tagged, never blocked. An out-of-state investor or a relocating
          // tenant is a real lead; this only lets triage sort them.
          out_of_market: outOfMarket || null,
          ...ctx.utm,
        },
      }]);
      // Duplicate (re-subscribe) is OK — treat as success
      if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.error('Subscriber insert error:', error.message);
      }
    }

    // Mirror to CRM under "Prospects" — but only once the address is proven.
    // An unconfirmed signup is a claim, not a contact; pushing it would put
    // exactly the junk this endpoint is meant to filter into the CRM. The
    // confirm route does this push when they click.
    if (!needsConfirmation) await pushToCrm({
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
      } else if (needsConfirmation && confirmToken) {
        // The opt-in email. Until this is clicked nothing else happens — no
        // CRM contact, no team notification, no alerts.
        const origin = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') || 'https://www.crecotx.com';
        const { subject, html } = renderConfirmEmail({
          subscriptionType: subscription_type,
          name,
          confirmUrl: `${origin}/api/subscribe/confirm?token=${confirmToken}`,
        });
        await resend.emails.send({ from: getFromEmail(), to: email, subject, html });
      }

      // Notify the team — but only for signups that are real on arrival.
      // Alerts and newsletter notify from the confirm route instead, so the
      // inbox only ever sees addresses somebody actually proved they own.
      if (subscription_type !== 'newsletter' && !needsConfirmation) {
        const { subject, html } = renderSubscriberNotification({
          subscriptionType: subscription_type,
          email,
          name,
          assetSlug: asset_slug,
          filters,
          ctx,
        });
        await resend.emails.send({ from: getFromEmail(), to: NOTIFICATION_EMAIL, subject, html });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
