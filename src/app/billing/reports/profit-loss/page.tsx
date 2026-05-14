'use client';

/**
 * /billing/reports/profit-loss — P&L report on a cash basis.
 *
 * Revenue is paid invoices in the period; expenses are recorded by
 * expense_date. Includes a date-range picker (Year-to-date, Last year,
 * Trailing 12 months, Custom), a monthly revenue/expense chart, and a
 * categorised expense breakdown table. CSV export hands a clean
 * year-end summary to the CPA in one click.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertTriangle, ArrowLeft, Download, BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney, type Invoice } from '@/lib/invoices';
import { categoryStyle, type Expense } from '@/lib/expenses';
import {
  computePl, currentYearRange, trailing12MonthsRange, sortCategoriesByAmount, csvCell,
  type PlDateRange,
} from '@/lib/billing-reports';

type Preset = 'ytd' | 'last_year' | 'trailing_12' | 'custom';

function lastYearRange(now: Date = new Date()): PlDateRange {
  const y = now.getUTCFullYear() - 1;
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

export default function ProfitLossPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [preset, setPreset] = useState<Preset>('ytd');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [iR, eR] = await Promise.all([
        supabase.from('invoices').select('*').eq('status', 'paid').order('paid_at', { ascending: false }),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      ]);
      if (cancelled) return;
      if (iR.error) setError(iR.error.message);
      if (eR.error) setError(eR.error.message);
      setInvoices((iR.data ?? []) as Invoice[]);
      setExpenses((eR.data ?? []) as Expense[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const range: PlDateRange = useMemo(() => {
    switch (preset) {
      case 'ytd':          return currentYearRange();
      case 'last_year':    return lastYearRange();
      case 'trailing_12':  return trailing12MonthsRange();
      case 'custom':
        return {
          start: customStart || currentYearRange().start,
          end: customEnd || currentYearRange().end,
        };
    }
  }, [preset, customStart, customEnd]);

  const pl = useMemo(
    () => computePl(invoices ?? [], expenses ?? [], range),
    [invoices, expenses, range],
  );

  const sortedCategories = useMemo(
    () => sortCategoriesByAmount(pl.expenses_by_category),
    [pl.expenses_by_category],
  );

  function downloadCsv() {
    // Every cell goes through csvCell() to (a) RFC-4180-quote where needed
    // and (b) neutralize spreadsheet formula injection from category names
    // or labels that might start with =, +, -, @ or a tab.
    const row = (...cells: (string | number | null | undefined)[]) =>
      cells.map(csvCell).join(',');
    const lines: string[] = [];
    lines.push(row('Profit & Loss', `${range.start} to ${range.end}`));
    lines.push('');
    lines.push(row('Revenue'));
    for (const [m, amt] of Object.entries(pl.revenue_by_month).sort()) {
      lines.push(row(m, amt.toFixed(2)));
    }
    lines.push(row('Total revenue', pl.revenue.toFixed(2)));
    lines.push('');
    lines.push(row('Expenses'));
    lines.push(row('Category', 'Total'));
    for (const c of sortedCategories) {
      lines.push(row(c.category, c.total.toFixed(2)));
    }
    lines.push(row('Total expenses', pl.expenses_total.toFixed(2)));
    lines.push('');
    lines.push(row('Net income', pl.net_income.toFixed(2)));
    const csv = lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${range.start}-to-${range.end}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const loading = invoices === null || expenses === null;
  const margin = pl.revenue > 0 ? (pl.net_income / pl.revenue) * 100 : 0;

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary">Profit & Loss</h1>
            <p className="text-caption text-foreground-muted">Cash-basis P&L with expense breakdown.</p>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        {/* Range picker */}
        <section className="rounded-xl border border-border bg-white p-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-body-sm">
            {([
              ['ytd',         'YTD'],
              ['trailing_12', 'Trailing 12mo'],
              ['last_year',   'Last year'],
              ['custom',      'Custom'],
            ] as [Preset, string][]).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPreset(k)}
                className={`px-4 py-2 ${preset === k ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-background-cream/60'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2 text-body-sm">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="rounded-md border border-border px-2 py-1.5"
              />
              <span className="text-foreground-muted">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="rounded-md border border-border px-2 py-1.5"
              />
            </div>
          )}
          <span className="text-caption text-foreground-muted ml-auto">
            {range.start} → {range.end}
          </span>
        </section>

        {loading ? (
          <div className="py-20 text-center text-foreground-muted">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold mb-2" />
            Loading…
          </div>
        ) : (
          <>
            {/* Top tiles */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Revenue</p>
                <p className="font-heading text-display-sm font-bold text-green-700 mt-1">{formatMoney(pl.revenue)}</p>
                <p className="text-caption text-foreground-muted mt-1">
                  {pl.invoice_count} paid invoice{pl.invoice_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Expenses</p>
                <p className="font-heading text-display-sm font-bold text-slate-700 mt-1">{formatMoney(pl.expenses_total)}</p>
                <p className="text-caption text-foreground-muted mt-1">
                  {pl.expense_count} expense{pl.expense_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Net income</p>
                <p className={`font-heading text-display-sm font-bold mt-1 ${pl.net_income >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {formatMoney(pl.net_income)}
                </p>
                <p className="text-caption text-foreground-muted mt-1">
                  {pl.revenue > 0 ? `${margin.toFixed(1)}% margin` : '—'}
                </p>
              </div>
            </section>

            {/* Revenue by month bar chart */}
            <section className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-heading text-body font-bold text-primary mb-1 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gold-dark" /> Revenue vs expenses by month
              </h2>
              <p className="text-caption text-foreground-muted mb-4">{range.start} to {range.end}</p>
              <PlChart range={range} pl={pl} />
            </section>

            {/* Expense category breakdown */}
            <section className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-heading text-body font-bold text-primary">Expenses by category</h2>
              </div>
              {sortedCategories.length === 0 ? (
                <div className="p-12 text-center text-foreground-muted text-body-sm">
                  No expenses in this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-body-sm min-w-[640px]">
                  <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Category</th>
                      <th className="px-5 py-3 text-right font-medium">Total</th>
                      <th className="px-5 py-3 text-right font-medium">% of expenses</th>
                      <th className="px-5 py-3 font-medium" style={{ width: '40%' }}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedCategories.map(c => {
                      const pct = pl.expenses_total > 0 ? (c.total / pl.expenses_total) * 100 : 0;
                      return (
                        <tr key={c.category} className="hover:bg-background-cream/40">
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-medium border ${categoryStyle(c.category)}`}>
                              {c.category}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-primary">
                            {formatMoney(c.total)}
                          </td>
                          <td className="px-5 py-3 text-right text-foreground-muted">
                            {pct.toFixed(1)}%
                          </td>
                          <td className="px-5 py-3">
                            <div className="h-1.5 rounded-full bg-background-cream overflow-hidden">
                              <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold border-t-2 border-primary bg-background-cream/30">
                      <td className="px-5 py-3 text-primary">Total expenses</td>
                      <td className="px-5 py-3 text-right font-mono text-primary">{formatMoney(pl.expenses_total)}</td>
                      <td className="px-5 py-3"></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function PlChart({
  range, pl,
}: {
  range: PlDateRange;
  pl: ReturnType<typeof computePl>;
}) {
  // Build the list of months in the range
  const months: string[] = [];
  const [sy, sm] = range.start.split('-').map(Number);
  const [ey, em] = range.end.split('-').map(Number);
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }

  const data = months.map(mk => ({
    m: mk,
    revenue: pl.revenue_by_month[mk] ?? 0,
    expenses: Object.values(pl.expenses_by_month_category[mk] ?? {}).reduce((a, b) => a + b, 0),
  }));
  const max = Math.max(1, ...data.map(d => Math.max(d.revenue, d.expenses)));

  // 24px min bar width per month so a YTD or trailing-12 view stays
  // readable on narrow screens — wider ranges scroll horizontally.
  const minWidth = Math.max(0, months.length * 32);

  return (
    <div>
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex items-end justify-between gap-1 h-40 sm:h-48" style={{ minWidth: `${minWidth}px` }}>
          {data.map(d => {
            const rH = (d.revenue / max) * 100;
            const eH = (d.expenses / max) * 100;
            const label = new Date(d.m + '-01T00:00:00Z')
              .toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
            return (
              <div key={d.m} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.m}: ${formatMoney(d.revenue)} rev / ${formatMoney(d.expenses)} exp`}>
                <div className="w-full flex items-end justify-center gap-0.5 h-32 sm:h-40">
                  <div className="w-1/2 bg-green-500/80 rounded-t" style={{ height: `${rH}%`, minHeight: d.revenue > 0 ? '2px' : '0' }} />
                  <div className="w-1/2 bg-slate-300 rounded-t" style={{ height: `${eH}%`, minHeight: d.expenses > 0 ? '2px' : '0' }} />
                </div>
                <span className="text-caption text-foreground-muted">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-foreground-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-green-500/80" /> Revenue</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-300" /> Expenses</span>
      </div>
    </div>
  );
}
