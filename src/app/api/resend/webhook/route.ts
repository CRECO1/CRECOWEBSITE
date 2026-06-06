import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/resend/webhook
 *
 * Receives Resend's outbound email events: delivered, opened, clicked,
 * bounced, complained, delivery_delayed. We use them to surface
 * open-tracking on the invoice detail page.
 *
 * Resend uses Svix for webhook signing. Each request carries three
 * headers:
 *   svix-id           — unique event id (also good for dedup)
 *   svix-timestamp    — unix timestamp (seconds)
 *   svix-signature    — space-separated list of `vN,<base64sig>` pairs
 *
 * The signed payload is the literal string `{svix-id}.{svix-timestamp}.{raw_body}`
 * HMAC'd with SHA-256 using the webhook secret (base64-decoded after
 * the `whsec_` prefix). We verify in constant time.
 *
 * Setup (one-time, in the Resend dashboard):
 *   1. Domains → enable Open + Click tracking on crecotx.com
 *   2. Webhooks → Add endpoint → https://www.crecotx.com/api/resend/webhook
 *   3. Subscribe to: email.delivered, email.opened, email.clicked,
 *      email.bounced, email.complained, email.delivery_delayed
 *   4. Copy the signing secret (starts with whsec_) → set
 *      RESEND_WEBHOOK_SECRET in Vercel env → redeploy
 *
 * Until that secret is set, the route returns 503 and Resend will
 * mark the webhook unhealthy. The UI gracefully shows "Not opened"
 * for every invoice (no events stored yet).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResendWebhookEvent {
  type: string;                                 // e.g. 'email.opened'
  created_at: string;                           // ISO timestamp of the event
  data: {
    email_id: string;                           // = Resend message id (matches our last_email_message_id)
    to: string[] | string;
    subject?: string;
    /** Some event types include this nested click info */
    click?: { ipAddress?: string; userAgent?: string; link?: string };
    /** Open events carry user agent + IP */
    bounce?: { message?: string; subType?: string };
  };
}

function svcSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

/**
 * Svix signature verification — see https://docs.svix.com/receiving/verifying-payloads/how
 *
 * Returns true if any signature in the header matches our HMAC. Uses
 * timingSafeEqual to avoid the timing-attack vector.
 */
