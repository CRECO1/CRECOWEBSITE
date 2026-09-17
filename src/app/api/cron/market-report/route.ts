import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

/**
 * GET /api/cron/market-report
 *
 * Fully-automated quarterly market-report send. Runs daily via the cron
 * dispatcher; does nothing unless the designated CRM campaign is "armed".
 *
 * How it works — a one-control workflow for the operator:
 *   1. The content + schedule live on ONE CRM campaign named
 *      "Quarterly Market Report" (commercial workspace). Edit its subject
 *      and body in the normal campaign editor each quarter.
 *   2. When you're ready, set that campaign's Send Date to when it should
 *      go out. That's the only trigger.
 *   3. On/after that date this cron emails the CURRENT "Market Report"
 *      subscriber segment (so new signups are automatically included — no
 *      manual enrollment), then CLEARS the send date so it never repeats.
 *      Next quarter, update the content and set a new Send Date.
 *
 * Idempotent: the send date is cleared with a conditional update BEFORE
 * sending, so a re-run (or the daily dispatcher firing again) finds it
 * disarmed and does nothing. `?dry=1` reports the recipient count without
 * claiming or sending — safe to call anytime.
 *
 * Auth: Vercel/dispatcher sets `Authorization: Bearer ${CRON_SECRET}`.
 * Data: the CRM (FORG) Supabase via CRM_SUPABASE_* (service role, bypasses RLS).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CAMPAIGN_NAME = 'Quarterly Market Report';
// The CRM owns the unsubscribe endpoint (sets crm_clients.unsubscribed_at by token).
const UNSUB_BASE = 'https://www.fairoaksrealtygroup.com';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

function crmClient() {
  const url = process.env.CRM_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.CRM_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

type Crm = NonNullable<ReturnType<typeof crmClient>>;

/**
 * crm_campaign_sends.enrollment_id is NOT NULL — the send-log is modeled
 * around enrollments. This cron targets a DYNAMIC segment (no manual
 * enrollment), so we lazily materialize a passive enrollment row per
 * recipient (active:false) the first time we log a send to them. Idempotent:
 * reuses the existing enrollment on later quarters. Returns null on failure —
 * logging is best-effort and must never block the actual email.
 */
async function ensureEnrollment(supabase: Crm, campaignId: string, clientId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('crm_campaign_enrollments')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('client_id', clientId)
    .limit(1);
  if (existing && existing.length) return existing[0].id as string;
  const { data: created } = await supabase
    .from('crm_campaign_enrollments')
    .insert([{ campaign_id: campaignId, client_id: clientId, active: false }])
    .select('id');
  return created?.[0]?.id ?? null;
}

interface Recipient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email: string;
  unsubscribe_token: string | null;
}

function applyMerge(template: string, c: Recipient): string {
  // Commercial contacts are often companies with no person name — fall back
  // to the business, then a plain greeting, so we never send "Hi ,".
  const greeting = (c.first_name || '').trim() || (c.business_name || '').trim() || 'there';
  const unsubscribeUrl = `${UNSUB_BASE}/api/campaigns/unsubscribe?token=${c.unsubscribe_token ?? ''}`;
  return template
    .replaceAll('{{first_name}}', greeting)
    .replaceAll('{{last_name}}', c.last_name || '')
    .replaceAll('{{full_name}}', `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || (c.business_name || 'there'))
    .replaceAll('{{email}}', c.email || '')
    .replaceAll('{{client_type}}', 'Broker')
    .replaceAll('{{brokerage}}', 'CRECO')
    .replaceAll('{{agent_name}}', 'Zachary Stovall')
    // The public contact address, matching every other surface (BUSINESS.email,
    // PRIMARY_BROKER.email, the syndication feed). Note the replyTo on the send
    // below is deliberately still zack@ — that routes replies to Zack directly
    // and is a delivery setting, not something the recipient reads.
    .replaceAll('{{agent_email}}', 'info@crecotx.com')
    .replaceAll('{{agent_phone}}', '210-817-3443')
    .replaceAll('{{unsubscribe_url}}', unsubscribeUrl);
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const supabase = crmClient();
  if (!supabase) return NextResponse.json({ error: 'CRM Supabase not configured' }, { status: 503 });

  const today = new Date().toISOString().slice(0, 10);

  // 1. Designated campaign = content + schedule
  const { data: camps, error: campErr } = await supabase
    .from('crm_campaigns')
    .select('id, email_subject, email_body, send_date')
    .eq('business_unit', 'commercial')
    .eq('name', CAMPAIGN_NAME)
    .limit(1);
  if (campErr) return NextResponse.json({ ok: false, error: 'campaign lookup failed' }, { status: 500 });
  const campaign = camps?.[0];
  if (!campaign) return NextResponse.json({ ok: true, armed: false, reason: 'no "Quarterly Market Report" campaign found' });
  if (!campaign.send_date || campaign.send_date > today) {
    return NextResponse.json({ ok: true, armed: false, send_date: campaign.send_date, today });
  }

  // 2. Current Market Report segment (dynamic — new signups auto-included)
  const { data: recips } = await supabase
    .from('crm_clients')
    .select('id, first_name, last_name, business_name, email, unsubscribe_token')
    .eq('business_unit', 'commercial')
    .contains('tags', ['Market Report'])
    .is('unsubscribed_at', null)
    .not('email', 'is', null);
  const list = (recips ?? []).filter((c): c is Recipient => !!c.email && c.email.includes('@'));

  if (dry) {
    return NextResponse.json({ ok: true, dry: true, armed: true, would_send: list.length, send_date: campaign.send_date, subject: campaign.email_subject });
  }

  // 3. Claim the send by clearing the date — only if still armed for THIS date.
  //    A concurrent/re-run then sees send_date=null and no-ops (idempotent).
  const { data: claimed } = await supabase
    .from('crm_campaigns')
    .update({ send_date: null })
    .eq('id', campaign.id)
    .eq('send_date', campaign.send_date)
    .select('id');
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ ok: true, armed: false, reason: 'already sent / claimed by a concurrent run' });
  }

  // 4. Send
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = getFromEmail();
  let sent = 0;
  const errors: { email: string; error: string }[] = [];
  for (const c of list) {
    try {
      const html = applyMerge(campaign.email_body || '', c);
      const subject = applyMerge(campaign.email_subject || 'CRECO — Texas Commercial Market Report', c);
      const result = await resend.emails.send({ from, to: c.email, subject, html, replyTo: 'zack@crecotx.com' });
      sent++;
      // Best-effort send log so it shows in the CRM campaign history. Requires
      // an enrollment_id (NOT NULL) — materialize a passive one if needed.
      // Never let a logging failure surface as a send failure.
      try {
        const enrollmentId = await ensureEnrollment(supabase, campaign.id, c.id);
        if (enrollmentId) {
          await supabase.from('crm_campaign_sends').insert([{
            campaign_id: campaign.id, client_id: c.id, enrollment_id: enrollmentId,
            type: 'email', status: 'sent', subject,
            provider_id: result.data?.id ?? null,
          }]);
        }
      } catch { /* no-op */ }
    } catch (e) {
      errors.push({ email: c.email, error: (e as Error).message?.slice(0, 140) ?? 'send failed' });
    }
  }

  return NextResponse.json({ ok: true, sent, total: list.length, errors, sent_for_date: campaign.send_date });
}
