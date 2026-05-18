'use client';

/**
 * /billing/invoices/[id] — view, send, mark paid, void, delete.
 *
 * Read-only display by default — click "Edit" to make changes, "Save" to
 * commit. Actions sit in the top bar: download PDF, send (or resend) to
 * client, mark paid (with method + amount), mark void, delete.
 *
 * Heavy actions (PDF, email) call the /api routes; everything else is
 * direct Supabase mutation through the admin's session.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, Send, CheckCircle, AlertTriangle, Trash2,
  Pencil, Save, X, RotateCw, Ban, Mail, Repeat, Copy, BellRing, DollarSign,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  calculateTotals, formatMoney, formatDate, effectiveStatus,
  STATUS_STYLES, lineAmount,
  type Invoice, type InvoiceLineItem, type InvoiceEmailEvent,
} from '@/lib/invoices';
import { FALLBACK_TEMPLATE, substituteTemplate } from '@/lib/invoice-email';
import { buildInvoiceEmailPreview } from '@/lib/invoice-email-html';
import { REMINDER_STAGES, type ReminderStage } from '@/lib/invoice-reminders';

type Editable = Omit<Invoice, 'line_items'> & { line_items: InvoiceLineItem[] };

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [invoice, setInvoice] = useState<Editable | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Editable | null>(null);
  const [busy, setBusy] = useState<null | string>(null);     // which action is in-flight
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Compose-before-send modal state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeCc, setComposeCc] = useState('');

  // Mark-paid modal state. Replaces the old window.prompt flow with a proper
  // styled form: method pills, amount (defaults to invoice total), payment
  // date (defaults to today, supports backdating to bank-deposit date), and
  // optional notes that append to internal_notes for audit context.
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [paidMethod, setPaidMethod] = useState<string>('Check');
  const [paidAmountStr, setPaidAmountStr] = useState<string>('');
  const [paidDate, setPaidDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paidNotes, setPaidNotes] = useState<string>('');

  // Reminder history for this invoice
  const [reminders, setReminders] = useState<{ stage: ReminderStage; sent_at: string }[]>([]);

  // Resend email events (delivered/opened/clicked/bounced) — powers the
  // "Email tracking" card. Populated by the Resend webhook; the page
  // just reads what's already in the DB.
  const [emailEvents, setEmailEvents] = useState<InvoiceEmailEvent[]>([]);

  // Global email template — loaded once on mount, used as the fallback
  // when this invoice doesn't carry a per-invoice email_subject/message.
  const [emailTemplate, setEmailTemplate] = useState<{ default_subject: string; default_message: string }>(FALLBACK_TEMPLATE);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    const { data: inv, error: e1 } = await supabase.from('invoices').select('*').eq('id', id).single();
    if (e1 || !inv) {
      setError(e1?.message ?? 'Invoice not found');
      return;
    }
    const { data: items } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order', { ascending: true });
    setInvoice({ ...(inv as Invoice), line_items: (items ?? []) as InvoiceLineItem[] });

    // Reminder history — pre-migration this table doesn't exist; ignore that
    // error so the page still renders without it.
    const { data: rems } = await supabase
      .from('invoice_reminders')
      .select('stage, sent_at')
      .eq('invoice_id', id)
      .order('sent_at', { ascending: true });
    setReminders((rems ?? []) as { stage: ReminderStage; sent_at: string }[]);

    // Email open/click/bounce events from Resend (populated by the
    // /api/resend/webhook route). Newest first so the most recent
    // activity is visible at the top of the activity log.
    const { data: events } = await supabase
      .from('invoice_email_events')
      .select('*')
      .eq('invoice_id', id)
      .order('occurred_at', { ascending: false });
    setEmailEvents((events ?? []) as InvoiceEmailEvent[]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Pull the global email template once on mount (used as fallback for
  // the live preview when this invoice doesn't have a per-invoice override).
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('invoice_settings')
        .select('default_subject, default_message')
        .eq('id', 1)
        .single();
      if (data) setEmailTemplate(data);
    })();
  }, []);

  const status = invoice ? effectiveStatus(invoice) : 'draft';
  const statusStyle = STATUS_STYLES[status];

  // ── Actions ────────────────────────────────────────────────────────────

  /**
   * Step 1 of the send flow — load the per-invoice override (if set) or
   * the global template (substituted against this invoice), and pop the
   * Compose modal pre-filled. The actual send happens in confirmSend()
   * once the admin clicks Send inside the modal.
   *
   * Resolution: per-invoice override → global template → FALLBACK_TEMPLATE.
   */
  async function openCompose() {
    if (!invoice) return;
    setError(null);
    setInfo(null);

    // Prefer per-invoice override
    if (invoice.email_subject && invoice.email_message) {
      setComposeSubject(invoice.email_subject);
      setComposeMessage(invoice.email_message);
    } else {
      // Pull the saved template; fall back to defaults if 0011 hasn't run
      const { data: settings } = await supabase
        .from('invoice_settings')
        .select('default_subject, default_message')
        .eq('id', 1)
        .single();
      const template = settings ?? FALLBACK_TEMPLATE;
      setComposeSubject(invoice.email_subject ?? substituteTemplate(template.default_subject, invoice));
      setComposeMessage(invoice.email_message ?? substituteTemplate(template.default_message, invoice));
    }
    setComposeCc('');
    setComposeOpen(true);
  }

  async function confirmSend() {
    if (!invoice) return;
    setBusy('send');
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composeSubject,
          message: composeMessage,
          cc: composeCc.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Send failed');
      }
      setComposeOpen(false);
      setInfo(`Invoice sent to ${invoice.client_email}.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function resetCompose() {
    if (!invoice) return;
    setComposeSubject(substituteTemplate(FALLBACK_TEMPLATE.default_subject, invoice));
    setComposeMessage(substituteTemplate(FALLBACK_TEMPLATE.default_message, invoice));
  }

  /**
   * Step 1 — open the mark-paid modal with sensible defaults (amount =
   * invoice.total, date = today, method = last-used or "Check"). The actual
   * write happens in confirmMarkPaid() once the operator clicks Save.
   *
   * Decoupling the open from the write lets us validate the amount before
   * touching the row and lets the operator dismiss without consequence.
   */
  function openMarkPaid() {
    if (!invoice) return;
    setError(null);
    setInfo(null);
    setPaidAmountStr(String(invoice.total));
    setPaidDate(new Date().toISOString().slice(0, 10));
    setPaidMethod('Check');
    setPaidNotes('');
    setMarkPaidOpen(true);
  }

  async function confirmMarkPaid() {
    if (!invoice) return;
    const amount = Number(paidAmountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    setBusy('paid');
    // paid_at is the authoritative timestamp. We store the operator's chosen
    // date at 12:00 UTC noon to avoid timezone drift when displayed back.
    // If they backdate to "the day the deposit cleared," that's the date
    // that lands on the invoice / shows in monthly paid totals.
    const paidAtIso = `${paidDate}T12:00:00.000Z`;
    // Append the note to internal_notes if provided so we have an audit
    // trail without needing a separate paid_notes column.
    const notesPatch = paidNotes.trim()
      ? {
          internal_notes: [
            invoice.internal_notes?.trim(),
            `[Paid ${paidDate} via ${paidMethod}] ${paidNotes.trim()}`,
          ].filter(Boolean).join('\n\n'),
        }
      : {};
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: paidAtIso,
        paid_method: paidMethod || 'Other',
        paid_amount: amount,
        ...notesPatch,
      })
      .eq('id', invoice.id);
    if (error) {
      setBusy(null);
      setError(error.message);
      return;
    }
    // Deactivate the Stripe Payment Link (if any) so the client can't pay
    // again via the link after we've marked them paid by other means.
    // Best-effort — failure here doesn't block the Paid status update.
    if (invoice.stripe_payment_link_url) {
      await fetch(`/api/invoices/${invoice.id}/deactivate-payment-link`, { method: 'POST' })
        .catch(err => console.warn('Payment link deactivation failed (non-fatal):', err));
    }
    setBusy(null);
    setMarkPaidOpen(false);
    setInfo(`Marked as paid · ${formatMoney(amount)} via ${paidMethod}.`);
    await load();
  }

  async function reopenInvoice() {
    if (!invoice) return;
    setBusy('reopen');
    const { error } = await supabase
      .from('invoices')
      .update({ status: invoice.sent_at ? 'sent' : 'draft', paid_at: null, paid_method: null, paid_amount: null })
      .eq('id', invoice.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  }

  async function generatePaymentLink() {
    if (!invoice) return;
    setBusy('link');
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payment-link`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Could not generate payment link');
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  /**
   * Manually fire the next unsent reminder stage right now, bypassing the
   * cron's schedule. Useful when the operator notices the email hasn't
   * been opened in 5 days and wants to push without editing the schedule.
   *
   * Server route picks the next unsent stage automatically based on the
   * invoice's due_date and the reminder history, so the operator doesn't
   * need to pick the stage — they just click and we send the right one.
   */
  async function sendReminderNow() {
    if (!invoice) return;
    setBusy('remind');
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/remind`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? 'Could not send reminder');
      setInfo(`Reminder sent · ${body.stage ?? 'next stage'}.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function toggleReminders(next: boolean) {
    if (!invoice) return;
    setBusy('reminders');
    const { error } = await supabase
      .from('invoices')
      .update({ reminders_enabled: next })
      .eq('id', invoice.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  }

  async function markVoid() {
    if (!invoice) return;
    if (!window.confirm('Mark this invoice as void? This is reversible — you can reopen later.')) return;
    setBusy('void');
    const { error } = await supabase.from('invoices').update({ status: 'void' }).eq('id', invoice.id);
    if (error) { setBusy(null); setError(error.message); return; }
    // Kill the Stripe link so no one pays a void invoice
    if (invoice.stripe_payment_link_url) {
      await fetch(`/api/invoices/${invoice.id}/deactivate-payment-link`, { method: 'POST' })
        .catch(err => console.warn('Payment link deactivation failed (non-fatal):', err));
    }
    setBusy(null);
    await load();
  }

  async function destroy() {
    if (!invoice) return;
    if (!window.confirm(`Permanently delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return;
    setBusy('delete');
    // Deactivate the Stripe link BEFORE deleting the row — once the row is
    // gone we lose the stored URL and can't reach back into Stripe.
    if (invoice.stripe_payment_link_url) {
      await fetch(`/api/invoices/${invoice.id}/deactivate-payment-link`, { method: 'POST' })
        .catch(err => console.warn('Payment link deactivation failed (non-fatal):', err));
    }
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
    setBusy(null);
    if (error) { setError(error.message); return; }
    router.push('/billing/invoices');
  }

  // ── Edit mode ───────────────────────────────────────────────────────────

  function startEdit() {
    if (!invoice) return;
    setDraft(JSON.parse(JSON.stringify(invoice)));
    setEditing(true);
    setError(null);
    setInfo(null);
  }

  function cancelEdit() {
    setDraft(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!draft) return;
    setBusy('save');
    const totals = calculateTotals(draft.line_items, draft.tax_rate);
    const { error: e1 } = await supabase
      .from('invoices')
      .update({
        client_name: draft.client_name.trim(),
        client_email: draft.client_email.trim().toLowerCase(),
        client_company: draft.client_company?.trim() || null,
        client_address: draft.client_address?.trim() || null,
        issue_date: draft.issue_date,
        due_date: draft.due_date,
        payment_terms: draft.payment_terms?.trim() || 'Net 30',
        property_reference: draft.property_reference?.trim() || null,
        tax_rate: draft.tax_rate,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total: totals.total,
        notes: draft.notes?.trim() || null,
        internal_notes: draft.internal_notes?.trim() || null,
        stripe_payment_link_url: draft.stripe_payment_link_url?.trim() || null,
        email_subject: draft.email_subject?.trim() || null,
        email_message: draft.email_message?.trim() || null,
      })
      .eq('id', draft.id);
    if (e1) { setBusy(null); setError(e1.message); return; }

    // Wipe + reinsert line items — simple and reliable for the editing scale
    await supabase.from('invoice_line_items').delete().eq('invoice_id', draft.id);
    const rows = draft.line_items
      .filter(it => it.description.trim())
      .map((it, sort_order) => ({
        invoice_id: draft.id,
        description: it.description.trim(),
        quantity: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
        amount: lineAmount(it),
        sort_order,
      }));
    if (rows.length > 0) {
      const { error: e2 } = await supabase.from('invoice_line_items').insert(rows);
      if (e2) { setBusy(null); setError(e2.message); return; }
    }

    setBusy(null);
    setEditing(false);
    setDraft(null);
    await load();
  }

  function updDraftItem(i: number, patch: Partial<InvoiceLineItem>) {
    if (!draft) return;
    setDraft({
      ...draft,
      line_items: draft.line_items.map((it, idx) =>
        idx === i ? { ...it, ...patch, amount: lineAmount({ ...it, ...patch }) } : it,
      ),
    });
  }

  function addDraftLine() {
    if (!draft) return;
    setDraft({
      ...draft,
      line_items: [
        ...draft.line_items,
        { description: '', quantity: 1, rate: 0, amount: 0, sort_order: draft.line_items.length },
      ],
    });
  }

  function removeDraftLine(i: number) {
    if (!draft || draft.line_items.length === 1) return;
    setDraft({ ...draft, line_items: draft.line_items.filter((_, idx) => idx !== i) });
  }

  const view = editing && draft ? draft : invoice;
  const totals = useMemo(
    () => view ? calculateTotals(view.line_items, view.tax_rate) : { subtotal: 0, tax_amount: 0, total: 0 },
    [view],
  );

  // Compute the effective (subject, message) that would actually send today,
  // following the same resolution order as the server's send route:
  //   1. Per-invoice override (email_subject / email_message on the row)
  //   2. Global template substituted against this invoice
  //
  // Then render that into the preview iframe via buildInvoiceEmailPreview.
  const previewHtml = useMemo(() => {
    if (!view) return '';
    const subject = view.email_subject || substituteTemplate(emailTemplate.default_subject, view);
    const message = view.email_message || substituteTemplate(emailTemplate.default_message, view);
    return buildInvoiceEmailPreview({ invoice: view, subject, message });
  }, [view, emailTemplate]);

  if (!invoice && !error) {
    return <div className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">Loading…</div>;
  }
  if (!invoice) {
    return (
      <div className="min-h-screen bg-background-cream flex items-center justify-center">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">{error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/billing/invoices" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Invoices
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary truncate flex items-center gap-2 flex-wrap">
              <span className="font-mono">{invoice.invoice_number}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold border ${statusStyle.className}`}>
                {statusStyle.label}
              </span>
              {invoice.recurring_template_id && (
                <Link
                  href={`/billing/recurring/${invoice.recurring_template_id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold border bg-gold/10 text-gold-dark border-gold/30 hover:bg-gold/20"
                  title="Part of a recurring template"
                >
                  <Repeat className="h-3 w-3" /> Recurring
                </Link>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <>
                <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary">
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button type="button" onClick={saveEdit} disabled={busy === 'save'} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                  <Save className="h-4 w-4" /> {busy === 'save' ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary">
                  <Download className="h-4 w-4" /> PDF
                </a>
                {/* Duplicate — always available regardless of status. The
                    most common use: re-billing the same client for the same
                    retainer next month without setting up a recurring
                    template. Carries client + line items + tax to /new. */}
                <Link
                  href={`/billing/invoices/new?clone=${invoice.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary"
                  title="Create a new invoice prefilled with this invoice's client + line items"
                >
                  <Copy className="h-4 w-4" /> Duplicate
                </Link>
                {status !== 'paid' && status !== 'void' && (
                  <>
                    <button type="button" onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary">
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button type="button" onClick={openCompose} disabled={busy === 'send'} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                      <Send className="h-4 w-4" /> {invoice.sent_at ? 'Resend' : 'Send'}
                    </button>
                    <button type="button" onClick={openMarkPaid} disabled={busy === 'paid'} className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-body-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60">
                      <CheckCircle className="h-4 w-4" /> Mark paid
                    </button>
                  </>
                )}
                {status === 'paid' && (
                  <button type="button" onClick={reopenInvoice} disabled={busy === 'reopen'} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-60">
                    <RotateCw className="h-4 w-4" /> Reopen
                  </button>
                )}
                {status !== 'void' && status !== 'paid' && (
                  <button type="button" onClick={markVoid} disabled={busy === 'void'} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-destructive disabled:opacity-60">
                    <Ban className="h-4 w-4" /> Void
                  </button>
                )}
                <button type="button" onClick={destroy} disabled={busy === 'delete'} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-white text-foreground-muted hover:text-destructive hover:border-destructive disabled:opacity-60" aria-label="Delete invoice">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-body-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}
        {info && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-body-sm text-green-800">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{info}</div>
          </div>
        )}

        {view && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-1 space-y-6">
              <Card title="Bill to">
                {editing ? (
                  <>
                    <Field label="Client name *"><input className={inputCls} value={view.client_name} onChange={e => setDraft(d => d && ({ ...d, client_name: e.target.value }))} /></Field>
                    <Field label="Email *"><input className={inputCls} type="email" value={view.client_email} onChange={e => setDraft(d => d && ({ ...d, client_email: e.target.value }))} /></Field>
                    <Field label="Company"><input className={inputCls} value={view.client_company ?? ''} onChange={e => setDraft(d => d && ({ ...d, client_company: e.target.value }))} /></Field>
                    <Field label="Billing address"><textarea className={inputCls} rows={3} value={view.client_address ?? ''} onChange={e => setDraft(d => d && ({ ...d, client_address: e.target.value }))} /></Field>
                  </>
                ) : (
                  <div className="space-y-1 text-body-sm">
                    <div className="font-semibold text-primary">{view.client_name}</div>
                    {view.client_company && <div className="text-foreground-muted">{view.client_company}</div>}
                    {view.client_address && <div className="text-foreground-muted whitespace-pre-line">{view.client_address}</div>}
                    <div className="text-gold-dark"><a href={`mailto:${view.client_email}`} className="hover:underline">{view.client_email}</a></div>
                  </div>
                )}
              </Card>

              <Card title="Dates & terms">
                {editing ? (
                  <>
                    <Field label="Issue date"><input className={inputCls} type="date" value={view.issue_date} onChange={e => setDraft(d => d && ({ ...d, issue_date: e.target.value }))} /></Field>
                    <Field label="Due date"><input className={inputCls} type="date" value={view.due_date} onChange={e => setDraft(d => d && ({ ...d, due_date: e.target.value }))} /></Field>
                    <Field label="Payment terms"><input className={inputCls} value={view.payment_terms ?? ''} onChange={e => setDraft(d => d && ({ ...d, payment_terms: e.target.value }))} /></Field>
                    <Field label="Property reference"><input className={inputCls} value={view.property_reference ?? ''} onChange={e => setDraft(d => d && ({ ...d, property_reference: e.target.value }))} /></Field>
                  </>
                ) : (
                  <dl className="space-y-2 text-body-sm">
                    <Row label="Issued" value={formatDate(view.issue_date)} />
                    <Row label="Due" value={formatDate(view.due_date)} />
                    <Row label="Terms" value={view.payment_terms ?? 'Net 30'} />
                    {view.property_reference && <Row label="Property" value={view.property_reference} />}
                    {invoice.sent_at && <Row label="Sent" value={formatDate(invoice.sent_at.slice(0, 10))} />}
                    {invoice.paid_at && <Row label="Paid" value={`${formatDate(invoice.paid_at.slice(0, 10))} · ${invoice.paid_method ?? '—'} · ${formatMoney(invoice.paid_amount ?? invoice.total)}`} />}
                  </dl>
                )}
              </Card>

              <Card title="Payment link">
                {editing ? (
                  <Field label="Stripe payment link URL"><input className={inputCls} value={view.stripe_payment_link_url ?? ''} onChange={e => setDraft(d => d && ({ ...d, stripe_payment_link_url: e.target.value }))} placeholder="https://buy.stripe.com/..." /></Field>
                ) : view.stripe_payment_link_url ? (
                  <div className="space-y-2">
                    <a href={view.stripe_payment_link_url} target="_blank" rel="noopener noreferrer" className="block text-body-sm text-gold-dark hover:underline break-all">
                      {view.stripe_payment_link_url}
                    </a>
                    <p className="text-caption text-foreground-muted">Card + ACH enabled. Stripe will auto-mark this invoice paid when the customer checks out.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-caption text-foreground-muted">No payment link yet. Generate one for card + ACH checkout, or paste a manually-created Stripe link via Edit.</p>
                    <button
                      type="button"
                      onClick={generatePaymentLink}
                      disabled={busy === 'link' || invoice.status === 'paid' || invoice.status === 'void'}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-body-sm font-semibold text-primary hover:bg-gold-light disabled:opacity-60"
                    >
                      {busy === 'link' ? 'Creating…' : 'Generate Stripe payment link'}
                    </button>
                  </div>
                )}
              </Card>

              {/* Payment reminders — only relevant once the invoice has been
                  sent. Drafts don't get reminders. */}
              {invoice.status !== 'draft' && invoice.status !== 'void' && (
                <Card title="Payment reminders">
                  {/* Per-invoice toggle. The `reminders_enabled` column is
                      added by migration 0013 — if it's missing, default to
                      true. Disabling stops the cron from firing further
                      reminders for this client. */}
                  <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-gold/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={invoice.reminders_enabled !== false}
                      onChange={e => toggleReminders(e.target.checked)}
                      disabled={busy === 'reminders' || editing}
                      className="mt-0.5 h-4 w-4 rounded text-gold focus:ring-gold"
                    />
                    <div>
                      <div className="text-body-sm font-semibold text-primary">Auto-send reminders</div>
                      <div className="text-caption text-foreground-muted">Cron checks daily and emails this client at each stage below — until the invoice is paid.</div>
                    </div>
                  </label>

                  <div className="mt-3 space-y-1.5">
                    {REMINDER_STAGES.map(def => {
                      const log = reminders.find(r => r.stage === def.stage);
                      const sent = !!log;
                      const sentDate = log ? new Date(log.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
                      return (
                        <div key={def.stage} className="flex items-center justify-between gap-2 text-caption">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${sent ? 'bg-green-600' : 'bg-foreground-subtle'}`} />
                            <span className={`truncate ${sent ? 'text-primary' : 'text-foreground-muted'}`}>{def.label}</span>
                          </div>
                          {sent ? (
                            <span className="text-foreground-muted shrink-0">Sent {sentDate}</span>
                          ) : (
                            <span className="text-foreground-muted/60 shrink-0">Scheduled</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Manual fire — picks the next unsent stage server-side
                      and emails it now. Useful when the cron's schedule is
                      too patient and the operator wants to nudge the client
                      ahead of the next trigger date. */}
                  {invoice.reminders_enabled !== false && reminders.length < REMINDER_STAGES.length && (
                    <button
                      type="button"
                      onClick={sendReminderNow}
                      disabled={busy === 'remind'}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/5 px-3 py-1.5 text-caption font-semibold text-gold-dark hover:bg-gold/10 disabled:opacity-60"
                    >
                      <BellRing className="h-3.5 w-3.5" />
                      {busy === 'remind' ? 'Sending…' : 'Send reminder now'}
                    </button>
                  )}
                </Card>
              )}

              {/* Email open tracking — populated by the Resend webhook.
                  Only shown after the invoice has been sent at least once. */}
              {invoice.status !== 'draft' && invoice.status !== 'void' && (
                <Card title="Email tracking">
                  {!invoice.last_email_message_id ? (
                    <p className="text-body-sm text-foreground-muted">
                      No tracking message id on file. Send (or re-send) the invoice to start tracking opens.
                    </p>
                  ) : invoice.open_count && invoice.open_count > 0 ? (
                    <div className="space-y-2 text-body-sm">
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-green-50 border border-green-200 text-green-900 font-semibold">
                        <CheckCircle className="h-4 w-4" />
                        Opened {invoice.open_count} time{invoice.open_count !== 1 ? 's' : ''}
                      </div>
                      <Row label="First open" value={invoice.first_opened_at ? new Date(invoice.first_opened_at).toLocaleString() : '—'} />
                      <Row label="Most recent" value={invoice.last_opened_at ? new Date(invoice.last_opened_at).toLocaleString() : '—'} />
                      {emailEvents.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-caption text-gold-dark font-semibold hover:text-gold">
                            Activity log ({emailEvents.length} event{emailEvents.length !== 1 ? 's' : ''})
                          </summary>
                          <ul className="mt-2 space-y-1.5 text-caption">
                            {emailEvents.map(ev => (
                              <li key={ev.id} className="flex items-center justify-between gap-2 border-b border-border pb-1.5 last:border-0">
                                <span className="text-foreground-muted">
                                  {new Date(ev.occurred_at).toLocaleString()}
                                </span>
                                <span className="font-mono text-primary">
                                  {ev.event_type.replace('email.', '')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-medium text-body-sm">
                        Not yet opened
                      </div>
                      <p className="text-caption text-foreground-muted">
                        We'll record the open here as soon as the client loads the email. Some email clients block tracking images for privacy — if you suspect they read it but it doesn't show, that's why.
                      </p>
                    </div>
                  )}
                  {emailEvents.some(ev => ev.event_type === 'email.bounced' || ev.event_type === 'email.complained') && (
                    <p className="mt-3 text-caption text-red-700">
                      ⚠ A bounce or complaint was reported for this invoice. Check the activity log above.
                    </p>
                  )}
                </Card>
              )}
            </section>

            <section className="lg:col-span-2 space-y-6">
              <Card title="Line items">
                {editing ? (
                  <>
                    <div className="space-y-3">
                      {view.line_items.map((it, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-start">
                          <input className={`${inputCls} col-span-12 sm:col-span-6`} value={it.description} onChange={e => updDraftItem(i, { description: e.target.value })} />
                          <input className={`${inputCls} col-span-3 sm:col-span-1`} type="number" min="0" step="0.01" value={it.quantity || ''} onChange={e => updDraftItem(i, { quantity: Number(e.target.value) || 0 })} />
                          <input className={`${inputCls} col-span-4 sm:col-span-2`} type="number" min="0" step="0.01" value={it.rate || ''} onChange={e => updDraftItem(i, { rate: Number(e.target.value) || 0 })} />
                          <div className="col-span-4 sm:col-span-2 text-right py-2.5 font-mono text-body-sm">{formatMoney(it.amount)}</div>
                          <button type="button" onClick={() => removeDraftLine(i)} disabled={view.line_items.length === 1} className="col-span-1 inline-flex items-center justify-center h-10 w-10 rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive/5 disabled:opacity-30">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addDraftLine} className="mt-3 text-body-sm font-semibold text-gold-dark hover:text-gold">+ Add line</button>
                  </>
                ) : (
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="text-left text-caption uppercase tracking-widest text-foreground-muted border-b border-border">
                        <th className="py-2 font-semibold">Description</th>
                        <th className="py-2 font-semibold text-right">Qty</th>
                        <th className="py-2 font-semibold text-right">Rate</th>
                        <th className="py-2 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.line_items.map(it => (
                        <tr key={it.id ?? it.sort_order} className="border-b border-border last:border-0">
                          <td className="py-3 text-primary">{it.description}</td>
                          <td className="py-3 text-right font-mono text-foreground-muted">{it.quantity}</td>
                          <td className="py-3 text-right font-mono text-foreground-muted">{formatMoney(it.rate)}</td>
                          <td className="py-3 text-right font-mono font-semibold text-primary">{formatMoney(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>

              <Card title="Totals">
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-2 text-body-sm">
                    <div className="flex justify-between"><span className="text-foreground-muted">Subtotal</span><span className="font-mono">{formatMoney(totals.subtotal)}</span></div>
                    <div className="flex justify-between items-center gap-3">
                      <label className="text-foreground-muted flex items-center gap-2">
                        Tax rate
                        {editing ? (
                          <input className="w-20 rounded border border-border px-2 py-1 text-right font-mono text-body-sm" type="number" min="0" max="100" step="0.001" value={view.tax_rate ? (view.tax_rate * 100).toString() : ''} onChange={e => setDraft(d => d && ({ ...d, tax_rate: (Number(e.target.value) || 0) / 100 }))} placeholder="0" />
                        ) : (
                          <span className="font-mono">{view.tax_rate ? `${(view.tax_rate * 100).toFixed(2).replace(/\.?0+$/, '')}%` : '0%'}</span>
                        )}
                      </label>
                      <span className="font-mono">{formatMoney(totals.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-gold">
                      <span className="font-heading text-heading-sm font-bold text-primary">Total</span>
                      <span className="font-heading text-heading-sm font-bold text-gold-dark font-mono">{formatMoney(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Notes">
                {editing ? (
                  <>
                    <Field label="Memo shown on the invoice"><textarea className={inputCls} rows={3} value={view.notes ?? ''} onChange={e => setDraft(d => d && ({ ...d, notes: e.target.value }))} /></Field>
                    <Field label="Internal notes (admins only)"><textarea className={inputCls} rows={2} value={view.internal_notes ?? ''} onChange={e => setDraft(d => d && ({ ...d, internal_notes: e.target.value }))} /></Field>
                  </>
                ) : (
                  <div className="space-y-3 text-body-sm">
                    {view.notes ? (
                      <div>
                        <p className="text-caption uppercase tracking-widest text-foreground-muted mb-1">Memo</p>
                        <p className="text-primary whitespace-pre-line">{view.notes}</p>
                      </div>
                    ) : <p className="text-caption text-foreground-muted">No memo on the client-facing invoice.</p>}
                    {view.internal_notes && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-caption uppercase tracking-widest text-foreground-muted mb-1">Internal (admins only)</p>
                        <p className="text-primary whitespace-pre-line">{view.internal_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Email override card — what the client sees when this invoice is sent. */}
              <Card title="Email">
                {editing ? (
                  <>
                    <p className="text-caption text-foreground-muted">
                      Custom subject + message for this invoice only. Leave blank to use the global template at send time.
                    </p>
                    <Field label="Subject">
                      <input
                        className={inputCls}
                        value={view.email_subject ?? ''}
                        onChange={e => setDraft(d => d && ({ ...d, email_subject: e.target.value }))}
                        placeholder="Leave blank to use global template"
                      />
                    </Field>
                    <Field label="Message">
                      <textarea
                        className={`${inputCls} font-mono text-caption`}
                        rows={8}
                        value={view.email_message ?? ''}
                        onChange={e => setDraft(d => d && ({ ...d, email_message: e.target.value }))}
                        placeholder="Leave blank to use global template"
                      />
                    </Field>
                  </>
                ) : view.email_subject || view.email_message ? (
                  <div className="space-y-3 text-body-sm">
                    {view.email_subject && (
                      <div>
                        <p className="text-caption uppercase tracking-widest text-foreground-muted mb-1">Subject</p>
                        <p className="text-primary">{view.email_subject}</p>
                      </div>
                    )}
                    {view.email_message && (
                      <div>
                        <p className="text-caption uppercase tracking-widest text-foreground-muted mb-1">Message</p>
                        <p className="text-primary whitespace-pre-line text-caption font-mono">{view.email_message}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-caption text-foreground-muted">
                    Using the global template. <Link href="/billing/invoices/settings" className="text-gold-dark hover:underline">Edit the default →</Link>
                  </p>
                )}

                {/* Live preview — same HTML the client would receive right
                    now. Resolves per-invoice override → global template
                    substituted, then renders into the sandboxed iframe.
                    Updates as you edit. */}
                <div className="pt-2">
                  <p className="text-caption uppercase tracking-widest text-foreground-muted mb-2">Preview · this is what the client sees</p>
                  <iframe
                    srcDoc={previewHtml}
                    title="Invoice email preview"
                    sandbox=""
                    className="w-full h-[640px] rounded-lg border border-border bg-background-cream"
                  />
                </div>
              </Card>
            </section>
          </div>
        )}
      </div>

      {/* Compose-before-send modal */}
      {composeOpen && invoice && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto"
          onClick={() => !busy && setComposeOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="compose-title" className="font-heading text-body font-bold text-primary">
                    Send invoice {invoice.invoice_number}
                  </h2>
                  <p className="text-caption text-foreground-muted">
                    Review and edit before sending
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !busy && setComposeOpen(false)}
                disabled={!!busy}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">To</span>
                <div className="rounded-lg bg-background-cream border border-border px-3 py-2.5 text-body-sm text-primary">
                  {invoice.client_email}
                </div>
              </div>

              <label className="block">
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">CC (optional)</span>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="zack@crecotx.com"
                  value={composeCc}
                  onChange={e => setComposeCc(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Subject</span>
                <input
                  type="text"
                  className={inputCls}
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="flex items-center justify-between text-caption uppercase tracking-widest text-foreground-muted mb-1">
                  <span>Message</span>
                  <button
                    type="button"
                    onClick={resetCompose}
                    className="text-caption normal-case tracking-normal text-gold-dark hover:text-gold"
                  >
                    Reset to template
                  </button>
                </span>
                <textarea
                  className={inputCls}
                  rows={10}
                  value={composeMessage}
                  onChange={e => setComposeMessage(e.target.value)}
                />
                <p className="mt-1.5 text-caption text-foreground-muted">
                  Goes above the auto-generated summary and Pay-online button. Edit the global default at{' '}
                  <Link href="/billing/invoices/settings" className="text-gold-dark hover:underline">/billing/invoices/settings</Link>.
                </p>
              </label>

              <div className="rounded-lg bg-background-cream/60 border border-border px-4 py-3 text-caption text-foreground-muted">
                <div className="font-semibold text-primary text-body-sm mb-1">Attached</div>
                <div>📎 {invoice.invoice_number}.pdf — full invoice rendered with line items, totals, and payment instructions</div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-background-cream/40 flex items-center justify-between gap-3 rounded-b-2xl">
              <p className="text-caption text-foreground-muted">
                Sending will mark this invoice as <span className="font-semibold">Sent</span>.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSend}
                  disabled={busy === 'send' || !composeSubject.trim() || !composeMessage.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" /> {busy === 'send' ? 'Sending…' : 'Send invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark-paid modal — replaces the old window.prompt flow. Method pills
          for the most-common payment channels (Check / ACH / Stripe / Cash /
          Other), amount input prefilled with the invoice total, date picker
          for backdating to the day a bank deposit cleared, optional notes
          that append to internal_notes for audit. */}
      {markPaidOpen && invoice && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto"
          onClick={() => !busy && setMarkPaidOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="markpaid-title"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-800">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="markpaid-title" className="font-heading text-body font-bold text-primary">
                    Mark {invoice.invoice_number} paid
                  </h2>
                  <p className="text-caption text-foreground-muted">
                    Record the payment and close out this invoice
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !busy && setMarkPaidOpen(false)}
                disabled={!!busy}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Method pills — keyboard-navigable, semantic radio behavior */}
              <div>
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-2">Method</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5" role="radiogroup" aria-label="Payment method">
                  {['Check', 'ACH', 'Stripe', 'Cash', 'Other'].map(m => {
                    const selected = paidMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setPaidMethod(m)}
                        className={`rounded-lg border-2 px-3 py-2 text-body-sm font-semibold transition-colors ${
                          selected
                            ? 'border-gold bg-gold/5 text-primary'
                            : 'border-border bg-white text-foreground-muted hover:border-gold/50'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">
                  Amount received <span className="text-foreground-muted/60 normal-case">· invoice total {formatMoney(invoice.total)}</span>
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmountStr}
                    onChange={e => setPaidAmountStr(e.target.value)}
                    className={`${inputCls} pl-7 font-mono`}
                    autoFocus
                  />
                </div>
                {Number(paidAmountStr) > 0 && Math.abs(Number(paidAmountStr) - invoice.total) > 0.005 && (
                  <p className="mt-1.5 text-caption text-amber-700">
                    {Number(paidAmountStr) < invoice.total ? '⚠ Partial payment' : '⚠ Overpayment'} — invoice will still mark fully paid. Adjust separately if needed.
                  </p>
                )}
              </label>

              <label className="block">
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Payment date</span>
                <input
                  type="date"
                  value={paidDate}
                  onChange={e => setPaidDate(e.target.value)}
                  className={inputCls}
                />
                <p className="mt-1.5 text-caption text-foreground-muted">
                  Backdate to the day the deposit cleared. Defaults to today.
                </p>
              </label>

              <label className="block">
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">
                  Notes <span className="text-foreground-muted/60 normal-case">(optional)</span>
                </span>
                <textarea
                  rows={2}
                  value={paidNotes}
                  onChange={e => setPaidNotes(e.target.value)}
                  className={inputCls}
                  placeholder='Check #1234, deposit batch B-072, etc.'
                />
                <p className="mt-1.5 text-caption text-foreground-muted">
                  Appended to the invoice&apos;s internal notes for audit context.
                </p>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-border bg-background-cream/40 flex items-center justify-between gap-3 rounded-b-2xl">
              <p className="text-caption text-foreground-muted">
                Invoice will close as <span className="font-semibold text-green-700">Paid</span>.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMarkPaidOpen(false)}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmMarkPaid}
                  disabled={busy === 'paid' || !Number(paidAmountStr) || Number(paidAmountStr) <= 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-5 py-2 text-body-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  <CheckCircle className="h-4 w-4" /> {busy === 'paid' ? 'Saving…' : 'Mark paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 sm:p-6 space-y-4">
      <h2 className="font-heading text-body font-bold text-primary">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="text-primary text-right">{value}</dd>
    </div>
  );
}
