'use client';

/**
 * /billing/reports/1099 — year-end 1099 contractor export.
 *
 * Rolls up every 1099-eligible expense by contractor for the selected year.
 * Contractors over $600 are flagged "needs 1099". Export the table as CSV
 * to hand to your CPA — or use it as the source for filing through a
 * service like Track1099 or Tax1099.
 *
 * The threshold is hard-coded to $600 (the IRS 2026 floor). If that changes,
 * pass a different `threshold` to compute1099().
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertTriangle, ArrowLeft, Download, FileBadge, CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney, type Expense, type Contractor } from '@/lib/expenses';
import { compute1099, build1099Csv } from '@/lib/billing-reports';

export default function NineteenNinetyNinePage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [contractors, setContractors] = useState<Contractor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const thisYear = new Date().getUTCFullYear();
  const [year, setYear] = useState<number>(thisYear);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: exps, error: e1 }, { data: cts, error: e2 }] = await Promise.all([
        supabase.from('expenses').select('*').eq('is_1099_eligible', true),
        supabase.from('contractors').select('*'),
      ]);
      if (cancelled) return;
      if (e1 || e2) setError((e1 ?? e2)!.message);
      setExpenses((exps ?? []) as Expense[]);
      setContractors((cts ?? []) as Contractor[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(
    () => compute1099(expenses ?? [], contractors ?? [], year),
    [expenses, contractors, year],
  );

  const summary = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.total_paid, 0);
    const filing = rows.filter(r => r.meets_threshold);
    const missingTaxId = filing.filter(r => !r.tax_id);
    return { total, contractorCount: rows.length, filingCount: filing.length, missingTaxId: missingTaxId.length };
  }, [rows]);

  function downloadCsv() {
    const csv = build1099Csv(rows, year);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1099-export-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const loading = expenses === null || contractors === null;

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <FileBadge className="h-5 w-5 text-gold" /> 1099 Export
            </h1>
            <p className="text-caption text-foreground-muted">
              Year-end contractor totals for 1099-NEC filing. Threshold: $600.
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
              disabled={loading || rows.length === 0}
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

        {loading ? (
          <div className="py-20 text-center text-foreground-muted">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold mb-2" />
            Loading 1099 data…
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Tile label={`${year} 1099 spend`} value={formatMoney(summary.total)} tone="gold" />
              <Tile label="Contractors paid" value={String(summary.contractorCount)} tone="slate" />
              <Tile label="Need a 1099" value={String(summary.filingCount)} tone={summary.filingCount > 0 ? 'green' : 'slate'} sublabel={`over $600 in ${year}`} />
              <Tile label="Missing tax ID" value={String(summary.missingTaxId)} tone={summary.missingTaxId > 0 ? 'red' : 'slate'} sublabel={summary.missingTaxId > 0 ? 'request W-9 ASAP' : undefined} />
            </section>

            {/* Filing checklist */}
            {summary.filingCount > 0 && (
              <section className="rounded-xl border border-border bg-white p-5">
                <h2 className="font-heading text-body font-bold text-primary mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold-dark" /> Filing checklist for {year}
                </h2>
                <ul className="text-body-sm text-foreground-muted space-y-1.5 leading-relaxed">
                  <li>1. Verify every contractor over $600 has a signed W-9 on file (TIN + legal name + address).</li>
                  <li>2. File 1099-NEC by <strong>January 31, {year + 1}</strong> for the prior tax year — both to the IRS and to the recipient.</li>
                  <li>3. Use a filing service (Track1099, Tax1099, QBO) or your CPA — paper filing is allowed but tedious past 10 forms.</li>
                  <li>4. Keep a copy of each filed 1099 — IRS retention is 4 years minimum.</li>
                </ul>
              </section>
            )}

            {/* Detail table */}
            <section className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-heading text-body font-bold text-primary">Contractor totals for {year}</h2>
              </div>
              {rows.length === 0 ? (
                <div className="p-12 text-center text-foreground-muted text-body-sm">
                  No 1099-eligible expenses in {year}. Mark contractor expenses as 1099-eligible on the expense form to populate this report.
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-body-sm min-w-[640px]">
                  <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Contractor</th>
                      <th className="px-5 py-3 text-left font-medium">Tax ID</th>
                      <th className="px-5 py-3 text-right font-medium">Total paid {year}</th>
                      <th className="px-5 py-3 text-right font-medium">Expenses</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map(r => (
                      <tr key={r.contractor_id} className="hover:bg-background-cream/40">
                        <td className="px-5 py-3">
                          <Link
                            href={`/billing/contractors/${r.contractor_id}`}
                            className="font-semibold text-primary hover:text-gold-dark"
                          >
                            {r.display_name ?? r.legal_name}
                          </Link>
                          {r.display_name && r.display_name !== r.legal_name && (
                            <div className="text-caption text-foreground-muted">{r.legal_name}</div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono">
                          {r.tax_id ? (
                            <span className="text-primary">{r.tax_id}</span>
                          ) : (
                            <span className="text-amber-700 italic font-sans">missing</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-primary">
                          {formatMoney(r.total_paid)}
                        </td>
                        <td className="px-5 py-3 text-right text-foreground-muted">
                          {r.expense_count}
                        </td>
                        <td className="px-5 py-3">
                          {r.meets_threshold ? (
                            r.tax_id ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold border bg-green-50 text-green-800 border-green-200">
                                <CheckCircle2 className="h-3 w-3" /> Ready to file
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold border bg-amber-50 text-amber-900 border-amber-200">
                                Needs W-9
                              </span>
                            )
                          ) : (
                            <span className="text-caption text-foreground-muted">below $600 threshold</span>
                          )}
                        </td>
                      </tr>
                    ))}
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

function Tile({
  label, value, tone, sublabel,
}: {
  label: string;
  value: string;
  tone: 'gold' | 'green' | 'red' | 'slate';
  sublabel?: string;
}) {
  const cls = tone === 'red' ? 'text-red-600'
    : tone === 'green' ? 'text-green-700'
    : tone === 'gold' ? 'text-gold-dark'
    : 'text-primary';
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-caption uppercase tracking-widest text-foreground-muted">{label}</p>
      <p className={`font-heading text-heading-sm font-bold mt-1 ${cls}`}>{value}</p>
      {sublabel && <p className="text-caption text-foreground-muted mt-0.5">{sublabel}</p>}
    </div>
  );
}
