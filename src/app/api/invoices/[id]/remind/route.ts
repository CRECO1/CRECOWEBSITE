import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendInvoiceEmail } from '@/lib/invoice-send';
import {
  REMINDER_STAGES, renderReminderContent,
  type ReminderStage,
} from '@/lib/invoice-reminders';
import type { Invoice } from '@/lib/invoices';

/**
 * POST /api/invoices/[id]/remind
 *
 * Manual fire: emails the next unsent reminder stage for this invoice right
 * now, bypassing the cron's schedule. The cron normally runs at fixed
 * triggerDaysFromDue offsets; this endpoint lets the operator push ahead
 * when they want to nudge a slow-paying client without waiting.
 *
 * Stage selection:
 *   - If a specific `stage` is in the request body, use it (operator override)
 *   - Otherwise pick the FIRST stage in REMINDER_STAGES order that doesn't
 *     yet have a row in invoice_reminders for this invoice
 *
 * Same idempotency guarantee as the cron: the unique (invoice_id, stage)
 * index on invoice_reminders blocks accidental double-sends. If every
 * stage has already fired, we return 409 instead of looping.
 *
 * Auth: requires an authenticated admin session. We confirm the cookie-
 * scoped Supabase client returns a real user before doing anything; once
 * we know the operator is signed in, the actual reads/writes use the
 * service-role client because we need to bypass RLS on invoice_reminders
 * inserts (the unique-(invoice_id, stage) reservation must succeed even
 * if a tightened policy blocks the operator's user from writing it
 * directly).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function authSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only in API routes */ },
      },
    },
  );
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // Auth gate — must be a signed-in admin. Returns 401 to anonymous
  // callers, never silently runs.
  const authClient = await authSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 503 });
  }

  const { id } = await ctx.params;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 1. Load invoice + line items
  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (invErr) {
    return NextResponse.json({ error: invErr.message }, { status: 500 });
  }
  if (!inv) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  if (inv.status === 'paid' || inv.status === 'void' || inv.status === 'draft') {
    return NextResponse.json(
      { error: `Cannot remind on a ${inv.status} invoice — only sent/overdue invoices get reminders.` },
      { status: 400 },
    );
  }

  // 2. Determine the stage to fire
  const { data: existing } = await supabase
    .from('invoice_reminders')
    .select('stage')
    .eq('invoice_id', id);
  const sentStages = new Set<string>((existing ?? []).map(r => r.stage));

  let stage: ReminderStage | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.stage && REMINDER_STAGES.some(s => s.stage === body.stage)) {
      stage = body.stage as ReminderStage;
    }
  } catch {
    /* no body — fine, auto-pick */
  }
  if (!stage) {
    // Pick the first unsent stage in order
    const next = REMINDER_STAGES.find(s => !sentStages.has(s.stage));
    if (!next) {
      return NextResponse.json(
        { error: 'All reminder stages already sent. No further reminders to fire.' },
        { status: 409 },
      );
    }
    stage = next.stage;
  }
  if (sentStages.has(stage)) {
    return NextResponse.json(
      { error: `Stage ${stage} already sent.` },
      { status: 409 },
    );
  }

  // 3. Pull line items so the PDF renders with full content
  const { data: line_items } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order', { ascending: true });
  const fullInvoice: Invoice = { ...(inv as Invoice), line_items: line_items ?? [] };

  // 4. Reserve the (invoice, stage) row first — same idempotency pattern
  //    the cron uses. If we send first and writing the row fails, we'd
  //    have an email out with no log; this ordering prevents that.
  const { data: reservation, error: reserveErr } = await supabase
    .from('invoice_reminders')
    .insert([{ invoice_id: id, stage }])
    .select('id')
    .single();
  if (reserveErr) {
    return NextResponse.json(
      { error: `Could not reserve reminder row: ${reserveErr.message}` },
      { status: 500 },
    );
  }

  // 5. Render + send
  const content = renderReminderContent(stage, fullInvoice);
  if (!content) {
    await supabase.from('invoice_reminders').delete().eq('id', reservation.id);
    return NextResponse.json({ error: 'No template for stage' }, { status: 500 });
  }

  try {
    const emailId = await sendInvoiceEmail({
      invoice: fullInvoice,
      subject: content.subject,
      message: content.message,
    });
    if (emailId) {
      await supabase
        .from('invoice_reminders')
        .update({ email_id: emailId })
        .eq('id', reservation.id);
    }
    // Flip status to overdue when firing an overdue-* stage so the dashboard
    // reflects it immediately (effectiveStatus() also computes this on read
    // but persisting saves a refresh round-trip).
    if (stage.startsWith('overdue-') && inv.status === 'sent') {
      await supabase.from('invoices').update({ status: 'overdue' }).eq('id', id);
    }
    return NextResponse.json({ ok: true, stage, message_id: emailId ?? null });
  } catch (err) {
    // Roll back the reservation so a retry can hit the same stage
    await supabase.from('invoice_reminders').delete().eq('id', reservation.id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Send failed' },
      { status: 500 },
    );
  }
}
