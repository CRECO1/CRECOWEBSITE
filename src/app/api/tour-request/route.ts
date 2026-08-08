import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { escapeHtml, clampString, isValidEmail, safePhone, MAX_LEN } from '@/lib/sanitize';
import { buildIcs } from '@/lib/ics';
import { pushToCrm } from '@/lib/crm';
import { enforceRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/tour-request
 *
 * Public-facing endpoint — visitor on a listing page submits the
 * "Schedule a tour" form. We save it as a lead (source='tour-request'),
 * send the prospect a confirmation email with an ICS calendar invite,
 * and notify the broker.
 *
 * Defenses inherited from the leads/inquiry pattern: honeypot, reCAPTCHA,
 * strict email + phone validation, input length caps, HTML-escape on
 * every interpolated value in email bodies.
 *
 * Body:
 *   { name, email, phone, listingSlug, listingTitle, listingAddress,
 *     preferredDate (YYYY-MM-DD), preferredTime (HH:MM 24h),
 *     timezone (optional), tourFormat ('in-person' | 'video' | 'either'),
 *     notes, recaptchaToken, website (honeypot) }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';
const TOUR_DURATION_MINUTES = 45;

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

/**
 * Convert a local date + time + IANA timezone to a UTC ISO string.
 * We assume CST/CDT for the rough UTC offset since DST handling for
 * arbitrary IANA zones requires Intl tricks that aren't worth it for
 * a single-region brokerage. If we ever go nationwide, swap to a real
 * timezone library.
 */
function localToIsoCentral(date: string, time: string): string {
  // Date and time format expected: YYYY-MM-DD and HH:MM (24h)
  // Build "YYYY-MM-DDTHH:MM:00" interpreted as central time → convert to UTC
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  // CDT is UTC-5, CST is UTC-6. Use a check based on the date to figure out
  // which one applies. DST in the US in 2026: second Sunday of March (Mar 8)
  // through first Sunday of November (Nov 1).
  const utcDate = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const isDst = isUsDstActive(utcDate);
  const offsetHours = isDst ? 5 : 6;   // Central time offset
  utcDate.setUTCHours(utcDate.getUTCHours() + offsetHours);
  return utcDate.toISOString();
}

function isUsDstActive(date: Date): boolean {
  const year = date.getUTCFullYear();
  // Second Sunday of March, 2am local
  const marStart = new Date(Date.UTC(year, 2, 1));
  marStart.setUTCDate(1 + ((7 - marStart.getUTCDay()) % 7) + 7);   // 2nd Sunday
  // First Sunday of November
  const novEnd = new Date(Date.UTC(year, 10, 1));
  novEnd.setUTCDate(1 + ((7 - novEnd.getUTCDay()) % 7));            // 1st Sunday
  return date >= marStart && date < novEnd;
}

export async function POST(req: NextRequest) {
  // Per-IP rate limit. Tour requests are infrequent for any one person
  // — 6/min is plenty for a real prospect filling out 1-2 tours and
  // tight enough to throttle scripted abuse.
  const limited = enforceRateLimit(req, {
    namespace: 'tour-request',
    max: 6,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await req.json();
    const {
      name: rawName, email: rawEmail, phone: rawPhone,
      listingSlug: rawSlug, listingTitle: rawTitle, listingAddress: rawAddress,
      preferredDate, preferredTime,
      tourFormat: rawFormat, notes: rawNotes,
      recaptchaToken, website,
      // Attribution payload from the creco_attr cookie via the client form.
      utm_source: rawUtmSource, utm_medium: rawUtmMedium,
      utm_campaign: rawUtmCampaign, utm_term: rawUtmTerm,
      utm_content: rawUtmContent, referrer: rawReferrer,
      landing_page: rawLandingPage,
    } = body;

    // Honeypot — silent success on bot
    if (typeof website === 'string' && website.length > 0) {
      return NextResponse.json({ success: true });
    }

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const email = (rawEmail as string).trim().toLowerCase();

    const name = clampString(rawName, MAX_LEN.name);
    const phone = safePhone(rawPhone);
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Phone is required' }, { status: 400 });

    // Date/time validation — basic shape, not full calendar correctness
    if (!preferredDate || typeof preferredDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return NextResponse.json({ error: 'Valid preferred date is required' }, { status: 400 });
    }
    if (!preferredTime || typeof preferredTime !== 'string' || !/^\d{2}:\d{2}$/.test(preferredTime)) {
      return NextResponse.json({ error: 'Valid preferred time is required' }, { status: 400 });
    }

    // Reject dates in the past (give a 1-hour grace for edge cases)
    const requestedIso = localToIsoCentral(preferredDate, preferredTime);
    const requested = new Date(requestedIso);
    if (requested.getTime() < Date.now() - 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Preferred date/time must be in the future' }, { status: 400 });
    }

    const tourFormat = (['in-person', 'video', 'either'] as const).includes(rawFormat)
      ? rawFormat as 'in-person' | 'video' | 'either'
      : 'in-person';
    const listingSlug = clampString(rawSlug, MAX_LEN.shortField);
    const listingTitle = clampString(rawTitle, MAX_LEN.shortField);
    const listingAddress = clampString(rawAddress, MAX_LEN.shortField);
    const notes = clampString(rawNotes, MAX_LEN.message);

    // reCAPTCHA (no-op if RECAPTCHA_SECRET_KEY unset)
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Spam check failed' }, { status: 400 });
    }

    // Generate a one-time confirmation token. The broker clicks a tokenized
    // URL in the notification email to confirm the tour — flips status to
    // 'tour-scheduled' and notifies the prospect. 32 bytes of random hex is
    // 256 bits of entropy — collision-resistant and unguessable.
    const confirmToken = randomBytes(32).toString('hex');

    // Save as a lead (reuses the leads table — source='tour-request' lets
    // the broker filter these out in the inbox)
    let leadId: string | null = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const messageBody = [
        `Property: ${listingTitle || '—'}`,
        `Address: ${listingAddress || '—'}`,
        `Listing: ${listingSlug ? `/listings/${listingSlug}` : '—'}`,
        `Preferred: ${preferredDate} at ${preferredTime} CT`,
        `Format: ${tourFormat}`,
        notes ? `\nNotes: ${notes}` : '',
      ].filter(Boolean).join('\n');

      // Attribution — clamped before persistence; trusted-but-verified
      // input from the client-side cookie.
      const utm_source   = clampString(rawUtmSource,   MAX_LEN.shortField) || null;
      const utm_medium   = clampString(rawUtmMedium,   MAX_LEN.shortField) || null;
      const utm_campaign = clampString(rawUtmCampaign, MAX_LEN.shortField) || null;
      const utm_term     = clampString(rawUtmTerm,     MAX_LEN.shortField) || null;
      const utm_content  = clampString(rawUtmContent,  MAX_LEN.shortField) || null;
      const referrer     = clampString(rawReferrer,    MAX_LEN.shortField) || null;
      const landing_page = clampString(rawLandingPage, MAX_LEN.shortField) || null;

      const { data, error } = await supabase.from('leads').insert([{
        name,
        email,
        phone,
        message: messageBody,
        property_interest: listingTitle || listingSlug || null,
        source: 'tour-request',
        status: 'new',
        tour_confirmation_token: confirmToken,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        referrer, landing_page,
      }]).select('id').single();
      if (error) console.error('[tour-request] DB insert failed:', error.message);
      else leadId = data?.id ?? null;
    }

    // Mirror to external CRM (noop if CRM_WEBHOOK_URL unset)
    await pushToCrm({
      event: 'tour.requested',
      lead_id: leadId,
      source: 'tour-request',
      name,
      email,
      phone,
      property_interest: listingTitle || listingSlug || null,
      listing_slug: listingSlug || null,
      message: notes || null,
      metadata: {
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        tour_format: tourFormat,
        listing_title: listingTitle || null,
        listing_address: listingAddress || null,
      },
    });

    // Build the calendar invite
    const tourLocation = tourFormat === 'video'
      ? 'Video tour — link to follow'
      : (listingAddress || listingTitle || 'CRECO commercial property');

    const ics = buildIcs({
      uid: leadId ?? `${Date.now()}-${email}`,
      title: `Tour: ${listingTitle || 'CRECO commercial property'}`,
      description: [
        `Tour scheduled with CRECO — Commercial Real Estate Company`,
        ``,
        `Property: ${listingTitle || '—'}`,
        `Address: ${listingAddress || '—'}`,
        `Format: ${tourFormat}`,
        ``,
        `CRECO contact: (210) 817-3443 · info@crecotx.com`,
        ``,
        notes ? `Your notes: ${notes}` : '',
      ].filter(Boolean).join('\n'),
      location: tourLocation,
      startIso: requestedIso,
      durationMinutes: TOUR_DURATION_MINUTES,
      organizerEmail: 'info@crecotx.com',
      organizerName: 'CRECO',
    });

    // Send emails
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const safeName = escapeHtml(name);
      const safeTitle = escapeHtml(listingTitle || 'the property');
      const safeAddress = escapeHtml(listingAddress || '');
      const safeDate = escapeHtml(preferredDate);
      const safeTime = escapeHtml(preferredTime);
      const safeFormat = escapeHtml(tourFormat);
      const safeNotes = escapeHtml(notes || '');

      // 1. Confirmation to the prospect — with ICS attached
      await resend.emails.send({
        from: getFromEmail(),
        to: email,
        replyTo: NOTIFICATION_EMAIL,
        subject: `Tour request received — ${listingTitle || 'CRECO commercial property'}`,
        html: `
          <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
            <div style="margin:0 0 20px;padding:0 0 18px;border-bottom:2px solid #C9A962">
              <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
                <img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0" />
              </a>
            </div>
            <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">Tour request received, ${safeName}.</h2>
            <p>Thanks for your interest in <strong>${safeTitle}</strong>. A CRECO broker will confirm your tour shortly — usually within an hour during business hours.</p>
            <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Property</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeTitle}</td></tr>
              ${safeAddress ? `<tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Address</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeAddress}</td></tr>` : ''}
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>When</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeDate} at ${safeTime} Central</td></tr>
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Format</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeFormat}</td></tr>
            </table>
            ${safeNotes ? `<p style="background:#FAFAF8;padding:12px;border-left:3px solid #C9A962;margin:0 0 20px"><strong>Your notes:</strong><br/>${safeNotes}</p>` : ''}
            <p style="margin:20px 0;color:#525252">📎 A calendar invite is attached — open it on your phone or computer to add the tour to your calendar.</p>
            <p style="margin:20px 0;color:#525252">Need to reschedule or have questions? Reply to this email or call <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a>.</p>
            <br/>
            <p style="color:#525252;margin:0">— The CRECO Team</p>
            <p style="color:#999;font-size:11px;margin:24px 0 0">TREC #9014367-BB · 8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015</p>
          </div>
        `,
        attachments: [
          {
            filename: 'tour.ics',
            content: Buffer.from(ics, 'utf-8'),
            contentType: 'text/calendar; charset=utf-8',
          },
        ],
      });

      // 2. Broker notification — internal-only, includes one-click confirm
      //    URL the broker can hit to flip the lead to 'tour-scheduled' and
      //    fire a confirmation email to the prospect automatically.
      const confirmUrl = `https://www.crecotx.com/api/tour-confirm?token=${confirmToken}`;
      await resend.emails.send({
        from: getFromEmail(),
        to: NOTIFICATION_EMAIL,
        subject: `🏢 Tour requested: ${listingTitle || listingSlug || 'Property'} — ${name}`,
        html: `
          <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
            <h2 style="color:#1A1A1A">New Tour Request — CRECO</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Property</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeTitle}${listingSlug ? ` · <a href="https://www.crecotx.com/listings/${escapeHtml(listingSlug)}">view listing</a>` : ''}</td></tr>
              ${safeAddress ? `<tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Address</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeAddress}</td></tr>` : ''}
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>When</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeDate} at ${safeTime} Central</td></tr>
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Format</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeFormat}</td></tr>
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Name</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeName}</td></tr>
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Email</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Phone</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
              ${safeNotes ? `<tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Notes</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0;white-space:pre-line">${safeNotes}</td></tr>` : ''}
            </table>
            <div style="margin:24px 0;padding:18px 20px;background:#1A1A1A;border-radius:10px;text-align:center">
              <p style="margin:0 0 12px;color:#FFFFFF;font-size:14px">
                ✅ <strong>One-click confirm</strong> — sends the prospect a confirmation email + flips the lead to <code style="background:#3B3B3B;padding:2px 6px;border-radius:3px;color:#C9A962">tour-scheduled</code>.
              </p>
              <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#C9A962;color:#1A1A1A;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
                Confirm this tour →
              </a>
              <p style="margin:12px 0 0;color:#999;font-size:11px">Link is single-use. If you'd rather reschedule, just call the prospect directly.</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: 'tour.ics',
            content: Buffer.from(ics, 'utf-8'),
            contentType: 'text/calendar; charset=utf-8',
          },
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Tour request error:', err);
    return NextResponse.json({ error: 'Failed to submit tour request' }, { status: 500 });
  }
}
