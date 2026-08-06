/**
 * Shared "generate an invoice from a recurring template" logic.
 *
 * Used by both the daily cron at /api/cron/recurring-invoices (loops over
 * every active template whose next_run_date has arrived) and the manual
 * "Generate now" button on the template detail page (fires for a single
 * template, on demand, ignoring the next_run_date check).
 *
 * Centralized so the two callers can't drift apart on number generation,
 * tax math, or template-advancement behaviour.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Invoice } from './invoices';
import { nextInvoiceNumber, round2 } from './invoices';
import { sendInvoiceEmail } from './invoice-send';
import { FALLBACK_TEMPLATE, substituteTemplate } from './invoice-email';
import { fetchW9Attachment } from './w9';
import {
  advanceNextRun, computeDueDate,
  type RecurringTemplate, type RecurringLineItem,
} from './recurring-invoices';

export interface GenerateOptions {
  /** When true, use today's date as the issue date instead of the
   *  template's next_run_date. Used by the manual "Generate now" button
   *  — the operator wants today's date on the invoice, not whatever was
   *  on the schedule. */
  useToday?: boolean;
  /** When true, skip advancing the template's next_run_date. Manual
   *  generation typically wants to advance (so the operator doesn't
   *  accidentally generate two invoices for the same cycle); cron always
   *  advances. */
  skipAdvance?: boolean;
}

export interface GenerateResult {
  invoice: Invoice;
  invoice_number: string;
  sent: boolean;
  send_error?: string;
}

/**
 * Generate an invoice from a recurring template + send the email if the
 * template's `on_generate='send_immediately'`. Caller passes the supabase
 * client (session-scoped or service-role; either works) and the template.
 * Line items are looked up fresh — no need for the caller to pre-fetch.
 *
 * Throws on hard failures (DB errors). Email-send failures are caught and
 * returned as `send_error` on the result so the caller can surface them
 * to the operator without losing the invoice.
 */
