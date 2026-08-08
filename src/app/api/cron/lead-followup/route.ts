import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/sanitize';

/**
 * GET /api/cron/lead-followup
 *
 * Daily Vercel cron — fires the T+24hr generic follow-up email for every
 * NON-valuation lead that was created ~24 hours ago and hasn't been
 * followed up with yet. Once sent, `general_followup_sent_at` is set so
 * we never double-send.
 *
 * Why this exists:
 *   The T+0 confirmation email lands as soon as the lead submits. If the
 *   broker doesn't respond same-day (weekend, evening, backlog), the
 *   prospect hits a silence window that's the #1 cause of "did you get
 *   my message?" follow-up calls. This closes the loop with a warm
 *   check-in that (a) confirms someone is on it, (b) surfaces 2-3
 *   similar listings they can browse in the meantime, and (c) offers a
 *   direct calendar/phone route if they want to shortcut ahead.
 *
 * Separate from valuation-followup:
 *   /api/cron/valuation-followup fires at Day 3 for source='valuation-request'
 *   specifically. This job explicitly excludes that source so the two
 *   never step on each other. A valuation lead can get both:
 *     T+0  = tailored valuation confirmation (inline in /api/leads)
 *     T+24hr = this generic follow-up
 *     T+72hr = valuation-specific Day-3 follow-up
 *
 * Idempotent:
 *   The `general_followup_sent_at` column is filled atomically as the
 *   reservation step. Concurrent runs, retries, and manual triggers
 *   all converge on a single send per lead.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface FollowupRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_interest: string | null;
  source: string | null;
  message: string | null;
  created_at: string;
}

interface SimilarListing {
  title: string;
  slug: string;
  city: string | null;
  headline: string | null;
  property_type: string | null;
  transaction_type: string | null;
  sqft: number | null;
}

interface RunResult {
  ok: true;
  date: string;
  candidates_checked: number;
  followups_sent: number;
  errors: { lead_id: string; error: string }[];
  sent: { lead_id: string; email: string }[];
}

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

/**
 * Small helper — turn 3 listings into an HTML block for the email.
 * Static markup (no components) because email clients don't parse
 * React; every style is inline for Outlook/Gmail compatibility.
 */
function listingsBlockHtml(listings: SimilarListing[]): string {
  if (!listings.length) return '';
  const cards = listings.map(l => {
    const url = `https://www.crecotx.com/listings/${escapeHtml(l.slug)}`;
    const title = escapeHtml(l.title);
    const city = l.city ? escapeHtml(l.city) : 'Texas';
    const headline = l.headline ? escapeHtml(l.headline) : '';
    const sqft = l.sqft ? `${l.sqft.toLocaleString()} SF` : '';
    const txn = l.transaction_type === 'sale' ? 'For Sale' : 'For Lease';
    return `
      <a href="${url}" style="display:block;padding:14px 16px;margin:0 0 10px;background:#F8F5EE;border:1px solid #E5DED2;border-radius:8px;text-decoration:none;color:#1A1A1A">
        <div style="font-size:11px;color:#C9A962;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:4px">${txn} · ${city}</div>
        <div style="font-family:Georgia,serif;font-size:16px;font-weight:600;color:#1A1A1A;margin-bottom:4px">${title}</div>
        ${headline ? `<div style="font-size:13px;color:#525252;line-height:1.4;margin-bottom:6px">${headline}</div>` : ''}
        ${sqft ? `<div style="font-size:12px;color:#8A8A8A">${sqft}</div>` : ''}
      </a>
    `;
  }).join('');
  return `
    <p style="line-height:1.6;margin:20px 0 12px"><strong>While you wait — a few similar properties on the site right now:</strong></p>
    ${cards}
  `;
}

