import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/sanitize';

/**
 * GET /api/cron/tour-followup
 *
 * Daily Vercel cron. Recovers tour-request leads where the operator
 * hasn't yet taken action (status still 'new'). A tour request is a
 * high-intent signal — if no broker has reached out within a day,
 * the lead is cooling fast. This cron sends a gentle multi-touch
 * sequence so the visitor doesn't fall through the cracks.
 *
 * Sequence (proxy for "broker hasn't responded" = lead status is 'new'):
 *
 *   Day 0   — /api/tour-request fires the original confirmation +
 *             calendar invite immediately.
 *   Day 1   — this cron: "Quick check-in — we got your request, here's
 *             when we can set up the tour."
 *   Day 3   — this cron: "Following up. Still interested in this property?
 *             If so, here's a couple of times that work."
 *   Day 7   — this cron: "Last check — we've got similar properties in
 *             [submarket]. Want us to send those instead?"
 *
 * Once Day 7 fires the sequence stops. If the operator marks the lead
 * 'in-progress' or 'closed' at any point, the cron stops nurturing
 * automatically (the lead drops out of the candidate query).
 *
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}`.
 * DB access uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
 * Idempotent: re-runs same day are safe — follow_up_stage gates each
 * lead to a single email per stage, forever.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Stage = 'day-1' | 'day-3' | 'week-1';

interface FollowupRow {
  id: string;
  name: string | null;
  email: string;
  property_interest: string | null;
  message: string | null;
  follow_up_stage: Stage | null;
  created_at: string;
}

interface RunResult {
  ok: true;
  date: string;
  candidates_checked: number;
  followups_sent: number;
  errors: { lead_id: string; error: string }[];
  sent: { lead_id: string; email: string; stage: Stage }[];
}

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

/**
 * Pick the next stage to send for this lead given its current stage +
 * age in days. Returns null when nothing is due (either too soon for
 * the next stage, or the sequence is already complete at week-1).
 */
function nextStageFor(currentStage: Stage | null, ageDays: number): Stage | null {
  if (!currentStage && ageDays >= 1) return 'day-1';
  if (currentStage === 'day-1' && ageDays >= 3) return 'day-3';
  if (currentStage === 'day-3' && ageDays >= 7) return 'week-1';
  return null;
}

function followupSubject(stage: Stage, propertyContext: string): string {
  switch (stage) {
    case 'day-1':
      return `Quick check on your tour request${propertyContext ? ` for ${propertyContext}` : ''}`;
    case 'day-3':
      return `Still interested in touring${propertyContext ? ` ${propertyContext}` : ' that property'}?`;
    case 'week-1':
      return `Last check on your tour request — happy to send alternatives`;
  }
}

function followupHtml(stage: Stage, name: string, propertyInterest: string | null): string {
  const safeName = escapeHtml(name || 'there');
  const property = propertyInterest ? escapeHtml(propertyInterest) : null;
  const propertyLine = property ? ` for <strong>${property}</strong>` : '';

  let body = '';
  switch (stage) {
    case 'day-1':
      body = `
        <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">Quick check-in, ${safeName}.</h2>
        <p style="line-height:1.6">Just confirming we got your tour request${propertyLine} yesterday. A CRECO broker is lining up a window — typically Tuesday or Thursday late-morning if those work, otherwise reply with what does and we'll match it.</p>
        <p style="line-height:1.6">If something's changed and you don't need the tour anymore, that's fine — just reply "skip" and we won't bug you again. Otherwise we'll have a confirmation out shortly.</p>
      `;
      break;
    case 'day-3':
      body = `
        <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">Still interested, ${safeName}?</h2>
        <p style="line-height:1.6">Following up on your tour request${propertyLine}. We've held a couple windows open this week and can stretch into next if needed.</p>
        <p style="line-height:1.6"><strong>Reply with a day/time that works</strong> and we'll lock it in. If your situation has changed — different size, different submarket, decided to wait — let us know and we can re-aim from there.</p>
      `;
      break;
    case 'week-1':
      body = `
        <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">One last check, ${safeName}.</h2>
        <p style="line-height:1.6">Haven't heard back on your tour request${propertyLine}, so this is the last nudge from me — promise.</p>
        <p style="line-height:1.6">If you're still in the market, even passively, the easiest move is to <a href="https://www.crecotx.com/property-alerts" style="color:#A68B4B;font-weight:600">set up property alerts</a> so similar properties land in your inbox automatically. No more "did I miss it" — we'll just send what fits.</p>
        <p style="line-height:1.6">Or if you'd rather just talk, reply to this email or call <a href="tel:+12108173443" style="color:#A68B4B;font-weight:600">(210) 817-3443</a>.</p>
      `;
      break;
  }

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
      <div style="margin:0 0 20px;padding:0 0 18px;border-bottom:2px solid #C9A962">
        <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
          <img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0" />
        </a>
      </div>
      ${body}
      <p style="line-height:1.6;margin-top:24px;color:#525252">— The CRECO Team</p>
      <p style="color:#999;font-size:11px;margin:18px 0 0">TREC #9014367-BB · 8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015 · (210) 817-3443</p>
    </div>
  `;
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 503 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Candidate set: tour-request leads still in the active funnel
  // (operator hasn't acted) created 1-30 days ago. Older than 30 days
  // and the sequence is presumed long-complete; we don't want to
  // suddenly re-engage stale leads when the schema first lands.
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: leads, error: fetchErr } = await supabase
    .from('leads')
    .select('id, name, email, property_interest, message, follow_up_stage, created_at')
    .eq('source', 'tour-request')
    .in('status', ['new'])
    .gte('created_at', cutoff);

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

  for (const lead of (leads ?? []) as FollowupRow[]) {
    // Defensive: a lead row without a usable email can't be followed up.
    // The schema column is NOT NULL but the type widens to string|null
    // through the .select() helper; skip + log instead of crashing the
    // run. This also catches whitespace-only entries that slipped past
    // earlier validation.
    if (!lead.email || !lead.email.trim()) {
      result.errors.push({ lead_id: lead.id, error: 'EMPTY_EMAIL' });
      continue;
    }
    const ageDays = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (24 * 60 * 60 * 1000));
    const stage = nextStageFor(lead.follow_up_stage, ageDays);
    if (!stage) continue;

    try {
      const subject = followupSubject(stage, lead.property_interest ?? '');
      const html = followupHtml(stage, lead.name ?? '', lead.property_interest);

      await resend.emails.send({
        from: getFromEmail(),
        to: lead.email,
        replyTo: process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com',
        subject,
        html,
      });

      const { error: updErr } = await supabase
        .from('leads')
        .update({
          follow_up_stage: stage,
          last_follow_up_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
      if (updErr) {
        // Email already sent — log + count as error so we can investigate
        // duplicate-send risk, but don't roll back (we can't unsend).
        console.error('[tour-followup] update failed after send', { id: lead.id, msg: updErr.message });
        result.errors.push({ lead_id: lead.id, error: `UPDATE_FAILED after send: ${updErr.message}` });
        continue;
      }

      result.followups_sent++;
      result.sent.push({ lead_id: lead.id, email: lead.email, stage });
    } catch (err) {
      result.errors.push({
        lead_id: lead.id,
        error: err instanceof Error ? err.message : 'Unknown send error',
      });
    }
  }

  return NextResponse.json(result);
}