function verifySvixSignature(
  body: string,
  svixId: string,
  svixTs: string,
  signatureHeader: string,
  secret: string,
): boolean {
  // Strip `whsec_` prefix and base64-decode the actual key bytes.
  const keyBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const toSign = `${svixId}.${svixTs}.${body}`;
  const expected = createHmac('sha256', keyBytes).update(toSign).digest();

  // Header format: "v1,<sig> v1,<sig2> ..." — only one needs to match.
  const signatures = signatureHeader.split(' ');
  for (const entry of signatures) {
    const [version, sig] = entry.split(',');
    if (version !== 'v1' || !sig) continue;
    let actual: Buffer;
    try {
      actual = Buffer.from(sig, 'base64');
    } catch {
      continue;
    }
    if (actual.length !== expected.length) continue;
    if (timingSafeEqual(actual, expected)) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'RESEND_WEBHOOK_SECRET not configured' },
      { status: 503 },
    );
  }

  const svixId = req.headers.get('svix-id');
  const svixTs = req.headers.get('svix-timestamp');
  const svixSig = req.headers.get('svix-signature');
  if (!svixId || !svixTs || !svixSig) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  // Reject events older than 5 minutes (replay protection — matches Svix's
  // default tolerance).
  const tsSec = Number(svixTs);
  if (!Number.isFinite(tsSec)) {
    return NextResponse.json({ error: 'Invalid svix-timestamp' }, { status: 400 });
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsSec) > 300) {
    return NextResponse.json({ error: 'Webhook timestamp out of tolerance' }, { status: 400 });
  }

  // Must read raw body BEFORE parsing JSON — signature is over the
  // literal bytes Resend signed, not a re-serialized JSON object.
  const rawBody = await req.text();
  if (!verifySvixSignature(rawBody, svixId, svixTs, svixSig, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const messageId = event.data?.email_id;
  if (!messageId) {
    // Some Resend event types may not include email_id (account-level
    // events for example) — silently accept those, no work to do.
    return NextResponse.json({ ok: true, ignored: 'no email_id' });
  }

  const supabase = svcSupabase();

  // ── Resolve message_id → invoice_id ─────────────────────────────
  // The message_id might live on:
  //   (a) invoices.last_email_message_id (initial send)
  //   (b) invoice_reminders.email_id      (auto-reminder cron)
  // Try (a) first since it covers the common case.
  //
  // We DO want to surface Supabase errors here. A bad SUPABASE_SERVICE_ROLE_KEY
  // historically failed silently because the destructure ignored `error`,
  // and the webhook just kept logging "no invoice for message_id" for every
  // event — which looked identical to "Resend sent us an event for an
  // email we don't own". Log loudly when the DB itself complained.
  let invoiceId: string | null = null;
  let workspaceId: string | null = null;
  {
    // Select workspace_id alongside id so we can stamp the event row
    // with the same tenant the invoice belongs to.
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('id, workspace_id')
      .eq('last_email_message_id', messageId)
      .maybeSingle();
    if (invErr) {
      console.error('[resend/webhook] invoices lookup failed:', invErr.message, invErr.code ?? '');
      return NextResponse.json({ error: 'DB lookup failed' }, { status: 500 });
    }
    if (inv) { invoiceId = inv.id; workspaceId = inv.workspace_id; }
  }
  if (!invoiceId) {
    // Reminder rows carry their own workspace_id — same value as the
    // parent invoice but we read it directly to avoid an extra join.
    const { data: rem, error: remErr } = await supabase
      .from('invoice_reminders')
      .select('invoice_id, workspace_id')
      .eq('email_id', messageId)
      .maybeSingle();
    if (remErr) {
      console.error('[resend/webhook] invoice_reminders lookup failed:', remErr.message, remErr.code ?? '');
      return NextResponse.json({ error: 'DB lookup failed' }, { status: 500 });
    }
    if (rem) { invoiceId = rem.invoice_id; workspaceId = rem.workspace_id; }
  }

  if (!invoiceId || !workspaceId) {
    // Genuinely no match — accept silently so Resend doesn't retry forever.
    console.warn('[resend/webhook] no invoice for message_id:', messageId, 'type:', event.type);
    return NextResponse.json({ ok: true, ignored: 'no invoice for this email' });
  }

  // ── Insert the event row ────────────────────────────────────────
  const occurredAt = event.created_at;
  const recipientEmail = Array.isArray(event.data?.to) ? event.data.to[0] : (event.data?.to ?? null);
  const userAgent = event.data?.click?.userAgent ?? null;
  const ipAddress = event.data?.click?.ipAddress ?? null;

  const { error: insertErr } = await supabase
    .from('invoice_email_events')
    .insert([{
      workspace_id: workspaceId,
      invoice_id: invoiceId,
      message_id: messageId,
      event_type: event.type,
      occurred_at: occurredAt,
      recipient_email: recipientEmail,
      user_agent: userAgent,
      ip_address: ipAddress,
      raw: event,
    }]);

  // Dedup violations (code 23505) are expected — Resend retries
  // events. We swallow those and proceed to the counter update.
  if (insertErr && (insertErr as { code?: string }).code !== '23505') {
    console.error('[resend/webhook] insert failed:', insertErr.message);
    return NextResponse.json({ error: 'Could not log event' }, { status: 500 });
  }

  // ── Update invoice roll-up counters on opens ─────────────────────
  // Only update on the first event we see for a (invoice, occurredAt)
  // tuple — duplicate events from retries don't double-count opens.
  if (event.type === 'email.opened' && !insertErr) {
    const { data: cur } = await supabase
      .from('invoices')
      .select('first_opened_at, open_count')
      .eq('id', invoiceId)
      .single();

    await supabase
      .from('invoices')
      .update({
        first_opened_at: cur?.first_opened_at ?? occurredAt,
        last_opened_at: occurredAt,
        open_count: (cur?.open_count ?? 0) + 1,
      })
      .eq('id', invoiceId);
  }

  return NextResponse.json({ ok: true });
}
