'use client';

/**
 * /billing/reports/schedule-c — IRS Schedule C tax-ready report.
 *
 * Maps every expense in the selected tax year to its Schedule C line
 * number, pre-totals each line, and exports a CSV the CPA can drop
 * straight into the form (or a pass-through entity equivalent).
 *
 * Revenue is captured from paid invoices and reported on Line 1 (Gross
 * receipts). Net profit/loss on Line 31. The CPA still picks up
 * inventory, depreciation, home office, retirement plans — anything
 * that isn't a straight expense ledger entry.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertTriangle, ArrowLeft, Download, FileBadge, Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney, type Invoice } from '@/lib/invoices';
import { categoryStyle, type Expense } from '@/lib/expenses';
import {
  rollupScheduleC, meals50Deductible,
} from '@/lib/schedule-c';
import { csvCell } from '@/lib/billing-reports';

export default function ScheduleCPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const thisYear = new Date().getUTCFullYear();
  const [year, setYear] = useState<number>(thisYear);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      const [iR, eR] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('status', 'paid')
          .gte('paid_at', yearStart)
          .lt('paid_at', `${year + 1}-01-01`),
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', yearStart)
          .lte('expense_date', yearEnd),
      ]);
      if (cancelled) return;
      if (iR.error) setError(iR.error.message);
      if (eR.error) setError(eR.error.message);
      setInvoices((iR.data ?? []) as Invoice[]);
      setExpenses((eR.data ?? []) as Expense[]);
    })();
    return () => { cancelled = true; };
  }, [year]);

  const revenue = useMemo(() => {
    let total = 0;
    for (const inv of invoices ?? []) {
      total += Number(inv.paid_amount ?? inv.total);
    }
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }, [invoices]);

  const rollup = useMemo(() => rollupScheduleC(expenses ?? []), [expenses]);

  const totalExpenses = useMemo(() => {
    return Math.round((rollup.reduce((s, r) => s + r.total, 0) + Number.EPSILON) * 100) / 100;
  }, [rollup]);

  const meals = useMemo(() => meals50Deductible(rollup), [rollup]);
  // Net using the 50% meals deduction (which is what the IRS actually
  // allows) rather than the full meals amount.
  const adjustedExpenses = useMemo(
    () => Math.round((totalExpenses - meals.meals_full + meals.meals_deductible + Number.EPSILON) * 100) / 100,
    [totalExpenses, meals],
  );
  const netProfit = useMemo(
    () => Math.round((revenue - adjustedExpenses + Number.EPSILON) * 100) / 100,
    [revenue, adjustedExpenses],
  );

  function downloadCsv() {
    const lines: string[] = [];
    const row = (...cells: (string | number | null | undefined)[]) =>
      cells.map(csvCell).join(',');
    lines.push(row(`Schedule C summary for tax year ${year}`));
    lines.push('');
    lines.push(row('Line', 'Label', 'Amount'));
    lines.push(row('1', 'Gross receipts or sales', revenue.toFixed(2)));
    lines.push('');
    lines.push(row('Expenses'));
    for (const r of rollup) {
      if (r.total === 0) continue;
      lines.push(row(r.line.number, r.line.label, r.total.toFixed(2)));
    }
    lines.push(row('', 'Total expenses (as posted)', totalExpenses.toFixed(2)));
    lines.push(row('', 'Less 50% of meals (Line 24b adjustment)', `(${(meals.meals_full - meals.meals_deductible).toFixed(2)})`));
    lines.push(row('', 'Deductible expenses', adjustedExpenses.toFixed(2)));
    lines.push('');
    lines.push(row('31', 'Net profit or (loss)', netProfit.toFixed(2)));
    lines.push('');
    lines.push(row('Category breakdown (for CPA reference)'));
    lines.push(row('Line', 'Category', 'Amount'));
    for (const r of rollup) {
      for (const [cat, amt] of Object.entries(r.by_category).sort((a, b) => b[1] - a[1])) {
        lines.push(row(r.line.number, cat, amt.toFixed(2)));
      }
    }

    const csv = lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-c-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const loading = invoices === null || expenses === null;

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <FileBadge className="h-5 w-5 text-gold" /> Schedule C (Tax-ready summary)
            </h1>
            <p className="text-caption text-foreground-muted">
              Pre-totaled by IRS line. Hand the CSV to your CPA at year-end.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="rounded-lg border border-border bg-white px-3 py-2 text-body-sm text-primary"
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const y = thisYear - i;
                return <option key={y} value={y}>Tax year {y}</option>;
              })}
            </select>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-body-sm text-blue-900 flex items-start gap-3">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Schedule C is for sole proprietors and single-member LLCs filing as pass-through entities.
            If CRECO files as an S-corp or C-corp, your CPA uses a different form (Form 1120-S or 1120)
            but the same expense category breakdown still applies — just hand them this CSV.
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-foreground-muted">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold mb-2" />
            Loading {year} data…
          </div>
        ) : (
          <>
            {/* Top tiles */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Tile label={`${year} gross receipts (Line 1)`} value={formatMoney(revenue)} tone="green" />
              <Tile label="Total deductible expenses" value={formatMoney(adjustedExpenses)} tone="slate" sublabel={meals.meals_full > 0 ? `${formatMoney(meals.meals_full - meals.meals_deductible)} of meals dropped (50% rule)` : undefined} />
              <Tile label="Net profit (Line 31)" value={formatMoney(netProfit)} tone={netProfit >= 0 ? 'green' : 'red'} />
            </section>

            {/* Line table */}
            <section className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-heading text-body font-bold text-primary">Expenses by Schedule C line</h2>
                <p className="text-caption text-foreground-muted">
                  Each line maps a working category in CRECO billing to its IRS line number. 1099-eligible expenses always roll to Line 11.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-body-sm min-w-[640px]">
                  <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium w-16">Line</th>
                      <th className="px-5 py-3 text-left font-medium">Label</th>
                      <th className="px-5 py-3 text-left font-medium">CRECO categories</th>
                      <th className="px-5 py-3 text-right font-medium">Total</th>
                      <th className="px-5 py-3 text-right font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rollup.map(r => {
                      const empty = r.total === 0;
                      return (
                        <tr key={r.line.number} className={empty ? 'text-foreground-muted/60' : 'hover:bg-background-cream/40'}>
                          <td className="px-5 py-3 font-mono font-semibold align-top">{r.line.number}</td>
                          <td className="px-5 py-3 align-top">
                            <div className="text-primary font-medium">{r.line.label}</div>
                            <div className="text-caption text-foreground-muted">{r.line.description}</div>
                          </td>
                          <td className="px-5 py-3 align-top">
                            {Object.keys(r.by_category).length === 0 ? (
                              <span className="text-caption text-foreground-muted">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(r.by_category)
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([cat, amt]) => (
                                    <span
                                      key={cat}
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-medium border ${categoryStyle(cat)}`}
                                      title={formatMoney(amt)}
                                    >
                                      {cat}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-mono align-top">
                            {empty ? '—' : (
                              <span className={r.line.number === '11' ? 'text-gold-dark font-semibold' : 'text-primary font-semibold'}>
                                {formatMoney(r.total)}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-foreground-muted align-top">
                            {empty ? '—' : r.count}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr className="font-bold border-t-2 border-primary bg-background-cream/30">
                      <td className="px-5 py-3" colSpan={2}>
                        <span className="text-primary">Total expenses (Line 28)</span>
                        {meals.meals_full > 0 && (
                          <div className="text-caption font-normal text-foreground-muted">
                            Before 50% meals adjustment
                          </div>
                        )}
                      </td>
                      <td></td>
                      <td className="px-5 py-3 text-right font-mono text-primary">{formatMoney(totalExpenses)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Year-end checklist */}
            <section className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-heading text-body font-bold text-primary mb-3">Year-end CPA handoff checklist</h2>
              <ul className="text-body-sm text-foreground-muted space-y-1.5 leading-relaxed">
                <li>1. Export this CSV and the 1099 export — both go to your CPA together.</li>
                <li>2. Pull a year-end <Link href="/billing/reports/profit-loss" className="text-gold-dark hover:text-gold font-semibold">P&L</Link> in case they want the trailing comparison.</li>
                <li>3. Reconcile any open invoices on the <Link href="/billing/reports/ar-aging" className="text-gold-dark hover:text-gold font-semibold">A/R aging</Link> page — uncollectible past-due should be written off before year-end.</li>
                <li>4. Confirm every 1099-eligible contractor has a signed W-9 on file (<Link href="/billing/contractors" className="text-gold-dark hover:text-gold font-semibold">contractors list</Link>).</li>
                <li>5. Items the CPA still needs to add: depreciation, home office, mileage log, retirement plan contributions, health insurance, vehicle expense (if not using mileage).</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Tile({
  label, value, tone, sublabel,
}: {
  label: string;
  value: string;
  tone: 'green' | 'red' | 'slate';
  sublabel?: string;
}) {
  const cls = tone === 'red' ? 'text-red-600'
    : tone === 'green' ? 'text-green-700'
    : 'text-primary';
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-caption uppercase tracking-widest text-foreground-muted">{label}</p>
      <p className={`font-heading text-display-sm font-bold mt-1 ${cls}`}>{value}</p>
      {sublabel && <p className="text-caption text-foreground-muted mt-1">{sublabel}</p>}
    </div>
  );
}
