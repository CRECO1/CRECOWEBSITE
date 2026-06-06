'use client';

/**
 * /billing/invoices/new — create a new invoice.
 *
 * Form is intentionally one screen: client block on the left, line items
 * + totals on the right. Submitting either saves as a Draft (default) or
 * saves + sends in one click.
 *
 * Invoice number is generated client-side by counting how many invoices
 * exist in the current year and appending the next sequence. Not strictly
 * concurrency-safe — two simultaneous creates could collide — but the
 * `unique` constraint on the column will surface that and the user can
 * just save again. For a single-user admin this is fine.
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Send, AlertTriangle, Mail, RotateCw, Repeat, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  calculateTotals, formatMoney, lineAmount, nextInvoiceNumber,
  type Invoice, type InvoiceLineItem,
} from '@/lib/invoices';
import { FALLBACK_TEMPLATE, substituteTemplate } from '@/lib/invoice-email';
import { buildInvoiceEmailPreview } from '@/lib/invoice-email-html';
import { advanceNextRun, type RecurringFrequency } from '@/lib/recurring-invoices';
import { ClientPicker } from '@/components/billing/ClientPicker';
import { PropertyPicker } from '@/components/billing/PropertyPicker';
import type { ClientLite } from '@/lib/clients';
import type { PropertyLite } from '@/lib/properties';
import { logActivity } from '@/lib/activity-log';
import { formInputCls as inputCls } from '@/lib/form-styles';
import { useWorkspaceOrThrow } from '@/components/billing/WorkspaceProvider';

const DEFAULT_LINE: Omit<InvoiceLineItem, 'sort_order'> = {
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
};

const DEFAULT_TERMS = 'Net 30';
function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Wrapper for Next.js 15: useSearchParams() must be inside a Suspense
 * boundary so the static prerender of /billing/invoices/new doesn't bail.
 */
export default function NewInvoicePage() {
  return (
    <Suspense fallback={null}>
      <NewInvoicePageInner />
    </Suspense>
  );
}

function NewInvoicePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get('clone');
  // Multi-tenancy: every new invoice + line item + (optional) recurring
  // template is workspace-scoped. Throws if used outside a
  // WorkspaceProvider — fail loud rather than silently insert without
  // workspace_id.
  const workspace = useWorkspaceOrThrow();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  // Banner shown when we successfully prefilled from a previous invoice —
  // makes it obvious to the operator that this isn't a blank form so they
  // tweak (rather than think the prefill was a bug and re-enter everything).
  const [clonedBanner, setClonedBanner] = useState<string | null>(null);
  // Set when the operator picks a saved client from the typeahead.
  // When null, the bill-to fields are treated as a new client and we
  // upsert by email on save.
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_TERMS);
  const [propertyReference, setPropertyReference] = useState('');
  // Optional FK to a property record. When set, the invoice also writes
  // property_reference (denormalized text snapshot) so legacy reports
  // and the picker-fallback display continue to work.
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(0);             // store as decimal (0.0825 = 8.25%)
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [stripeLink, setStripeLink] = useState('');
  const [items, setItems] = useState<(typeof DEFAULT_LINE)[]>([{ ...DEFAULT_LINE }]);

  // Recurring schedule — 'none' = one-off invoice (default), anything else
  // also creates a recurring template that the cron picks up. End date is
  // optional; auto-send controls whether future generations email
  // automatically or land in the inbox as drafts for review.
  const [recurringFreq, setRecurringFreq] = useState<'none' | RecurringFrequency>('none');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringAutoSend, setRecurringAutoSend] = useState(false);

  // Email content for this specific invoice. Initialized from the global
  // template at mount + after the auto-generated invoice number lands.
  // Once the admin edits either field, we stop auto-syncing — `userTouched`
  // gates the re-render so typing in line items doesn't blow away their
  // edits. The "Reset to template" button forces a re-render either way.
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailUserTouched, setEmailUserTouched] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<{ default_subject: string; default_message: string }>(FALLBACK_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate the invoice number once on mount
  useEffect(() => {
    (async () => {
      const year = new Date().getFullYear();
      const yearStart = `${year}-01-01`;
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .gte('issue_date', yearStart);
      setInvoiceNumber(nextInvoiceNumber(count ?? 0, year));
    })();
  }, []);

  // Load the workspace's email template once on mount.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('invoice_settings')
        .select('default_subject, default_message')
        .eq('workspace_id', workspace.id)
        .single();
      if (data) setEmailTemplate(data);
    })();
  }, [workspace.id]);

  // If we were arrived at with ?clone=<id>, pull the source invoice + its
  // line items and prefill every editable field. Issue date snaps to today
  // and due date to today+30 — keeping the source's date would surface bugs
  // ("why is this invoice dated 2 months ago?") that operators have to
  // correct anyway. Everything else (client, line items, tax, terms, notes)
  // carries forward.
  useEffect(() => {
    if (!cloneId) return;
    (async () => {
      const { data: src } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', cloneId)
        .maybeSingle();
      if (!src) {
        // Source invoice doesn't exist (or RLS hid it). Don't silently render
        // a blank form — surface the failure so the operator knows the link
        // they followed was stale.
        setClonedBanner(null);
        setError(`Could not clone: invoice ${cloneId} not found. Starting from a blank form.`);
        return;
      }
      const { data: srcItems } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', cloneId)
        .order('sort_order', { ascending: true });

      setClientId(src.client_id ?? null);
      setClientName(src.client_name ?? '');
      setClientEmail(src.client_email ?? '');
      setClientCompany(src.client_company ?? '');
      setClientAddress(src.client_address ?? '');
      setPaymentTerms(src.payment_terms ?? DEFAULT_TERMS);
      setPropertyId(src.property_id ?? null);
      setPropertyReference(src.property_reference ?? '');
      setTaxRate(Number(src.tax_rate) || 0);
      setNotes(src.notes ?? '');
      // Internal notes get a "Duplicated from" stamp at the top so the
      // operator can trace lineage. They can edit / strip it freely.
      setInternalNotes(
        `[Duplicated from ${src.invoice_number}]` +
        (src.internal_notes ? `\n\n${src.internal_notes}` : '')
      );
      if (srcItems && srcItems.length > 0) {
        setItems(
          srcItems.map((it: { description: string; quantity: number; rate: number; amount: number }) => ({
            description: it.description,
            quantity: Number(it.quantity),
            rate: Number(it.rate),
            amount: Number(it.amount),
          }))
        );
      }
      setClonedBanner(`Duplicated from ${src.invoice_number} · ${src.client_name}. Tweak as needed, then save.`);
    })();
  }, [cloneId]);

  const totals = useMemo(() => calculateTotals(items, taxRate), [items, taxRate]);

  /**
   * Build a partial Invoice-shaped object from the current form state so
   * substituteTemplate() can swap {{variables}} in real-time as the admin
   * fills the form. Recomputed on every change.
   */
  const previewInvoice: Invoice = useMemo(() => ({
    id: '',
    workspace_id: workspace.id,
    invoice_number: invoiceNumber || 'INV-PREVIEW',
    client_name: clientName,
    client_email: clientEmail,
    client_company: clientCompany || null,
    client_address: clientAddress || null,
    issue_date: issueDate,
    due_date: dueDate,
    status: 'draft',
    subtotal: totals.subtotal,
    tax_rate: taxRate,
    tax_amount: totals.tax_amount,
    total: totals.total,
    property_reference: propertyReference || null,
    notes: notes || null,
    internal_notes: internalNotes || null,
    stripe_payment_link_url: stripeLink || null,
    payment_terms: paymentTerms,
    sent_at: null,
    paid_at: null,
    paid_amount: null,
    paid_method: null,
    created_at: '',
    updated_at: '',
  }), [invoiceNumber, clientName, clientEmail, clientCompany, clientAddress, issueDate, dueDate, totals, taxRate, propertyReference, notes, internalNotes, stripeLink, paymentTerms]);

  // Keep the email subject + message synced to the substituted template
  // *until* the admin manually edits them. Once they type in either field,
  // emailUserTouched flips and we stop auto-syncing (so subsequent edits
  // to other invoice fields don't clobber their wording).
  useEffect(() => {
    if (emailUserTouched) return;
    setEmailSubject(substituteTemplate(emailTemplate.default_subject, previewInvoice));
    setEmailMessage(substituteTemplate(emailTemplate.default_message, previewInvoice));
  }, [previewInvoice, emailTemplate, emailUserTouched]);

  function resetEmailToTemplate() {
    setEmailUserTouched(false);
    setEmailSubject(substituteTemplate(emailTemplate.default_subject, previewInvoice));
    setEmailMessage(substituteTemplate(emailTemplate.default_message, previewInvoice));
  }

  // Live email preview HTML — wraps the shared body renderer with a
  // simulated inbox header (From / To / Subject / Attachment chip) so
  // the admin sees exactly what the client receives.
  const previewHtml = useMemo(
    () => buildInvoiceEmailPreview({
      invoice: previewInvoice,
      subject: emailSubject,
      message: emailMessage,
    }),
    [previewInvoice, emailSubject, emailMessage],
  );

  function updateItem(i: number, patch: Partial<typeof DEFAULT_LINE>) {
    setItems(prev => {
      const next = prev.map((it, idx) => idx === i ? { ...it, ...patch } : it);
      next[i].amount = lineAmount(next[i]);
      return next;
    });
  }

  function addLine() {
    setItems(prev => [...prev, { ...DEFAULT_LINE }]);
  }

  function removeLine(i: number) {
    setItems(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));
  }

  async function save(action: 'draft' | 'send'): Promise<void> {
    setError(null);
    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Client name and email are required.');
      return;
    }
    if (!items.some(it => it.description.trim() && (it.quantity > 0) && (it.rate >= 0))) {
      setError('Add at least one line item with a description and quantity.');
      return;
    }

    setSaving(true);

    // ── Upsert the client row by email so future invoices can pick
    //    them from the typeahead. If they picked an existing client
    //    from the dropdown, we already have client_id. If not, the
    //    insert below either creates a new clients row or returns the
    //    existing id when the email is already on file (the API
    //    handles the 23505 unique-violation case).
    let resolvedClientId: string | null = clientId;
    if (!resolvedClientId && clientEmail.trim()) {
      try {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: clientName.trim(),
            email: clientEmail.trim().toLowerCase(),
            company: clientCompany.trim() || null,
            address: clientAddress.trim() || null,
            property_reference: propertyReference.trim() || null,
          }),
        });
        const body = await res.json();
        if (res.ok && body.id) {
          resolvedClientId = body.id;
        }
        // Failures here are non-fatal — we still save the invoice,
        // just without a client_id link. The denormalized snapshot
        // columns carry the data.
      } catch {
        /* swallow — client save is best-effort */
      }
    }

    // Only persist email_subject/email_message if the admin actually
    // customized them (or if we want them frozen exactly as they'd render
    // right now). emailUserTouched is the signal — if the admin never
    // touched the email fields, leave them null so future global-template
    // changes apply automatically.
    const emailOverride = emailUserTouched
      ? {
          email_subject: emailSubject.trim() || null,
          email_message: emailMessage.trim() || null,
        }
      : {
          email_subject: null,
          email_message: null,
        };

    const { data: created, error: insertErr } = await supabase
      .from('invoices')
      .insert([{
        workspace_id: workspace.id,
        invoice_number: invoiceNumber,
        client_id: resolvedClientId,
        client_name: clientName.trim(),
        client_email: clientEmail.trim().toLowerCase(),
        client_company: clientCompany.trim() || null,
        client_address: clientAddress.trim() || null,
        issue_date: issueDate,
        due_date: dueDate,
        status: 'draft',
        subtotal: totals.subtotal,
        tax_rate: taxRate,
        tax_amount: totals.tax_amount,
        total: totals.total,
        property_id: propertyId,
        property_reference: propertyReference.trim() || null,
        notes: notes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        stripe_payment_link_url: stripeLink.trim() || null,
        payment_terms: paymentTerms.trim() || DEFAULT_TERMS,
        ...emailOverride,
      }])
      .select()
      .single();

    if (insertErr || !created) {
      setSaving(false);
      setError(insertErr?.message ?? 'Could not save invoice.');
      return;
    }

    // Activity log: log creation immediately after the row lands. Fire
    // and forget — the helper is best-effort.
    logActivity({
      action: cloneId ? 'duplicated' : 'created',
      entity_type: 'invoice',
      entity_id: created.id,
      entity_label: invoiceNumber,
      diff: cloneId ? { duplicated_from: cloneId } : null,
    });

    // Insert line items (filter blanks)
    const lineRows = items
      .filter(it => it.description.trim())
      .map((it, sort_order) => ({
        workspace_id: workspace.id,
        invoice_id: created.id,
        description: it.description.trim(),
        quantity: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
        amount: lineAmount(it),
        sort_order,
      }));
    if (lineRows.length > 0) {
      const { error: itemsErr } = await supabase.from('invoice_line_items').insert(lineRows);
      if (itemsErr) {
        setSaving(false);
        setError(itemsErr.message);
        return;
      }
    }

    // ── Recurring? Set up the template + link the invoice to it ─────────
    // This invoice IS the first occurrence. The template's next_run_date
    // is the date the NEXT one should generate — compute it by advancing
    // from the issue date by one frequency cycle.
    if (recurringFreq !== 'none') {
      const nextRun = advanceNextRun(issueDate, recurringFreq);
      // due_days = number of days between issue_date and due_date on the
      // invoice the operator just configured. The cron uses this to pick
      // the due_date for each generated invoice.
      const issueDateObj = new Date(issueDate + 'T00:00:00Z');
      const dueDateObj = new Date(dueDate + 'T00:00:00Z');
      const dueDays = Math.max(0, Math.round((dueDateObj.getTime() - issueDateObj.getTime()) / 86_400_000));

      const { data: tpl, error: tplErr } = await supabase
        .from('recurring_invoice_templates')
        .insert([{
          workspace_id: workspace.id,
          name: `${clientCompany || clientName} — ${recurringFreq}`,
          client_id: resolvedClientId,
          client_name: clientName.trim(),
          client_email: clientEmail.trim().toLowerCase(),
          client_company: clientCompany.trim() || null,
          client_address: clientAddress.trim() || null,
          property_id: propertyId,
          property_reference: propertyReference.trim() || null,
          tax_rate: taxRate,
          payment_terms: paymentTerms.trim() || DEFAULT_TERMS,
          notes: notes.trim() || null,
          internal_notes: internalNotes.trim() || null,
          frequency: recurringFreq,
          next_run_date: nextRun,
          end_date: recurringEndDate || null,
          on_generate: recurringAutoSend ? 'send_immediately' : 'draft',
          due_days: dueDays,
          active: true,
          last_run_invoice_id: created.id,
        }])
        .select('id')
        .single();

      if (tplErr) {
        // Don't roll back the invoice — it's still a valid one-off. Just
        // surface the failure so the operator can retry the recurring
        // setup from the /billing/recurring page.
        setSaving(false);
        setError(`Invoice saved, but recurring setup failed: ${tplErr.message}. Open /billing/recurring/new to set it up manually.`);
        router.push(`/billing/invoices/${created.id}`);
        return;
      }

      // Clone the line items into the template (drop invoice_id, swap in template_id)
      const tplLines = lineRows.map(li => ({
        workspace_id: workspace.id,
        template_id: tpl.id,
        description: li.description,
        quantity: li.quantity,
        rate: li.rate,
        amount: li.amount,
        sort_order: li.sort_order,
      }));
      if (tplLines.length > 0) {
        await supabase.from('recurring_invoice_line_items').insert(tplLines);
      }

      // Back-link the invoice to the template
      await supabase
        .from('invoices')
        .update({ recurring_template_id: tpl.id })
        .eq('id', created.id);
    }

    if (action === 'send') {
      const res = await fetch(`/api/invoices/${created.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaving(false);
        setError(body?.error ?? 'Saved as draft, but email send failed.');
        // Still navigate to the detail page so the admin can retry
        router.push(`/billing/invoices/${created.id}`);
        return;
      }
    }

    router.push(`/billing/invoices/${created.id}`);
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/billing/invoices" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Invoices
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary">
              New invoice {invoiceNumber && <span className="font-mono text-body-sm text-foreground-muted ml-1">{invoiceNumber}</span>}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => save('draft')}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-body-sm font-semibold text-primary hover:border-primary disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={() => save('send')}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {saving ? 'Sending…' : 'Save & send'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {clonedBanner && (
          <div className="flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/5 p-4 text-body-sm text-gold-dark">
            <Copy className="h-5 w-5 shrink-0 mt-0.5" />
            <div>{clonedBanner}</div>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-body-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client + meta */}
          <section className="lg:col-span-1 space-y-6">
            <Card title="Bill to">
              <ClientPicker
                selectedId={clientId}
                onPick={(c: ClientLite) => {
                  setClientId(c.id);
                  setClientName(c.name);
                  setClientEmail(c.email);
                  setClientCompany(c.company ?? '');
                  setClientAddress(c.address ?? '');
                  if (c.property_reference && !propertyReference) {
                    setPropertyReference(c.property_reference);
                  }
                  // Apply client billing defaults — these flow through from
                  // the saved client record into this invoice's form. The
                  // operator can override any of them per-invoice.
                  if (c.default_tax_rate != null) setTaxRate(c.default_tax_rate);
                  if (c.default_payment_terms) setPaymentTerms(c.default_payment_terms);
                }}
                onClear={() => {
                  setClientId(null);
                  // Don't clear the bill-to fields — the operator may
                  // want to start from the prefilled values and tweak.
                  // They can clear manually if needed.
                }}
              />
              <Field label="Client name *">
                <input className={inputCls} value={clientName} onChange={e => { setClientName(e.target.value); setClientId(null); }} required />
              </Field>
              <Field label="Email *">
                <input className={inputCls} type="email" value={clientEmail} onChange={e => { setClientEmail(e.target.value); setClientId(null); }} required />
              </Field>
              <Field label="Company">
                <input className={inputCls} value={clientCompany} onChange={e => setClientCompany(e.target.value)} />
              </Field>
              <Field label="Billing address">
                <textarea className={inputCls} rows={3} value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Street, city, state, ZIP" />
              </Field>
            </Card>

            <Card title="Dates & terms">
              <Field label="Issue date">
                <input className={inputCls} type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </Field>
              <Field label="Due date">
                <input className={inputCls} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </Field>
              <Field label="Payment terms">
                <input className={inputCls} value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Net 30" />
              </Field>
              <PropertyPicker
                selectedId={propertyId}
                onPick={(p: PropertyLite) => {
                  setPropertyId(p.id);
                  // Auto-sync the text snapshot so reports + legacy
                  // displays (where property_id might not be joined)
                  // still surface the right name.
                  setPropertyReference(p.name);
                }}
                onClear={() => {
                  setPropertyId(null);
                  // Leave propertyReference alone — the operator may
                  // want to keep a free-form note that isn't tied to a
                  // registered property.
                }}
              />
              {!propertyId && (
                <Field label="Property reference (free-form)">
                  <input
                    className={inputCls}
                    value={propertyReference}
                    onChange={e => setPropertyReference(e.target.value)}
                    placeholder='Or type a one-off reference — e.g. "8000 Fair Oaks Pkwy"'
                  />
                </Field>
              )}
            </Card>

            {/* ── Repeat — turn this into a recurring template ────────── */}
            <Card title={(
              <span className="inline-flex items-center gap-2">
                <Repeat className="h-4 w-4 text-gold-dark" /> Repeat
              </span>
            )}>
              <Field label="Frequency">
                <select
                  className={inputCls}
                  value={recurringFreq}
                  onChange={e => setRecurringFreq(e.target.value as 'none' | RecurringFrequency)}
                >
                  <option value="none">Don't repeat (one-off invoice)</option>
                  <option value="monthly">Every month</option>
                  <option value="quarterly">Every quarter</option>
                  <option value="annually">Every year</option>
                </select>
                <p className="mt-1.5 text-caption text-foreground-muted">
                  Saves this invoice and sets up a template that auto-generates the next one on schedule.
                </p>
              </Field>

              {recurringFreq !== 'none' && (
                <>
                  <Field label="Stop date (optional)">
                    <input
                      className={inputCls}
                      type="date"
                      value={recurringEndDate}
                      onChange={e => setRecurringEndDate(e.target.value)}
                    />
                    <p className="mt-1.5 text-caption text-foreground-muted">
                      Leave blank to repeat indefinitely. You can pause or delete the template later from{' '}
                      <Link href="/billing/recurring" className="text-gold-dark font-semibold">Recurring</Link>.
                    </p>
                  </Field>
                  <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-gold/50">
                    <input
                      type="checkbox"
                      checked={recurringAutoSend}
                      onChange={e => setRecurringAutoSend(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-gold focus:ring-gold"
                    />
                    <div>
                      <div className="text-body-sm font-semibold text-primary">Auto-send future invoices</div>
                      <div className="text-caption text-foreground-muted">
                        Email each future invoice to the client automatically on its issue date. Off = future invoices land as drafts for you to review first.
                      </div>
                    </div>
                  </label>
                </>
              )}
            </Card>

            <Card title="Payment link">
              <Field label="Stripe payment link URL (optional)">
                <input
                  className={inputCls}
                  value={stripeLink}
                  onChange={e => setStripeLink(e.target.value)}
                  placeholder="https://buy.stripe.com/..."
                />
                <p className="mt-1.5 text-caption text-foreground-muted">
                  Create a Stripe Payment Link in your Stripe dashboard, paste the URL here, and we'll include it in the email + PDF. (Auto-creation lands when Stripe API is wired up.)
                </p>
              </Field>
            </Card>
          </section>

          {/* Line items + totals */}
          <section className="lg:col-span-2 space-y-6">
            <Card title="Line items">
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <input
                      className={`${inputCls} col-span-12 sm:col-span-6`}
                      placeholder="Description (e.g. Tenant rep commission — 1234 Main St)"
                      value={item.description}
                      onChange={e => updateItem(i, { description: e.target.value })}
                    />
                    <input
                      className={`${inputCls} col-span-3 sm:col-span-1`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Qty"
                      value={item.quantity || ''}
                      onChange={e => updateItem(i, { quantity: Number(e.target.value) || 0 })}
                    />
                    <input
                      className={`${inputCls} col-span-4 sm:col-span-2`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Rate"
                      value={item.rate || ''}
                      onChange={e => updateItem(i, { rate: Number(e.target.value) || 0 })}
                    />
                    <div className="col-span-4 sm:col-span-2 text-right py-2.5 font-mono text-body-sm text-primary">
                      {formatMoney(item.amount)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      disabled={items.length === 1}
                      className="col-span-1 inline-flex items-center justify-center h-10 w-10 rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive/5 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove line item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addLine}
                className="mt-4 inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold"
              >
                <Plus className="h-4 w-4" /> Add line
              </button>
            </Card>

            <Card title="Totals">
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2 text-body-sm">
                  <div className="flex justify-between"><span className="text-foreground-muted">Subtotal</span><span className="font-mono">{formatMoney(totals.subtotal)}</span></div>
                  <div className="flex justify-between items-center gap-3">
                    <label className="text-foreground-muted flex items-center gap-2">
                      Tax rate
                      <input
                        className="w-20 rounded border border-border px-2 py-1 text-right font-mono text-body-sm"
                        type="number"
                        min="0"
                        max="100"
                        step="0.001"
                        value={taxRate ? (taxRate * 100).toString() : ''}
                        onChange={e => setTaxRate((Number(e.target.value) || 0) / 100)}
                        placeholder="0"
                      />
                      <span className="text-foreground-muted">%</span>
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
              <Field label="Memo shown on the invoice (client sees this)">
                <textarea className={inputCls} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional — payment instructions, thank-you note, etc." />
              </Field>
              <Field label="Internal notes (admins only)">
                <textarea className={inputCls} rows={2} value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Optional — context for our records" />
              </Field>
            </Card>

            {/*
              Email preview + per-invoice override. Pre-filled from the global
              template (with {{variables}} substituted live against this
              invoice's fields). Auto-syncs as you fill the form, UNTIL you
              touch either field — then your wording sticks. "Reset to
              template" rewinds the override at any time.
            */}
            <Card title="Email">
              <div className="flex items-start justify-between gap-3 -mt-1">
                <p className="text-caption text-foreground-muted">
                  This is what the client will see when you click <span className="font-semibold text-primary">Save &amp; send</span>. Edit freely — your changes save with this invoice and override the global template just for this client. <Link href="/billing/invoices/settings" className="text-gold-dark hover:underline">Edit the global default →</Link>
                </p>
                <button
                  type="button"
                  onClick={resetEmailToTemplate}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-caption text-foreground-muted hover:text-primary shrink-0"
                  title="Reset to global template"
                >
                  <RotateCw className="h-3 w-3" /> Reset
                </button>
              </div>

              <Field label="Subject">
                <input
                  className={inputCls}
                  value={emailSubject}
                  onChange={e => { setEmailSubject(e.target.value); setEmailUserTouched(true); }}
                  placeholder="Subject line the client will see"
                />
              </Field>

              <Field label="Message">
                <textarea
                  className={`${inputCls} font-mono text-caption`}
                  rows={9}
                  value={emailMessage}
                  onChange={e => { setEmailMessage(e.target.value); setEmailUserTouched(true); }}
                  placeholder="Personal message that appears at the top of the email"
                />
                <p className="mt-1.5 text-caption text-foreground-muted flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-gold" />
                  The auto-generated summary table, "Pay online →" button, mailing address, and PDF attachment all get appended automatically — you don't need to write them.
                </p>
              </Field>

              {!emailUserTouched && (
                <p className="text-caption text-foreground-muted italic">
                  Showing the global template, substituted with this invoice's values. Start typing to customize for this client.
                </p>
              )}

              {/* Live preview — same HTML the client receives, wrapped in a
                  simulated inbox header. Updates as you type. The sandbox=""
                  attribute strips scripts + form submissions for safety,
                  since the message content is admin-controlled but we want
                  defense in depth. */}
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
      </div>
    </main>
  );
}


function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
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
