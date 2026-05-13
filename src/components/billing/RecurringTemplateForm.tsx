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
} from 'lucide-react';
import {
  calculateTotals, formatMoney, lineAmount, type InvoiceLineItem,
} from '@/lib/invoices';
import {
  FREQUENCY_LABELS, ON_GENERATE_LABELS, type RecurringFrequency,
  type RecurringOnGenerate, type RecurringTemplate, type RecurringLineItem,
} from '@/lib/recurring-invoices';

type DraftLine = Omit<InvoiceLineItem, 'sort_order' | 'invoice_id'>;
const DEFAULT_LINE: DraftLine = { description: '', quantity: 1, rate: 0, amount: 0 };

export interface RecurringTemplateInitial extends Partial<RecurringTemplate> {
  line_items?: RecurringLineItem[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
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
  const [clientName, setClientName]           = useState(initial?.client_name ?? '');
  const [clientEmail, setClientEmail]         = useState(initial?.client_email ?? '');
  const [clientCompany, setClientCompany]     = useState(initial?.client_company ?? '');
  const [clientAddress, setClientAddress]     = useState(initial?.client_address ?? '');
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
      const url = mode === 'edit' ? `/api/recurring/${initial!.id}` : '/api/recurring';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          client_name: clientName.trim(),
          client_email: clientEmail.trim().toLowerCase(),
          client_company: clientCompany.trim() || null,
          client_address: clientAddress.trim() || null,
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      router.push('/billing/recurring');
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
      router.push('/billing/recurring');
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
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <>
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
                <Field label="Name">
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Email">
                  <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Company">
                  <input type="text" value={clientCompany ?? ''} onChange={e => setClientCompany(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Address">
                  <textarea value={clientAddress ?? ''} onChange={e => setClientAddress(e.target.value)} rows={3} className={inputCls} />
                </Field>
                <Field label="Property reference">
                  <input type="text" value={propertyReference ?? ''} onChange={e => setPropertyReference(e.target.value)} placeholder="optional" className={inputCls} />
                </Field>
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
              <div className="space-y-3">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-12 sm:col-span-6">
                      <input
                        type="text"
                        value={it.description}
                        onChange={e => updateItem(i, { description: e.target.value })}
                        placeholder="Description"
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={it.quantity}
                        onChange={e => updateItem(i, { quantity: Number(e.target.value) })}
                        placeholder="Qty"
                        className={inputCls + ' text-right'}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={it.rate}
                        onChange={e => updateItem(i, { rate: Number(e.target.value) })}
                        placeholder="Rate"
                        className={inputCls + ' text-right'}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-1 self-center text-right font-mono text-body-sm text-primary">
                      {formatMoney(it.amount)}
                    </div>
                    <div className="col-span-1 self-center text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-foreground-muted hover:text-red-600"
                        disabled={items.length === 1}
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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

const inputCls = 'w-full rounded-md border border-border bg-white px-3 py-2 text-body-sm text-primary focus:outline-none focus:border-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
