import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/sanitize';

/**
 * GET /api/cron/valuation-followup
 *
 * Daily Vercel cron — fires the Day-3 follow-up email for every
 * valuation-request lead that was created 3+ days ago and hasn't been
 * followed up with yet. Once sent, the `valuation_followup_sent_at`
 * column on the lead is set so we never double-send.
 *
 * The follow-up sequence:
 *   Day 0 — handled inline in /api/leads/route.ts: tailored confirmation
 *           describing what the full broker valuation will cover.
 *   Day 3 — this cron: nudges the prospect with a "still thinking it
 *           through?" message and links back to the broker conversation
 *           if they're ready to dig in.
 *
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}` on cron calls.
 *
 * DB access uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) because the
 * cron isn't authenticated as any user.
 *
 * Idempotent: safe to re-run the same day. The `valuation_followup_sent_at`
 * timestamp gates each lead to a single follow-up forever.
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
  message: string | null;
  created_at: string;
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

function followupHtml(name: string, propertyInterest: string | null): string {
  const safeName = escapeHtml(name || 'there');
  const propertyContext = propertyInterest
    ? `<p style="line-height:1.6">Specifically for <strong>${escapeHtml(propertyInterest)}</strong> — we'd review the lease structure, pull comps from the last 12 months of trades in that submarket, and give you a tighter range than the preliminary number.</p>`
    : '';

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
      <div style="margin:0 0 20px;padding:0 0 18px;border-bottom:2px solid #C9A962">
        <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
          <img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0" />
        </a>
      </div>
      <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">Quick follow-up, ${safeName}.</h2>
      <p style="line-height:1.6">You ran our preliminary valuation a few days ago. I wanted to circle back — most owners use the preliminary number as a starting point for a conversation rather than a list price, and the next step (if you're open to it) is a real broker valuation with comps, lease analysis, and condition adjustments.</p>
      ${propertyContext}
      <p style="line-height:1.6;margin-top:14px"><strong>Three things the full broker valuation tells you that the preliminary range can't:</strong></p>
      <ul style="line-height:1.7;color:#3B3B3B;padding-left:20px">
        <li>Where the realistic top of the price range actually lives — the preliminary midpoint is conservative on purpose</li>
        <li>Whether 2026 is the right window to list or whether waiting 12-18 months unlocks more value</li>
        <li>If you're 1031-ing, what replacement properties are currently available that fit your basis and timeline</li>
      </ul>
      <p style="line-height:1.6;margin-top:18px">There's no charge for the conversation or the broker valuation — owners considering disposition usually only need the analysis once, and we'd rather earn the listing engagement on quality work than nickel-and-dime the diligence.</p>
      <div style="margin:24px 0;padding:18px 20px;background:#1A1A1A;border-radius:10px;text-align:center">
        <p style="margin:0 0 12px;color:#FFFFFF;font-size:14px">Want to walk through the property and the numbers together?</p>
        <a href="https://www.crecotx.com/sell" style="display:inline-block;padding:11px 22px;background:#C9A962;color:#1A1A1A;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Request the full broker valuation →</a>
        <p style="margin:12px 0 0;color:#999;font-size:11px">Or reply to this email — I'll find a time that works.</p>
      </div>
      <p style="line-height:1.6;margin-top:14px">If now isn't the right moment, no worries — I'll close the loop on my end and you can always reach back out when timing makes sense. Either way, glad you used the tool.</p>
      <p style="color:#525252;margin:24px 0 0">— The CRECO Team</p>
      <p style="color:#999;font-size:11px;margin:24px 0 0">TREC #9014367-BB · 8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015</p>
    </div>
  `;
}

export async function GET(req: NextRequest) {
  // 1. Verify caller is Vercel cron (or a legitimate manual trigger w/ secret)
  const expectedAuth = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  const providedAuth = req.headers.get('authorization');
  if (!expectedAuth) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (providedAuth !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Sanity-check the rest of the env
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' },
      { status: 503 },
    );
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

  // 3. Pull valuation-request leads created 3+ days ago, no follow-up yet
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: leads, error: fetchErr } = await supabase
    .from('leads')
    .select('id, name, email, phone, property_interest, message, created_at')
    .eq('source', 'valuation-request')
    .is('valuation_followup_sent_at', null)
    .lte('created_at', threeDaysAgo)
    .limit(100);

  if (fetchErr) {
    return NextResponse.json(
      { error: `Could not fetch leads: ${fetchErr.message}` },
      { status: 500 },
    );
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
    // 4. Reserve the follow-up slot atomically — only one row should
    //    flip from null to a timestamp, so a re-run never double-sends.
    const reservedAt = new Date().toISOString();
    const { data: reserved, error: reserveErr } = await supabase
      .from('leads')
      .update({ valuation_followup_sent_at: reservedAt })
      .eq('id', lead.id)
      .is('valuation_followup_sent_at', null)
      .select('id')
      .single();

    if (reserveErr || !reserved) {
      // Someone (another cron run, or a manual touch) already sent it.
      continue;
    }

    // 5. Send
    try {
      await resend.emails.send({
        from: fromEmail,
        to: lead.email,
        replyTo: NOTIFICATION_EMAIL,
        subject: 'Following up on your CRECO valuation',
        html: followupHtml(lead.name, lead.property_interest),
      });
      result.sent.push({ lead_id: lead.id, email: lead.email });
      result.followups_sent += 1;
    } catch (err) {
      // Roll back the timestamp so tomorrow's cron retries
      await supabase
        .from('leads')
        .update({ valuation_followup_sent_at: null })
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