function followupHtml(name: string, propertyInterest: string | null, listings: SimilarListing[]): string {
  const safeName = escapeHtml(name || 'there');
  const interestLine = propertyInterest
    ? `<p style="line-height:1.6;margin:14px 0 0">You reached out about <strong>${escapeHtml(propertyInterest)}</strong> — I've got that in the queue.</p>`
    : '';

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
      <div style="margin:0 0 20px;padding:0 0 18px;border-bottom:2px solid #C9A962">
        <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
          <img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0" />
        </a>
      </div>
      <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">Checking in, ${safeName}.</h2>
      <p style="line-height:1.6">Quick note to say we got your inquiry and it&#39;s live on my end. A CRECO principal is working through the details and will follow up directly &mdash; if you haven&#39;t heard back yet, expect that reply today.</p>
      ${interestLine}
      ${listingsBlockHtml(listings)}
      <div style="margin:26px 0;padding:18px 20px;background:#1A1A1A;border-radius:10px;text-align:center">
        <p style="margin:0 0 12px;color:#FFFFFF;font-size:14px">Want to skip the wait and grab a quick call slot?</p>
        <a href="tel:+12108173443" style="display:inline-block;padding:11px 22px;background:#C9A962;color:#1A1A1A;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Call (210) 817-3443</a>
        <p style="margin:12px 0 0;color:#999;font-size:11px">Or reply to this email &mdash; we&#39;ll find a time that works.</p>
      </div>
      <p style="color:#525252;margin:24px 0 0">&mdash; The CRECO Team</p>
      <p style="color:#999;font-size:11px;margin:24px 0 0">TREC #9014367-BB &middot; 8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015</p>
    </div>
  `;
}

/**
 * Fetch 2-3 active listings that "look similar" to the lead's interest.
 * Fuzzy match on:
 *   - property_type: if the lead mentioned "warehouse", "office", "retail"
 *   - city: if the lead mentioned a Texas city name
 * Falls back to 3 recent featured listings if no match.
 */
async function findSimilarListings(
  supabase: any, // Supabase client — inferred type is version-fragile across the SDK
  propertyInterest: string | null,
  message: string | null,
): Promise<SimilarListing[]> {
  const hay = ((propertyInterest ?? '') + ' ' + (message ?? '')).toLowerCase();

  const cityMatch = ['san antonio', 'austin', 'houston', 'dallas', 'fair oaks', 'boerne', 'lytle']
    .find(c => hay.includes(c));
  const typeMatch = ['warehouse', 'office', 'retail', 'flex', 'land', 'industrial']
    .find(t => hay.includes(t));

  let query = supabase
    .from('listings')
    .select('title, slug, city, headline, property_type, transaction_type, sqft')
    .in('status', ['active', 'pending'])
    .order('featured', { ascending: false })
    .order('listing_date', { ascending: false })
    .limit(3);

  if (typeMatch) {
    // Normalize "industrial" → "warehouse" (the DB uses warehouse)
    const t = typeMatch === 'industrial' ? 'warehouse' : typeMatch;
    query = query.eq('property_type', t);
  }
  if (cityMatch) {
    query = query.ilike('city', `%${cityMatch}%`);
  }

  const { data } = await query;
  if (data && data.length >= 2) return data as SimilarListing[];

  // Fallback — any 3 featured/recent listings regardless of type
  const { data: fallback } = await supabase
    .from('listings')
    .select('title, slug, city, headline, property_type, transaction_type, sqft')
    .in('status', ['active', 'pending'])
    .order('featured', { ascending: false })
    .order('listing_date', { ascending: false })
    .limit(3);
  return (fallback as SimilarListing[] | null) ?? [];
}

export async function GET(req: NextRequest) {
  // 1. Verify caller is Vercel cron
  const expectedAuth = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  const providedAuth = req.headers.get('authorization');
  if (!expectedAuth) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (providedAuth !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Env sanity
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 503 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 503 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' }, { status: 503 });
  }

  // Service-role client — bypasses RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  // 3. Pull leads inside the T+20h to T+30h window with no follow-up yet.
  //    Window (rather than "older than 24h") caps how far back a stale
  //    cron catch-up will reach. If the cron doesn't run for 3 days and
  //    then fires, we won't blast 72-hour-old leads with a "checking in"
  //    that reads weirdly stale.
  const now = Date.now();
  const windowLow  = new Date(now - 30 * 60 * 60 * 1000).toISOString(); // 30h ago
  const windowHigh = new Date(now - 20 * 60 * 60 * 1000).toISOString(); // 20h ago

  const { data: leads, error: fetchErr } = await supabase
    .from('leads')
    .select('id, name, email, phone, property_interest, source, message, created_at')
    .neq('source', 'valuation-request')  // Handled by valuation-followup
    .is('general_followup_sent_at', null)
    .gte('created_at', windowLow)
    .lte('created_at', windowHigh)
    .limit(100);

  if (fetchErr) {
    return NextResponse.json({ error: `Could not fetch leads: ${fetchErr.message}` }, { status: 500 });
  }

  const result: RunResult = {
    ok: true,
    date: new Date().toISOString().slice(0, 10),
    candidates_checked: leads?.length ?? 0,
    followups_sent: 0,
    errors: [],
    sent: [],
  };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = getFromEmail();
  const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';

  for (const lead of (leads as FollowupRow[] | null) ?? []) {
    // 4. Reserve the follow-up slot atomically
    const reservedAt = new Date().toISOString();
    const { data: reserved, error: reserveErr } = await supabase
      .from('leads')
      .update({ general_followup_sent_at: reservedAt })
      .eq('id', lead.id)
      .is('general_followup_sent_at', null)
      .select('id')
      .single();

    if (reserveErr || !reserved) continue; // Someone else got it

    // 5. Find similar listings + send
    try {
      const similar = await findSimilarListings(supabase, lead.property_interest, lead.message);
      await resend.emails.send({
        from: fromEmail,
        to: lead.email,
        replyTo: NOTIFICATION_EMAIL,
        subject: 'Checking in on your CRECO inquiry',
        html: followupHtml(lead.name, lead.property_interest, similar),
      });
      result.sent.push({ lead_id: lead.id, email: lead.email });
      result.followups_sent += 1;
    } catch (err) {
      // Roll back reservation so tomorrow's cron retries
      await supabase
        .from('leads')
        .update({ general_followup_sent_at: null })
        .eq('id', lead.id);
      result.errors.push({
        lead_id: lead.id,
        error: err instanceof Error ? err.message : 'Unknown send error',
      });
    }
  }

  return NextResponse.json(result);
}

/** Same handler under POST too — convenient for manual testing. */
export async function POST(req: NextRequest) {
  return GET(req);
}
