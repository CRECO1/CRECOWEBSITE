import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInvoiceFromTemplate } from '@/lib/recurring-generate';
import type { RecurringTemplate } from '@/lib/recurring-invoices';

/**
 * GET /api/cron/recurring-invoices
 *
 * Daily Vercel cron — scans active recurring templates where
 * `next_run_date <= today`, generates an invoice from each via the shared
 * helper in src/lib/recurring-generate.ts, and either leaves it as a
 * draft or fires the email immediately based on the template's
 * `on_generate` setting.
 *
 * Idempotent by design: the helper always advances `next_run_date` after
 * a successful generation, so the same template can't fire twice on the
 * same day.
 *
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}` on cron calls.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface GenResult {
  ok: true;
  date: string;
  templates_checked: number;
  invoices_generated: number;
  invoices_sent: number;
  errors: { template_id: string; error: string }[];
  generated: { template_id: string; invoice_id: string; invoice_number: string }[];
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
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: templates, error: fetchErr } = await supabase
    .from('recurring_invoice_templates')
    .select('*')
    .eq('active', true)
    .lte('next_run_date', today);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const result: GenResult = {
    ok: true,
    date: today,
    templates_checked: templates?.length ?? 0,
    invoices_generated: 0,
    invoices_sent: 0,
    errors: [],
    generated: [],
  };

  for (const tpl of (templates as RecurringTemplate[] | null) ?? []) {
    // Respect end_date — auto-deactivate if we've passed it
    if (tpl.end_date && tpl.end_date < today) {
      await supabase.from('recurring_invoice_templates').update({ active: false }).eq('id', tpl.id);
      continue;
    }

    try {
      const r = await generateInvoiceFromTemplate(supabase, tpl);
      result.invoices_generated++;
      result.generated.push({
        template_id: tpl.id,
        invoice_id: r.invoice.id,
        invoice_number: r.invoice_number,
      });
      if (r.sent) result.invoices_sent++;
      if (r.send_error) {
        result.errors.push({
          template_id: tpl.id,
          error: `Invoice ${r.invoice_number} created but email failed: ${r.send_error}`,
        });
      }
    } catch (err) {
      result.errors.push({
        template_id: tpl.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) { return GET(req); }
