'use client';

/**
 * /billing/properties/[id] — property detail with full P&L drill-down.
 *
 * Three sections:
 *   1. Header — name, address, status pill, Edit button
 *   2. P&L summary — revenue (paid invoices), expenses, net. Color-coded
 *      so positive net reads green, negative red.
 *   3. Activity tabs — Invoices attached to this property, Expenses
 *      attached. Each row clickable through to the source record.
 *
 * Soft-deleted rows on invoices/expenses are excluded from the P&L by
 * default. The operator can toggle them on for forensic lookups.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Building2, AlertTriangle, Receipt, ArrowDownCircle,
  TrendingUp, TrendingDown, DollarSign, Repeat,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  formatPropertyLabel, PROPERTY_STATUS_STYLES, type Property,
} from '@/lib/properties';
import {
  formatMoney, formatDate, effectiveStatus, STATUS_STYLES,
  type Invoice,
} from '@/lib/invoices';
import {
  categoryStyle, type Expense,
} from '@/lib/expenses';
import { FREQUENCY_LABELS, type RecurringFrequency } from '@/lib/recurring-invoices';

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurring, setRecurring] = useState<RecurringRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const [propR, invR, expR, recR] = await Promise.all([
        supabase.from('properties').select('*').eq('id', id).maybeSingle(),
        supabase.from('invoices').select('*').eq('property_id', id).is('deleted_at', null).order('issue_date', { ascending: false }),
        supabase.from('expenses').select('*').eq('property_id', id).is('deleted_at', null).order('expense_date', { ascending: false }),
        supabase.from('recurring_invoice_templates')
          .select('id, name, frequency, next_run_date, end_date, active, client_name')
          .eq('property_id', id)
          .order('active', { ascending: false })
          .order('next_run_date', { ascending: true }),
      ]);
      if (cancelled) return;
      if (propR.error) setError(propR.error.message);
      setProperty((propR.data ?? null) as Property | null);
      setInvoices((invR.data ?? []) as Invoice[]);
      setExpenses((expR.data ?? []) as Expense[]);
      setRecurring((recR.data ?? []) as RecurringRow[]);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // P&L roll-up. Revenue = paid_amount on paid invoices (falls back to
  // total if paid_amount is null). Expenses = sum of expense.amount.
  // Outstanding shown separately — operator can see what's still
  // expected but not yet realized.
  const pnl = useMemo(() => {
    let revenue = 0;
    let outstanding = 0;
    for (const inv of invoices) {
      const eff = effectiveStatus(inv);
      if (eff === 'paid') revenue += Number(inv.paid_amount ?? inv.total);
      else if (eff === 'sent' || eff === 'overdue') outstanding += Number(inv.total);
    }
    const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
    return {
      revenue: round2(revenue),
      outstanding: round2(outstanding),
      expenseTotal: round2(expenseTotal),
      net: round2(revenue - expenseTotal),
    };
  }, [invoices, expenses]);

  if (!property && !error) {
    return <main className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">Loading…</main>;
  }
  if (!property) {
    return (
      <main className="min-h-screen bg-background-cream flex items-center justify-center p-6">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800 max-w-md">
          {error ?? 'Property not found.'}
        </div>
      </main>
    );
  }

  const statusStyle = PROPERTY_STATUS_STYLES[property.status];
  const isDeleted = !!property.deleted_at;

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/billing/properties" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Properties
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary truncate flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gold shrink-0" />
              {property.name}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold border ${statusStyle.className}`}>
                {statusStyle.label}
              </span>
              {isDeleted && (
                <span className="text-caption text-foreground-muted">(deleted)</span>
              )}
            </h1>
          </div>
          <Link
            href={`/billing/properties/${property.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Identity card */}
        <section className="rounded-xl border border-border bg-white p-6">
          <h2 className="font-heading text-body font-bold text-primary mb-3">Identity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-body-sm">
            <Field label="Address">
              {property.address
                ? `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}${property.zip ? ` ${property.zip}` : ''}`
                : '—'}
            </Field>
            <Field label="Type">{property.property_type ?? '—'}</Field>
            <Field label="Status">{statusStyle.label}</Field>
          </div>
          {property.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-caption uppercase tracking-widest text-foreground-muted mb-1">Internal notes</p>
              <p className="text-body-sm text-foreground whitespace-pre-line">{property.notes}</p>
            </div>
          )}
        </section>

        {/* P&L summary */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PnlCard
            label="Revenue (paid)"
            value={formatMoney(pnl.revenue)}
            icon={<TrendingUp className="h-4 w-4 text-green-700" />}
            accent="green"
          />
          <PnlCard
            label="Outstanding"
            value={formatMoney(pnl.outstanding)}
            icon={<DollarSign className="h-4 w-4 text-gold-dark" />}
            accent="gold"
          />
          <PnlCard
            label="Expenses"
            value={formatMoney(pnl.expenseTotal)}
            icon={<TrendingDown className="h-4 w-4 text-red-700" />}
            accent="red"
          />
          <PnlCard
            label="Net"
            value={formatMoney(pnl.net)}
            icon={<DollarSign className="h-4 w-4" />}
            accent={pnl.net >= 0 ? 'green' : 'red'}
            emphasis
          />
        </section>

        {/* Invoices attached */}
        <section className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-heading text-body font-bold text-primary inline-flex items-center gap-2">
              <Receipt className="h-4 w-4 text-gold" /> Invoices
            </h2>
            <p className="text-caption text-foreground-muted">{invoices.length} attached</p>
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-body-sm text-foreground-muted">
              No invoices attached to this property yet. Create an invoice and pick this property from the dropdown.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm min-w-[640px]">
                <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-semibold">Invoice</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Client</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Issued</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map(inv => {
                    const eff = effectiveStatus(inv);
                    const style = STATUS_STYLES[eff];
                    return (
                      <tr key={inv.id} className="hover:bg-background-cream/40">
                        <td className="px-5 py-3">
                          <Link href={`/billing/invoices/${inv.id}`} className="font-mono font-semibold text-primary hover:text-gold-dark">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-primary">{inv.client_name}</td>
                        <td className="px-5 py-3 text-foreground-muted">{formatDate(inv.issue_date)}</td>
                        <td className="px-5 py-3 font-mono text-right text-primary">{formatMoney(inv.total)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold border ${style.className}`}>
                            {style.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recurring templates attached — projected future invoicing */}
        {recurring.length > 0 && (
          <section className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-heading text-body font-bold text-primary inline-flex items-center gap-2">
                <Repeat className="h-4 w-4 text-gold" /> Recurring billing
              </h2>
              <p className="text-caption text-foreground-muted">{recurring.length} template{recurring.length === 1 ? '' : 's'} attached</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm min-w-[640px]">
                <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-semibold">Template</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Client</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Frequency</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Next run</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recurring.map(r => (
                    <tr key={r.id} className={`hover:bg-background-cream/40 ${!r.active ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3">
                        <Link href={`/billing/recurring/${r.id}`} className="text-primary hover:text-gold-dark">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-foreground-muted">{r.client_name}</td>
                      <td className="px-5 py-3 text-foreground-muted">{FREQUENCY_LABELS[r.frequency]}</td>
                      <td className="px-5 py-3 text-foreground-muted">{formatDate(r.next_run_date)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold border ${r.active ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                          {r.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Expenses attached */}
        <section className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-heading text-body font-bold text-primary inline-flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-gold" /> Expenses
            </h2>
            <p className="text-caption text-foreground-muted">{expenses.length} attached</p>
          </div>
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-body-sm text-foreground-muted">
              No expenses attached to this property yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm min-w-[640px]">
                <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-semibold">Date</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Vendor</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Category</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map(e => {
                    const catClass = categoryStyle(e.category);
                    return (
                      <tr key={e.id} className="hover:bg-background-cream/40">
                        <td className="px-5 py-3 text-foreground-muted whitespace-nowrap">{formatDate(e.expense_date)}</td>
                        <td className="px-5 py-3">
                          <Link href={`/billing/expenses/${e.id}`} className="text-primary hover:text-gold-dark">
                            {e.vendor}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold border ${catClass}`}>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-right text-primary">{formatMoney(e.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PnlCard({
  label, value, icon, accent, emphasis,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'green' | 'red' | 'gold';
  emphasis?: boolean;
}) {
  const accentColor =
    accent === 'red' ? 'text-red-700'
    : accent === 'green' ? 'text-green-700'
    : 'text-gold-dark';
  return (
    <div className={`rounded-xl border bg-white p-5 ${emphasis ? 'border-gold ring-2 ring-gold/20' : 'border-border'}`}>
      <p className="text-caption uppercase tracking-widest text-foreground-muted flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className={`mt-2 font-heading text-heading-md font-bold ${accentColor}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption uppercase tracking-widest text-foreground-muted mb-0.5">{label}</p>
      <p className="text-primary capitalize">{children}</p>
    </div>
  );
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Trimmed shape for the recurring-template rollup table on the
 *  property detail page. Distinct from the full RecurringTemplate type
 *  in lib/recurring-invoices.ts since we only need a few columns here. */
interface RecurringRow {
  id: string;
  name: string;
  frequency: RecurringFrequency;
  next_run_date: string;
  end_date: string | null;
  active: boolean;
  client_name: string;
}
