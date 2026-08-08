import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Invoice } from '@/lib/invoices';
import { sendInvoiceEmail } from '@/lib/invoice-send';
import { fetchW9Attachment } from '@/lib/w9';
import { stageForToday, renderReminderContent } from '@/lib/invoice-reminders';

/**
 * GET /api/cron/invoice-reminders
 *
 * Daily Vercel cron — fires payment-reminder emails for sent (unpaid)
 * invoices that hit a stage milestone today. Each (invoice, stage) sends
 * at most once thanks to the unique index on invoice_reminders.
 *
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}` on cron calls.
 * Random internet traffic without that header gets a 401.
 *
 * DB access uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) because the
 * cron isn't running as any authenticated user. Service role lives only
 * in server env and never reaches the browser.
 *
 * Idempotent: safe to call manually for testing, or to re-run the same
 * day. The unique (invoice_id, stage) index blocks duplicate sends.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;   // up to 60s — gives us room for many invoices

interface RunResult {
  ok: true;
  date: string;
  candidates_checked: number;
  reminders_sent: number;
  errors: { invoice_id: string; stage: string; error: string }[];
  sent: { invoice_id: string; invoice_number: string; stage: string; to: string }[];
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
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured (the cron needs it to bypass RLS)' },
      { status: 503 },
    );
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 503 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' }, { status: 503 });
  }

  // Service-role client — DB writes happen as a system actor, bypassing RLS.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  // 3. Pull candidate invoices — anything that's been sent, isn't paid/void,
  //    and has reminders enabled. We could narrow further by date range, but
  //    at our volume scanning every sent invoice once per day is fine.
  const { data: invoices, error: fetchErr } = await supabase
    .from('invoices')
    .select('*')
    .in('status', ['sent', 'overdue'])
    .eq('reminders_enabled', true);

  if (fetchErr) {
    return NextResponse.json(
      { error: `Could not fetch invoices: ${fetchErr.message}` },
      { status: 500 },
    );
  }

  const result: RunResult = {
    ok: true,
    date: new Date().toISOString().slice(0, 10),
    candidates_checked: invoices?.length ?? 0,
    reminders_sent: 0,
    errors: [],
    sent: [],
  };

  // ── W-9 attachment cache (per workspace).
  // Multi-tenancy reality: each workspace has its own W-9. The cron
  // iterates invoices across every workspace, so we cache the fetched
  // attachment by workspace_id to avoid re-pulling the same bytes
  // multiple times for invoices that share a tenant.
  // fetchW9Attachment is fail-soft — null means "no W-9 on file" and
  // reminders go out without one.
  const w9ByWorkspace = new Map<string, Awaited<ReturnType<typeof fetchW9Attachment>>>();
  async function getW9For(workspaceId: string) {
    if (w9ByWorkspace.has(workspaceId)) return w9ByWorkspace.get(workspaceId)!;
    const { data: w9Settings } = await supabase
      .from('invoice_settings')
      .select('w9_storage_path, w9_filename')
      .eq('workspace_id', workspaceId)
      .single();
    const w9 = await fetchW9Attachment(
      supabase,
      w9Settings?.w9_storage_path ?? null,
      w9Settings?.w9_filename ?? null,
    );
    w9ByWorkspace.set(workspaceId, w9);
    return w9;
  }

  // ── Smart cadence: look up each client's reminder_cadence preference.
  // The cron is per-invoice, but we pull the client setting once + cache by
  // client_id below to avoid N round-trips on a long inventory.
  const clientIds = Array.from(new Set(
    (invoices ?? []).map(i => i.client_id).filter((x): x is string => Boolean(x))
  ));
  const cadenceByClient = new Map<string, 'standard' | 'gentle' | 'firm'>();
  if (clientIds.length > 0) {
    const { data: clientRows } = await supabase
      .from('clients')
      .select('id, reminder_cadence')
      .in('id', clientIds);
    for (const row of clientRows ?? []) {
      if (row.reminder_cadence === 'gentle' || row.reminder_cadence === 'firm' || row.reminder_cadence === 'standard') {
        cadenceByClient.set(row.id, row.reminder_cadence);
      }
    }
  }

  /**
   * Stage-eligibility filter based on the client's reminder_cadence:
   *   - 'standard' — every stage fires normally (current behavior)
   *   - 'gentle'   — skip the early heads-up stages. Only fire 3-days past
   *                  due and later. For trusted slow payers who reliably
   *                  settle without being pestered.
   *   - 'firm'     — fire 'due-soon' a week earlier than the schedule
   *                  (i.e. once 7-day cron picks an invoice up, also count
   *                  the 14-day-out as if it were today's window). MVP
   *                  behavior: also include any stage whose offset is
   *                  within +/- 1 day, so the operator's stricter clients
   *                  get pinged faster around each milestone.
   */
  function stageAllowedForClient(stage: string, cadence: 'standard' | 'gentle' | 'firm'): boolean {
    if (cadence === 'standard') return true;
    if (cadence === 'gentle') {
      // Skip the friendly early stages; only escalate when past due.
      return stage === 'overdue-3' || stage === 'overdue-7' ||
             stage === 'overdue-14' || stage === 'overdue-30';
    }
    // 'firm' — all stages allowed; the next-day-loose-match below adds
    // extra opportunities.
    return true;
  }

  for (const inv of invoices ?? []) {
    let stage = stageForToday(inv.due_date);
    const cadence = (inv.client_id && cadenceByClient.get(inv.client_id)) || 'standard';

    // 'firm' cadence — also check yesterday/tomorrow so the cron is more
    // likely to land on a stage milestone for clients we want pressed.
    if (!stage && cadence === 'firm') {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
      const tomorrow = new Date(today.getTime() + 86_400_000).toISOString().slice(0, 10);
      stage = stageForToday(inv.due_date, yesterday) ?? stageForToday(inv.due_date, tomorrow);
    }
    if (!stage) continue;
    if (!stageAllowedForClient(stage, cadence)) continue;

    // 4. Reserve the (invoice, stage) slot via the unique index. If a row
    //    already exists we skip — that stage was already handled.
    const { data: reservation, error: reserveErr } = await supabase
      .from('invoice_reminders')
      .insert([{
        // Reminder rows inherit the invoice's workspace — keeps the
        // audit + tracking trail in the same tenant as the data it's
        // describing.
        workspace_id: inv.workspace_id,
        invoice_id: inv.id,
        stage,
      }])
      .select('id')
      .single();

    if (reserveErr) {
      // 23505 = unique_violation — expected when the stage was already sent.
      // Anything else, log and move on.
      const code = (reserveErr as { code?: string }).code;
      if (code !== '23505') {
        result.errors.push({ invoice_id: inv.id, stage, error: reserveErr.message });
      }
      continue;
    }

    // 5. Pull line items for the PDF render
    const { data: line_items } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', inv.id)
      .order('sort_order', { ascending: true });
    const fullInvoice: Invoice = { ...(inv as Invoice), line_items: line_items ?? [] };

    // 6. Render stage-specific subject + message, send
    const content = renderReminderContent(stage, fullInvoice);
    if (!content) {
      result.errors.push({ invoice_id: inv.id, stage, error: 'No template for stage' });
      // Roll back the reservation so a re-run can retry
      await supabase.from('invoice_reminders').delete().eq('id', reservation.id);
      continue;
    }

    try {
      // Per-workspace W-9 (cached). When the invoice fires its first
      // reminder we fetch its workspace's W-9; subsequent reminders for
      // any invoice in the same workspace get the cached attachment.
      const w9 = await getW9For(fullInvoice.workspace_id);
      const emailId = await sendInvoiceEmail({
        invoice: fullInvoice,
        subject: content.subject,
        message: content.message,
        extraAttachments: w9 ? [w9] : undefined,
      });
      // Save the Resend message ID on the reminder row for later auditing
      if (emailId) {
        await supabase
          .from('invoice_reminders')
          .update({ email_id: emailId })
          .eq('id', reservation.id);
      }
      result.sent.push({
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        stage,
        to: inv.client_email,
      });
      result.reminders_sent += 1;

      // If this is a past-due stage and the invoice is still marked "sent",
      // flip its status to "overdue" so the admin sees it without having to
      // refresh-and-recompute. The effectiveStatus() helper does this on
      // read too, but persisting saves a step.
      const isOverdueStage = stage.startsWith('overdue-');
      if (isOverdueStage && inv.status === 'sent') {
        await supabase.from('invoices').update({ status: 'overdue' }).eq('id', inv.id);
      }
    } catch (err) {
      // Roll back the reservation so tomorrow's cron can retry
      await supabase.from('invoice_reminders').delete().eq('id', reservation.id);
      result.errors.push({
        invoice_id: inv.id,
        stage,
        error: err instanceof Error ? err.message : 'Unknown send error',
      });
    }
  }

  return NextResponse.json(result);
}

/** Helpful sanity endpoint — what stages exist + what would fire today? */
export async function POST(req: NextRequest) {
  return GET(req);
}
