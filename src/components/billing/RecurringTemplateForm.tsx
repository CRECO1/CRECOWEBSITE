'use client';

/**
 * Shared form component for creating and editing a recurring invoice template.
 *
 * Pattern mirrors the invoice create page: client block + line items + schedule
 * config. On submit, POSTs to /api/recurring (create) or PATCHes the template id
 * (edit). The page wrappers just hand this component an `initial` prop or null.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Save, AlertTriangle, Repeat, Pause, Play, Trash,
  Send, Loader2,
} from 'lucide-react';
import {
  calculateTotals, formatMoney, lineAmount, type InvoiceLineItem,
} from '@/lib/invoices';
import {
  FREQUENCY_LABELS, ON_GENERATE_LABELS, type RecurringFrequency,
  type RecurringOnGenerate, type RecurringTemplate, type RecurringLineItem,
} from '@/lib/recurring-invoices';
import { ClientPicker } from '@/components/billing/ClientPicker';
import { PropertyPicker } from '@/components/billing/PropertyPicker';
import type { ClientLite } from '@/lib/clients';
import { formInputCls as inputCls } from '@/lib/form-styles';
import { pushPendingToast, withBust } from '@/lib/post-save-feedback';

type DraftLine = Omit<InvoiceLineItem, 'sort_order' | 'invoice_id'>;
const DEFAULT_LINE: DraftLine = { description: '', quantity: 1, rate: 0, amount: 0 };

export interface RecurringTemplateInitial extends Partial<RecurringTemplate> {
  line_items?: RecurringLineItem[];
}

function firstOfNextMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}

export function RecurringTemplateForm({
  initial,
  mode,
}: {
  initial: RecurringTemplateInitial | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();

  const [name, setName]                       = useState(initial?.name ?? '');
  const [clientId, setClientId]               = useState<string | null>(initial?.client_id ?? null);
  const [clientName, setClientName]           = useState(initial?.client_name ?? '');
  const [clientEmail, setClientEmail]         = useState(initial?.client_email ?? '');
  const [clientCompany, setClientCompany]     = useState(initial?.client_company ?? '');
  const [clientAddress, setClientAddress]     = useState(initial?.client_address ?? '');
  const [propertyId, setPropertyId] = useState<string | null>(initial?.property_id ?? null);
  const [propertyReference, setPropertyReference] = useState(initial?.property_reference ?? '');
  const [taxRate, setTaxRate]                 = useState<number>(Number(initial?.tax_rate ?? 0));
  const [paymentTerms, setPaymentTerms]       = useState(initial?.payment_terms ?? 'Net 30');
  const [notes, setNotes]                     = useState(initial?.notes ?? '');
  const [internalNotes, setInternalNotes]     = useState(initial?.internal_notes ?? '');
  const [frequency, setFrequency]             = useState<RecurringFrequency>(initial?.frequency ?? 'monthly');
  const [nextRunDate, setNextRunDate]         = useState(initial?.next_run_date ?? firstOfNextMonth());
  const [endDate, setEndDate]                 = useState(initial?.end_date ?? '');
  const [onGenerate, setOnGenerate]           = useState<RecurringOnGenerate>(initial?.on_generate ?? 'draft');
  const [dueDays, setDueDays]                 = useState<number>(initial?.due_days ?? 30);
  const [active, setActive]                   = useState(initial?.active ?? true);

  const [items, setItems] = useState<DraftLine[]>(
    initial?.line_items && initial.line_items.length > 0
      ? initial.line_items.map(li => ({
          description: li.description,
          quantity: Number(li.quantity),
          rate: Number(li.rate),
          amount: Number(li.amount),
        }))
      : [{ ...DEFAULT_LINE }],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const totals = useMemo(() => calculateTotals(items, taxRate), [items, taxRate]);

  function updateItem(i: number, patch: Partial<DraftLine>) {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== i) return it;
      const next = { ...it, ...patch };
      next.amount = lineAmount(next);
      return next;
    }));
  }
  function addItem()          { setItems(prev => [...prev, { ...DEFAULT_LINE }]); }
  function removeItem(i: number) {
    setItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  }

  async function handleSave() {
    setError(null);
    if (!name.trim())        return setError('Template name is required');
    if (!clientName.trim())  return setError('Client name is required');
    if (!clientEmail.trim()) return setError('Client email is required');
    if (items.every(it => !it.description.trim() && it.amount === 0)) {
      return setError('Add at least one line item with a description and amount');
    }

    setSaving(true);
    try {
      // Upsert the client by email so they show up in the typeahead for
      // future invoices/templates. Best-effort — failures don't block
      // the template save (the snapshot columns still hold the data).
      let resolvedClientId: string | null = clientId;
      if (!resolvedClientId && clientEmail.trim()) {
        try {
          const cRes = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: clientName.trim(),
              email: clientEmail.trim().toLowerCase(),
              company: clientCompany?.trim() || null,
              address: clientAddress?.trim() || null,
              property_reference: propertyReference?.trim() || null,
            }),
          });
          const cBody = await cRes.json();
          if (cRes.ok && cBody.id) resolvedClientId = cBody.id;
        } catch { /* non-fatal */ }
      }

      const url = mode === 'edit' ? `/api/recurring/${initial!.id}` : '/api/recurring';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          client_id: resolvedClientId,
          client_name: clientName.trim(),
          client_email: clientEmail.trim().toLowerCase(),
          client_company: clientCompany.trim() || null,
          client_address: clientAddress.trim() || null,
          property_id: propertyId,
          property_reference: propertyReference.trim() || null,
          tax_rate: taxRate,
          payment_terms: paymentTerms.trim() || null,
          notes: notes.trim() || null,
          internal_notes: internalNotes.trim() || null,
          frequency,
          next_run_date: nextRunDate,
          end_date: endDate || null,
          on_generate: onGenerate,
          due_days: dueDays,
          active,
          line_items: items
            .filter(it => it.description.trim() || it.amount > 0)
            .map((it, idx) => ({
              description: it.description.trim(),
              quantity: Number(it.quantity),
              rate: Number(it.rate),
              amount: Number(it.amount),
              sort_order: idx,
            })),
        }),
      });
      const body = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
      }
      pushPendingToast({
        entity: 'recurring',
        mode,
        name: name.trim(),
        id: (body as { id?: string }).id,
      });
      router.push(withBust('/billing/recurring'));
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm('Delete this template? Already-generated invoices are unaffected.')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/recurring/${initial.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      pushPendingToast({
        entity: 'recurring',
        mode: 'delete',
        name: initial.name ?? 'template',
        id: initial.id,
      });
      router.push(withBust('/billing/recurring'));
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function togglePause() {
    if (!initial?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/recurring/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      setActive(!active);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Fire the next occurrence right now instead of waiting for the
   * 9:15 AM Central cron. The /api/recurring/[id]/generate route runs
   * the same logic the cron runs — issue_date is today, the template's
   * next_run_date advances by one cycle so we don't bill twice for the
   * same period. If the template is set to auto-send, the email goes
   * out as part of this call. On success we redirect straight to the
   * new invoice so the operator can review it (or see it already sent).
   */
  async function handleGenerateNow() {
    if (!initial?.id) return;
    const willAutoSend = onGenerate === 'send_immediately';
    const confirmMsg = willAutoSend
      ? `Generate AND send an invoice to ${clientEmail} right now? The template's next run date advances by one cycle.`
      : `Generate a draft invoice from this template right now? It'll appear in /billing/invoices for you to review and send. The template's next run date advances by one cycle.`;
    if (!confirm(confirmMsg)) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/recurring/${initial.id}/generate`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Failed (${res.status})`);
      // Surface the auto-send failure (if any) to the operator before we
      // navigate — they'd want to know the email didn't go out.
      if (body.send_error) {
        setError(`Invoice ${body.invoice_number} created, but email failed: ${body.send_error}. Resend from the invoice detail page.`);
        setSaving(false);
        router.push(`/billing/invoices/${body.invoice_id}`);
        return;
      }
      router.push(`/billing/invoices/${body.invoice_id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing/recurring" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to recurring
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary">
              {mode === 'edit' ? 'Edit recurring template' : 'New recurring template'}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {mode === 'edit' && (
              <>
                <button
                  type="button"
                  onClick={handleGenerateNow}
                  disabled={saving || !active}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-body-sm font-semibold text-primary hover:bg-gold-light disabled:opacity-50"
                  title={active ? 'Generate the next occurrence right now instead of waiting for the cron' : 'Resume the template first'}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Generate now
                </button>
                <button
                  type="button"
                  onClick={togglePause}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary disabled:opacity-50"
                >
                  {active ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Resume</>}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-body-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash className="h-4 w-4" /> Delete
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {mode === 'edit' ? 'Save changes' : 'Create template'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-body-sm text-red-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: client + schedule */}
          <div className="lg:col-span-1 space-y-4">
            <section className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-heading text-body font-bold text-primary mb-3 flex items-center gap-2">
                <Repeat className="h-4 w-4 text-gold-dark" /> Template
              </h2>
              <Field label="Internal name">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Galleria PM monthly fee"
                  className={inputCls}
                />
              </Field>
            </section>

            <section className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-heading text-body font-bold text-primary mb-3">Client</h2>
              <div className="space-y-3">
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
                  }}
                  onClear={() => setClientId(null)}
                />
                <Field label="Name">
                  <input type="text" value={clientName} onChange={e => { setClientName(e.target.value); setClientId(null); }} className={inputCls} />
                </Field>
                <Field label="Email">
                  <input type="email" value={clientEmail} onChange={e => { setClientEmail(e.target.value); setClientId(null); }} className={inputCls} />
                </Field>
                <Field label="Company">
                  <input type="text" value={clientCompany ?? ''} onChange={e => setClientCompany(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Address">
                  <textarea value={clientAddress ?? ''} onChange={e => setClientAddress(e.target.value)} rows={3} className={inputCls} />
                </Field>
                {/* Property tagging — picker is primary, free-form
                    text shown only when no property is selected. When
                    set, every generated invoice inherits this property
                    so the property's P&L correctly includes the
                    recurring revenue. */}
                <PropertyPicker
                  selectedId={propertyId}
                  onPick={(p) => {
                    setPropertyId(p.id);
                    setPropertyReference(p.name);
                  }}
                  onClear={() => setPropertyId(null)}
                />
                {!propertyId && (
                  <Field label="Property reference (free-form)">
                    <input type="text" value={propertyReference ?? ''} onChange={e => setPropertyReference(e.target.value)} placeholder="optional one-off note" className={inputCls} />
                  </Field>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-heading text-body font-bold text-primary mb-3">Schedule</h2>
              <div className="space-y-3">
                <Field label="Frequency">
                  <select value={frequency} onChange={e => setFrequency(e.target.value as RecurringFrequency)} className={inputCls}>
                    {(Object.entries(FREQUENCY_LABELS) as [RecurringFrequency, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Next run date">
                  <input type="date" value={nextRunDate} onChange={e => setNextRunDate(e.target.value)} className={inputCls} />
                </Field>
                <Field label="End date (optional)">
                  <input type="date" value={endDate ?? ''} onChange={e => setEndDate(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Due in N days from issue">
                  <input type="number" min="0" max="365" value={dueDays} onChange={e => setDueDays(Number(e.target.value))} className={inputCls} />
                </Field>
                <Field label="On generation">
                  <select value={onGenerate} onChange={e => setOnGenerate(e.target.value as RecurringOnGenerate)} className={inputCls}>
                    {(Object.entries(ON_GENERATE_LABELS) as [RecurringOnGenerate, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-body-sm text-primary">
                  <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4 rounded border-border" />
                  Active — generate on schedule
                </label>
              </div>
            </section>
          </div>

          {/* Right: line items + totals */}
          <div className="lg:col-span-2 space-y-4">
            <section className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-body font-bold text-primary">Line items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-caption text-primary hover:border-primary"
                >
                  <Plus className="h-3.5 w-3.5" /> Add line
                </button>
              </div>
              <div className="space-y-4 sm:space-y-3">
                {items.map((it, i) => (
                  /*
                    Mobile: stack as Description (full), then [Qty / Rate / Amount / Delete] in a row of small fields.
                    sm+:   compact 12-col grid like before.
                  */
                  <div key={i} className="rounded-md border border-border/60 p-3 sm:p-0 sm:border-0 sm:rounded-none sm:grid sm:grid-cols-12 sm:gap-2 sm:items-start">
                    {/* Description */}
                    <div className="sm:col-span-6 mb-2 sm:mb-0">
                      <input
                        type="text"
                        value={it.description}
                        onChange={e => updateItem(i, { description: e.target.value })}
                        placeholder="Description"
                        className={inputCls}
                      />
                    </div>
                    {/* Row of small fields — labels visible on mobile only */}
                    <div className="sm:contents grid grid-cols-12 gap-2 items-end">
                      <label className="col-span-3 sm:col-span-2 block">
                        <span className="block text-caption text-foreground-muted mb-0.5 sm:hidden">Qty</span>
                        <input
                          type="number"
                          step="0.01"
                          value={it.quantity}
                          onChange={e => updateItem(i, { quantity: Number(e.target.value) })}
                          placeholder="Qty"
                          className={inputCls + ' text-right'}
                          aria-label="Quantity"
                        />
                      </label>
                      <label className="col-span-4 sm:col-span-2 block">
                        <span className="block text-caption text-foreground-muted mb-0.5 sm:hidden">Rate</span>
                        <input
                          type="number"
                          step="0.01"
                          value={it.rate}
                          onChange={e => updateItem(i, { rate: Number(e.target.value) })}
                          placeholder="Rate"
                          className={inputCls + ' text-right'}
                          aria-label="Rate"
                        />
                      </label>
                      <div className="col-span-3 sm:col-span-1 sm:self-center text-right">
                        <span className="block text-caption text-foreground-muted mb-0.5 sm:hidden">Amount</span>
                        <span className="font-mono text-body-sm text-primary">{formatMoney(it.amount)}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1 sm:self-center text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                          disabled={items.length === 1}
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-border pt-4 space-y-2 text-body-sm">
                <div className="flex items-center justify-between text-foreground-muted">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatMoney(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-foreground-muted gap-3">
                  <label className="flex items-center gap-2">
                    Tax rate
                    <input
                      type="number"
                      step="0.0025"
                      value={taxRate}
                      onChange={e => setTaxRate(Number(e.target.value))}
                      className="w-24 rounded-md border border-border px-2 py-1 text-right"
                    />
                    <span>({(taxRate * 100).toFixed(2)}%)</span>
                  </label>
                  <span className="font-mono">{formatMoney(totals.tax_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-primary font-bold text-body pt-1">
                  <span>Each invoice total</span>
                  <span className="font-mono">{formatMoney(totals.total)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-heading text-body font-bold text-primary mb-3">Invoice details</h2>
              <div className="space-y-3">
                <Field label="Payment terms">
                  <input type="text" value={paymentTerms ?? ''} onChange={e => setPaymentTerms(e.target.value)} placeholder="Net 30" className={inputCls} />
                </Field>
                <Field label="Notes shown on the invoice">
                  <textarea value={notes ?? ''} onChange={e => setNotes(e.target.value)} rows={3} className={inputCls} />
                </Field>
                <Field label="Internal notes (never shown to client)">
                  <textarea value={internalNotes ?? ''} onChange={e => setInternalNotes(e.target.value)} rows={2} className={inputCls} />
                </Field>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
