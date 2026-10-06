/**
 * POST /api/owner-report — events from a personalized owner report (/r/<token>).
 *
 *   { token, type: 'view' }                         the owner opened their report
 *   { token, type: 'bov', interest?, phone? }       they asked for a Broker Opinion of Value
 *
 * A first view alerts the team and logs a note on the CRM contact — an owner
 * reading their own numbers is the warmest signal outbound gets. A request
 * becomes a call task for the contact's owner plus an alert. Everything is
 * keyed by the token; nothing here trusts client-sent identity.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { enforceRateLimit } from '@/lib/rate-limit';
import { crmAdminClient } from '@/lib/crm';
import { matchCrawler } from '@/lib/crawler-hits';
import { TOKEN_RE, displayEntity, usd } from '@/lib/owner-report';
import { getLeadOwner } from '@/lib/broker';
import { leadAlertRecipients } from '@/lib/lead-owner';
import { escapeHtml, safePhone } from '@/lib/sanitize';

const CRM_URL = 'https://www.fairoaksrealtygroup.com/crm/commercial';
const INTERESTS = new Set(['Selling', 'Leasing up space', '1031 / refinancing', 'Just keeping tabs']);

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

function todayCentral(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

type Client = { id: string; first_name: string | null; last_name: string | null; business_name: string | null; email: string | null; phone: string | null; agent_id: string | null; tags: string[] | null };

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { namespace: 'owner-report', max: 20, windowMs: 60_000 });
  if (limited) return limited;

  let body: { token?: unknown; type?: unknown; interest?: unknown; phone?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad request' }, { status: 400 }); }
  const token = typeof body.token === 'string' ? body.token : '';
  const type = body.type === 'view' || body.type === 'bov' ? body.type : null;
  if (!TOKEN_RE.test(token) || !type) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  // Crawlers and link scanners never count as the owner.
  const ua = req.headers.get('user-agent') ?? '';
  if (type === 'view' && (matchCrawler(ua) || /bot|crawl|spider|headless|preview|scan/i.test(ua))) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const db = crmAdminClient();
  if (!db) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const { data: report } = await db
    .from('crm_owner_reports')
    .select('id, client_id, owner_entity, contact_name, properties, view_count, first_viewed_at, bov_requested_at')
    .eq('token', token)
    .maybeSingle();
  if (!report) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { data: client } = report.client_id
    ? await db.from('crm_clients').select('id, first_name, last_name, business_name, email, phone, agent_id, tags').eq('id', report.client_id).maybeSingle()
    : { data: null };
  const c = client as Client | null;

  const now = new Date().toISOString();
  const entity = displayEntity(report.owner_entity);
  const who = report.contact_name ? `${report.contact_name} (${entity})` : entity;
  const props = (report.properties as Array<{ address: string; appraised: number }>) ?? [];
  const total = props.reduce((s, p) => s + (p.appraised || 0), 0);
  const where = props.length === 1 ? props[0].address : `${props.length} properties`;
  const owner = getLeadOwner({ source: 'owner-report' });

  async function alert(subject: string, lead: string, extra: string) {
    if (!process.env.RESEND_API_KEY) return;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A1A">
        <div style="background:#1A1A1A;color:#fff;padding:16px 20px;border-bottom:3px solid #C9A962"><strong style="font-size:16px">${escapeHtml(subject)}</strong></div>
        <div style="padding:20px;border:1px solid #E8E5E0;border-top:0;font-size:15px;line-height:1.6">
          <p style="margin:0 0 12px">${lead}</p>
          <table style="border-collapse:collapse;font-size:14px;margin:0 0 16px">
            <tr><td style="padding:3px 12px 3px 0;color:#666">Owner</td><td>${escapeHtml(who)}</td></tr>
            <tr><td style="padding:3px 12px 3px 0;color:#666">Property</td><td>${escapeHtml(where)} · appraised ${usd(total)}</td></tr>
            ${c?.email ? `<tr><td style="padding:3px 12px 3px 0;color:#666">Email</td><td><a href="mailto:${escapeHtml(c.email)}" style="color:#856A2E">${escapeHtml(c.email)}</a></td></tr>` : ''}
            ${c?.phone ? `<tr><td style="padding:3px 12px 3px 0;color:#666">Phone</td><td>${escapeHtml(c.phone)}</td></tr>` : ''}
            ${extra}
          </table>
          <a href="${CRM_URL}" style="display:inline-block;padding:10px 18px;background:#C9A962;color:#1A1A1A;text-decoration:none;border-radius:6px;font-weight:bold">Open the CRM</a>
        </div>
      </div>`;
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: getFromEmail(), to: leadAlertRecipients(owner), subject, html,
        ...(c?.email ? { replyTo: c.email } : {}),
      });
    } catch (e) {
      console.error('[owner-report] alert failed:', e instanceof Error ? e.message : e);
    }
  }

  async function note(text: string, tag: string) {
    if (!c) return;
    await db!.from('crm_client_activities').insert([{ client_id: c.id, agent_id: c.agent_id, type: 'note', note: text }]);
    const tags = Array.from(new Set([...(c.tags ?? []), tag]));
    await db!.from('crm_clients').update({ tags }).eq('id', c.id);
  }

  if (type === 'view') {
    const first = !report.first_viewed_at;
    await db.from('crm_owner_reports').update({
      view_count: (report.view_count ?? 0) + 1,
      last_viewed_at: now,
      ...(first ? { first_viewed_at: now } : {}),
    }).eq('id', report.id);
    if (first) {
      await note(`👀 Opened their property report (${where}). Warm signal — good moment to call.`, 'Viewed Owner Report');
      await alert(`👀 ${who} just opened their property report`, `${escapeHtml(who)} is reading their CRECO property report right now. This is the warmest moment to reach out.`, '');
    }
    return NextResponse.json({ ok: true });
  }

  // type === 'bov'
  if (report.bov_requested_at && Date.now() - new Date(report.bov_requested_at).getTime() < 24 * 3600_000) {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  const interest = typeof body.interest === 'string' && INTERESTS.has(body.interest) ? body.interest : null;
  const phone = typeof body.phone === 'string' ? safePhone(body.phone) : '';
  await db.from('crm_owner_reports').update({ bov_requested_at: now, interest, bov_phone: phone || null }).eq('id', report.id);
  if (c) {
    if (phone && !c.phone) await db.from('crm_clients').update({ phone }).eq('id', c.id);
    const assignee = c.agent_id;
    if (assignee) {
      await db.from('crm_tasks').insert([{
        client_id: c.id,
        title: `Call ${who} — requested a Broker Opinion of Value`.slice(0, 200),
        type: 'call',
        notes: [`🔥 Requested a free BOV from their property report.`, `Property: ${where} (appraised ${usd(total)})`, interest ? `On their radar: ${interest}` : '', phone ? `Best number: ${phone}` : c.phone ? `Phone on file: ${c.phone}` : '', c.email ? `Email: ${c.email}` : ''].filter(Boolean).join('\n'),
        status: 'open', priority: 'urgent', due_date: todayCentral(),
        agent_id: assignee, assigned_to: assignee, created_by: assignee, business_unit: 'commercial',
      }]);
    }
    await note(`🔥 Requested a free Broker Opinion of Value from their property report${interest ? ` — on their radar: ${interest}` : ''}${phone ? ` — best number ${phone}` : ''}.`, 'Requested BOV');
  }
  await alert(
    `🔥 BOV request: ${who}`,
    `${escapeHtml(who)} asked for a free Broker Opinion of Value from their property report. A call task is on the owner's list for today.`,
    `${interest ? `<tr><td style="padding:3px 12px 3px 0;color:#666">On their radar</td><td><strong>${escapeHtml(interest)}</strong></td></tr>` : ''}${phone ? `<tr><td style="padding:3px 12px 3px 0;color:#666">Best number</td><td><strong>${escapeHtml(phone)}</strong></td></tr>` : ''}`,
  );
  return NextResponse.json({ ok: true });
}