export async function generateInvoiceFromTemplate(
  supabase: SupabaseClient,
  tpl: RecurringTemplate,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  // 1. Pull line items
  const { data: itemsData } = await supabase
    .from('recurring_invoice_line_items')
    .select('*')
    .eq('template_id', tpl.id)
    .order('sort_order');
  const lineItems = (itemsData as RecurringLineItem[] | null) ?? [];

  if (lineItems.length === 0) {
    throw new Error('Template has no line items — add at least one before generating');
  }

  // 2. Determine issue + due dates
  const issueDate = options.useToday
    ? new Date().toISOString().slice(0, 10)
    : tpl.next_run_date;
  const dueDate = computeDueDate(issueDate, tpl.due_days);

  // 3. Generate the invoice number — counts existing invoices in the
  //    issue year. Not race-safe under concurrent generation; in
  //    practice the cron runs once daily and manual is a button-click.
  const year = new Date(issueDate).getUTCFullYear();
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .gte('issue_date', `${year}-01-01`)
    .lte('issue_date', `${year}-12-31`);
  const invoiceNumber = nextInvoiceNumber(count ?? 0, year);

  // 4. Compute totals
  let subtotal = 0;
  for (const li of lineItems) subtotal += Number(li.amount);
  subtotal = round2(subtotal);
  const taxAmount = round2(subtotal * Number(tpl.tax_rate));
  const total = round2(subtotal + taxAmount);

  // 5. Insert the invoice row. Always insert as a DRAFT — even for
  //    send_immediately templates. We only promote to 'sent' in step 8,
  //    AFTER the email actually goes out. Stamping 'sent' up front (the
  //    old behaviour) meant a transient Resend/PDF/W-9 failure left the
  //    invoice marked "sent" with nothing delivered, and the reminders
  //    cron would then dun a client who never received it (phantom-sent).
  const { data: created, error: invErr } = await supabase
    .from('invoices')
    .insert([{
      // The generated invoice inherits the template's workspace — the
      // cron iterates templates and each one carries the workspace it
      // belongs to. This keeps the new invoice in the same tenant as
      // its template.
      workspace_id: tpl.workspace_id,
      invoice_number: invoiceNumber,
      client_name: tpl.client_name,
      client_email: tpl.client_email,
      client_company: tpl.client_company,
      client_address: tpl.client_address,
      issue_date: issueDate,
      due_date: dueDate,
      status: 'draft',
      subtotal,
      tax_rate: tpl.tax_rate,
      tax_amount: taxAmount,
      total,
      // Carry the FK from template → invoice so the property's P&L
      // includes recurring revenue. property_reference is also
      // forwarded as the denormalized text snapshot.
      property_id: tpl.property_id ?? null,
      property_reference: tpl.property_reference,
      notes: tpl.notes,
      internal_notes: `Generated by recurring template "${tpl.name}" (${tpl.id})\n${tpl.internal_notes ?? ''}`.trim(),
      payment_terms: tpl.payment_terms,
      recurring_template_id: tpl.id,
      sent_at: null,
      reminders_enabled: true,
    }])
    .select('*')
    .single();

  if (invErr) throw new Error(invErr.message);
  const invoice = created as Invoice;

  // 6. Clone line items into invoice_line_items — same workspace.
  const { error: liErr } = await supabase
    .from('invoice_line_items')
    .insert(lineItems.map((li, idx) => ({
      workspace_id: tpl.workspace_id,
      invoice_id: invoice.id,
      description: li.description,
      quantity: li.quantity,
      rate: li.rate,
      amount: li.amount,
      sort_order: li.sort_order ?? idx,
    })));
  if (liErr) {
    // Best-effort rollback so we never leave a header without lines.
    await supabase.from('invoices').delete().eq('id', invoice.id);
    throw new Error(`Line item clone failed: ${liErr.message}`);
  }

  // 7. Advance the template (unless caller explicitly opted out)
  if (!options.skipAdvance) {
    const nextRun = advanceNextRun(
      // Always advance from the template's own next_run_date, even when
      // issuing today — otherwise rapid-fire manual generation would
      // skip cycles.
      tpl.next_run_date,
      tpl.frequency,
    );
    const { error: advErr } = await supabase
      .from('recurring_invoice_templates')
      .update({
        next_run_date: nextRun,
        last_run_at: new Date().toISOString(),
        last_run_invoice_id: invoice.id,
      })
      .eq('id', tpl.id);
    if (advErr) {
      // The invoice already exists; if we fail to advance next_run_date the
      // next cron run would try to regenerate for the same period. The
      // unique (recurring_template_id, issue_date) index (migration 0042)
      // rejects that duplicate so we won't double-bill — but surface the
      // failure loudly so the schedule gets repaired.
      console.error(
        `[recurring-generate] FAILED to advance next_run_date for template ${tpl.id}: ${advErr.message}`,
      );
    }
  }

  // 8. Fire the email if the template is configured for auto-send. Catch
  //    failures so the invoice still ends up created — the operator can
  //    re-send manually from the detail page.
  //
  //    Two things this branch HAS to get right (both were missed in the
  //    initial implementation and caught by an audit):
  //
  //    a) Capture the Resend message_id returned by sendInvoiceEmail()
  //       and stamp it on invoices.last_email_message_id. Without this,
  //       Resend's open-tracking webhook fires for the recipient opening
  //       the email but can't correlate the event back to an invoice —
  //       open_count + last_opened_at never update for any cron-sent or
  //       auto-generated recurring invoice. The webhook resolver checks
  //       invoices.last_email_message_id first, then
  //       invoice_reminders.email_id; without one of those, the webhook
  //       silently logs "no invoice for message_id" and moves on.
  //
  //    b) Fetch the workspace W-9 from invoice_settings and pass it as
  //       extraAttachments. Manual send + reminder cron both do this;
  //       the recurring generator was forgotten. Without it, every
  //       auto-generated recurring invoice ships without the W-9 —
  //       the corporate AP departments that prompted the W-9 feature
  //       in the first place have to ask again.
  let sent = false;
  let send_error: string | undefined;
  if (tpl.on_generate === 'send_immediately') {
    try {
      const { data: settings } = await supabase
        .from('invoice_settings')
        .select('default_subject, default_message, w9_storage_path, w9_filename')
        .eq('workspace_id', tpl.workspace_id)
        .single();
      const template = settings ?? FALLBACK_TEMPLATE;
      const fullInvoice = {
        ...invoice,
        line_items: lineItems.map((li, idx) => ({ ...li, sort_order: li.sort_order ?? idx })),
      };
      // Workspace W-9, when present. Fail-soft — a missing W-9 must not
      // block the invoice email itself (same posture as manual send +
      // cron-reminder paths).
      const w9 = await fetchW9Attachment(
        supabase,
        settings?.w9_storage_path ?? null,
        settings?.w9_filename ?? null,
      );
      const messageId = await sendInvoiceEmail({
        invoice: fullInvoice,
        subject: substituteTemplate(template.default_subject, fullInvoice),
        message: substituteTemplate(template.default_message, fullInvoice),
        extraAttachments: w9 ? [w9] : undefined,
      });
      sent = true;
      // Email delivered — NOW promote the invoice to 'sent' and stamp
      // sent_at plus the Resend message_id in a single update. We waited
      // until here (rather than at insert) so a failed send leaves the
      // invoice as a reviewable draft instead of a phantom "sent". The
      // message_id lets Resend's open-tracking webhook correlate events
      // back to this invoice.
      const sentAt = new Date().toISOString();
      const { error: promoteErr } = await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: sentAt, last_email_message_id: messageId ?? null })
        .eq('id', invoice.id);
      if (promoteErr) {
        // The client DID receive the email but our own bookkeeping update
        // failed. Surface it rather than silently leaving a draft that was
        // actually sent — the operator can reconcile from the detail page.
        console.error(
          `[recurring-generate] email sent but failed to mark invoice ${invoice.id} as sent: ${promoteErr.message}`,
        );
      } else {
        invoice.status = 'sent';
        (invoice as { sent_at?: string | null }).sent_at = sentAt;
      }
    } catch (err) {
      send_error = err instanceof Error ? err.message : String(err);
      console.error('[recurring-generate] email send failed:', send_error);
    }
  }

  return { invoice, invoice_number: invoiceNumber, sent, send_error };
}
