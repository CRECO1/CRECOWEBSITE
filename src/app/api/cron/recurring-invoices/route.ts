import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Invoice } from '@/lib/invoices';
import { sendInvoiceEmail } from '@/lib/invoice-send';
import { nextInvoiceNumber } from '@/lib/invoices';
import { FALLBACK_TEMPLATE, substituteTemplate } from '@/lib/invoice-email';
import {
  advanceNextRun, computeDueDate,
  type RecurringTemplate, type RecurringLineItem,
} from '@/lib/recurring-invoices';

/**
 * GET /api/cron/recurring-invoices
 *
 * Daily Vercel cron — scans active recurring templates where
 * `next_run_date <= today`, clones each one into a new invoice (with its
 * line items), advances `next_run_date` by the template's frequency, and
 * either leaves the invoice as a draft or fires the email immediately
 * depending on the template's `on_generate` setting.
 *
 * Idempotent by design: after a successful generation we always advance
 * `next_run_date` so the same template can't fire twice on the same day.
 * If the cron crashes mid-run, manual re-trigger picks up where it left off.
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
  // 1. Auth
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Env sanity
  for (const k of ['SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL'] as const) {
    if (!process.env[k]) {
      return NextResponse.json({ error: `${k} not configured` }, { status: 503 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const today = new Date().toISOString().slice(0, 10);

  // 3. Pull all active templates due to fire today or earlier
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
    // Respect end_date — if today is past the end, deactivate quietly
    if (tpl.end_date && tpl.end_date < today) {
      await supabase.from('recurring_invoice_templates').update({ active: false }).eq('id', tpl.id);
      continue;
    }

    try {
      // 4a. Pull this template's line items
      const { data: items } = await supabase
        .from('recurring_invoice_line_items')
        .select('*')
        .eq('template_id', tpl.id)
        .order('sort_order');
      const lineItems = (items as RecurringLineItem[] | null) ?? [];

      // 4b. Generate the invoice number — count existing invoices this year
      const year = new Date(tpl.next_run_date).getUTCFullYear();
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .gte('issue_date', `${year}-01-01`)
        .lte('issue_date', `${year}-12-31`);
      const invoiceNumber = nextInvoiceNumber(count ?? 0, year);

      // 4c. Compute totals
      let subtotal = 0;
      for (const li of lineItems) subtotal += Number(li.amount);
      subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;
      const taxAmount = Math.round((subtotal * Number(tpl.tax_rate) + Number.EPSILON) * 100) / 100;
      const total = Math.round((subtotal + taxAmount + Number.EPSILON) * 100) / 100;

      const issueDate = tpl.next_run_date;
      const dueDate = computeDueDate(issueDate, tpl.due_days);

      // 4d. Insert the invoice
      const initialStatus = tpl.on_generate === 'send_immediately' ? 'sent' : 'draft';
      const { data: created, error: invErr } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          client_name: tpl.client_name,
          client_email: tpl.client_email,
          client_company: tpl.client_company,
          client_address: tpl.client_address,
          issue_date: issueDate,
          due_date: dueDate,
          status: initialStatus,
          subtotal,
          tax_rate: tpl.tax_rate,
          tax_amount: taxAmount,
          total,
          property_reference: tpl.property_reference,
          notes: tpl.notes,
          internal_notes: `Generated by recurring template "${tpl.name}" (${tpl.id})\n${tpl.internal_notes ?? ''}`.trim(),
          payment_terms: tpl.payment_terms,
          recurring_template_id: tpl.id,
          sent_at: initialStatus === 'sent' ? new Date().toISOString() : null,
          reminders_enabled: true,
        }])
        .select('*')
        .single();

      if (invErr) throw new Error(invErr.message);
      const invoice = created as Invoice;

      // 4e. Clone line items
      if (lineItems.length > 0) {
        const { error: liErr } = await supabase
          .from('invoice_line_items')
          .insert(lineItems.map((li, idx) => ({
            invoice_id: invoice.id,
            description: li.description,
            quantity: li.quantity,
            rate: li.rate,
            amount: li.amount,
            sort_order: li.sort_order ?? idx,
          })));
        if (liErr) {
          // Best-effort rollback
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw new Error(`Line item clone failed: ${liErr.message}`);
        }
      }

      // 4f. Advance the template — next run + book-keeping
      const nextRun = advanceNextRun(tpl.next_run_date, tpl.frequency);
      await supabase
        .from('recurring_invoice_templates')
        .update({
          next_run_date: nextRun,
          last_run_at: new Date().toISOString(),
          last_run_invoice_id: invoice.id,
        })
        .eq('id', tpl.id);

      result.invoices_generated++;
      result.generated.push({ template_id: tpl.id, invoice_id: invoice.id, invoice_number: invoiceNumber });

      // 4g. If auto-send is enabled, fire the email. Subject + body come from
      //     the global invoice email template, substituted against the new
      //     invoice's fields. The recurring template doesn't carry its own
      //     copy — keeps the operator's content centralized.
      if (tpl.on_generate === 'send_immediately') {
        try {
          const { data: settings } = await supabase
            .from('invoice_settings')
            .select('default_subject, default_message')
            .eq('id', 1)
            .single();
          const template = settings ?? FALLBACK_TEMPLATE;
          const fullInvoice = {
            ...invoice,
            line_items: lineItems.map((li, idx) => ({ ...li, sort_order: li.sort_order ?? idx })),
          };
          await sendInvoiceEmail({
            invoice: fullInvoice,
            subject: substituteTemplate(template.default_subject, fullInvoice),
            message: substituteTemplate(template.default_message, fullInvoice),
          });
          result.invoices_sent++;
        } catch (err) {
          // Email failure shouldn't roll back the invoice — owner can resend
          // from the invoice detail page.
          console.error('[cron/recurring-invoices] email send failed:', err);
          result.errors.push({
            template_id: tpl.id,
            error: `Invoice ${invoiceNumber} created but email failed: ${(err as Error).message}`,
          });
        }
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
