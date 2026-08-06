import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { generateInvoiceFromTemplate } from '@/lib/recurring-generate';
import type { RecurringTemplate } from '@/lib/recurring-invoices';

/**
 * POST /api/recurring/[id]/generate
 *
 * Manual "fire the next occurrence right now" trigger. Uses the same
 * shared helper as the daily cron, with two differences:
 *
 *   - issue_date = today, not the template's next_run_date (operator
 *     wants today's date on the bill, not whatever was on the schedule)
 *   - the template's next_run_date is still advanced by one cycle, so
 *     you can't accidentally double-bill the client for the same period
 *
 * Admin-only. Returns the new invoice's id so the client can redirect
 * straight to /billing/invoices/[id].
 *
 * Note on the auto-send path: if the template is configured for
 * 'send_immediately', the email goes out as part of this call. Email
 * failures don't roll back the invoice — they're returned in the
 * response so the operator can resend from the detail page.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { data: tpl, error: fetchErr } = await supabase
    .from('recurring_invoice_templates')
    .select('*')
    .eq('id', id)
    .single<RecurringTemplate>();
  if (fetchErr || !tpl) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  if (!tpl.active) {
    return NextResponse.json(
      { error: 'Template is paused. Resume it first, or duplicate as a one-off invoice.' },
      { status: 400 },
    );
  }

  try {
    const result = await generateInvoiceFromTemplate(supabase, tpl, { useToday: true });
    return NextResponse.json({
      ok: true,
      invoice_id: result.invoice.id,
      invoice_number: result.invoice_number,
      sent: result.sent,
      send_error: result.send_error ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // The unique (recurring_template_id, issue_date) index (migration 0042)
    // rejects a second invoice for the same template+day — i.e. the daily
    // cron already generated today, or this button was double-clicked.
    // Surface that as a friendly 409 instead of a raw Postgres error so we
    // don't double-bill/double-email the client.
    if (/invoices_recurring_template_period_uidx|duplicate key/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            'An invoice for this template has already been generated today. Refresh to see it before generating another.',
        },
        { status: 409 },
      );
    }
    console.error('[recurring.generate] failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
