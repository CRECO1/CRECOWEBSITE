'use client';

/**
 * /admin/invoices/new — create a new invoice.
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

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  calculateTotals, formatMoney, lineAmount, nextInvoiceNumber,
  type InvoiceLineItem,
} from '@/lib/invoices';

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

export default function NewInvoicePage() {
  const router = useRouter();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_TERMS);
  const [propertyReference, setPropertyReference] = useState('');
  const [taxRate, setTaxRate] = useState(0);             // store as decimal (0.0825 = 8.25%)
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [stripeLink, setStripeLink] = useState('');
  const [items, setItems] = useState<(typeof DEFAULT_LINE)[]>([{ ...DEFAULT_LINE }]);
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

  const totals = useMemo(() => calculateTotals(items, taxRate), [items, taxRate]);

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

    const { data: created, error: insertErr } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
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
        property_reference: propertyReference.trim() || null,
        notes: notes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        stripe_payment_link_url: stripeLink.trim() || null,
        payment_terms: paymentTerms.trim() || DEFAULT_TERMS,
      }])
      .select()
      .single();

    if (insertErr || !created) {
      setSaving(false);
      setError(insertErr?.message ?? 'Could not save invoice.');
      return;
    }

    // Insert line items (filter blanks)
    const lineRows = items
      .filter(it => it.description.trim())
      .map((it, sort_order) => ({
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
        router.push(`/admin/invoices/${created.id}`);
        return;
      }
    }

    router.push(`/admin/invoices/${created.id}`);
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin/invoices" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
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
              <Field label="Client name *">
                <input className={inputCls} value={clientName} onChange={e => setClientName(e.target.value)} required />
              </Field>
              <Field label="Email *">
                <input className={inputCls} type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} required />
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
              <Field label="Property reference">
                <input className={inputCls} value={propertyReference} onChange={e => setPropertyReference(e.target.value)} placeholder='Optional — e.g. "8000 Fair Oaks Pkwy"' />
              </Field>
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
          </section>
        </div>
      </div>
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
