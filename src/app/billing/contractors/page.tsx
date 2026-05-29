'use client';

/**
 * /billing/contractors — list of 1099 contractors.
 *
 * Anyone you pay $600+/year as a contractor needs a 1099-NEC. The
 * contractors table is the canonical record; the expense form links to it.
 * The list view shows YTD totals so you can see who's approaching the
 * threshold and needs a W-9 on file.
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertTriangle, Plus, FileBadge, ArrowLeft, CheckCircle2, PauseCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney, type Contractor, type Expense } from '@/lib/expenses';
import { useToast } from '@/components/billing/Toast';
import {
  consumePendingToast, describePendingToast, usePostSaveBust,
} from '@/lib/post-save-feedback';

interface ContractorWithYtd extends Contractor {
  ytd_paid: number;
  ytd_expense_count: number;
}

// useSearchParams requires Suspense during prerender.
export default function ContractorsListPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </main>
    }>
      <ContractorsListPageInner />
    </Suspense>
  );
}

function ContractorsListPageInner() {
  const [contractors, setContractors] = useState<ContractorWithYtd[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bust = usePostSaveBust();
  const toast = useToast();

  useEffect(() => {
    const payload = consumePendingToast();
    if (payload?.entity === 'contractor') {
      toast.show({ message: describePendingToast(payload) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const yearStart = new Date().getUTCFullYear() + '-01-01';

      const [{ data: rows, error: e1 }, { data: exps }] = await Promise.all([
        supabase.from('contractors').select('*').order('legal_name'),
        supabase.from('expenses')
          .select('contractor_id, amount, expense_date, is_1099_eligible')
          .gte('expense_date', yearStart)
          .eq('is_1099_eligible', true),
      ]);
      if (cancelled) return;
      if (e1) {
        setError(e1.message.includes('does not exist')
          ? 'Contractors table missing — run migration 0017.'
          : e1.message);
        setContractors([]);
        return;
      }

      const ytdByContractor: Record<string, { total: number; count: number }> = {};
      for (const e of (exps ?? []) as Pick<Expense, 'contractor_id' | 'amount'>[]) {
        if (!e.contractor_id) continue;
        const row = (ytdByContractor[e.contractor_id] ??= { total: 0, count: 0 });
        row.total += Number(e.amount);
        row.count++;
      }

      const enriched: ContractorWithYtd[] = (rows ?? []).map(c => ({
        ...(c as Contractor),
        ytd_paid: ytdByContractor[c.id]?.total ?? 0,
        ytd_expense_count: ytdByContractor[c.id]?.count ?? 0,
      }));
      setContractors(enriched);
    })();
    return () => { cancelled = true; };
    // bust forces re-fetch after a ContractorForm save.
  }, [bust]);

  const summary = useMemo(() => {
    if (!contractors) return { activeCount: 0, totalYtd: 0, overThreshold: 0 };
    let active = 0, total = 0, over = 0;
    for (const c of contractors) {
      if (c.active) active++;
      total += c.ytd_paid;
      if (c.ytd_paid >= 600) over++;
    }
    return { activeCount: active, totalYtd: total, overThreshold: over };
  }, [contractors]);

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary">Contractors</h1>
            <p className="text-caption text-foreground-muted">1099-NEC payee records. Add a contractor before tagging expenses to them.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/billing/reports/1099"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary"
            >
              <FileBadge className="h-4 w-4" /> 1099 export
            </Link>
            <Link
              href="/billing/contractors/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> New contractor
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        {contractors === null ? (
          <div className="py-20 text-center text-foreground-muted">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold mb-2" />
            Loading contractors…
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Active contractors</p>
                <p className="font-heading text-display-sm font-bold text-primary mt-1">{summary.activeCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">YTD 1099 spend</p>
                <p className="font-heading text-display-sm font-bold text-gold-dark mt-1">{formatMoney(summary.totalYtd)}</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Over $600 threshold</p>
                <p className="font-heading text-display-sm font-bold text-primary mt-1">{summary.overThreshold}</p>
                <p className="text-caption text-foreground-muted">need a 1099-NEC this year</p>
              </div>
            </section>

            {contractors.length === 0 ? (
              <section className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
                <FileBadge className="mx-auto h-10 w-10 text-foreground-muted mb-3" />
                <h3 className="font-heading text-body font-bold text-primary mb-1">No contractors yet</h3>
                <p className="text-body-sm text-foreground-muted mb-5">
                  Add a contractor for anyone you pay $600+/year — referral partners, transaction coordinators, marketing freelancers, etc.
                </p>
                <Link
                  href="/billing/contractors/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> Add your first contractor
                </Link>
              </section>
            ) : (
              <section className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-body-sm min-w-[640px]">
                  <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Name</th>
                      <th className="px-5 py-3 text-left font-medium">Tax ID</th>
                      <th className="px-5 py-3 text-right font-medium">YTD paid</th>
                      <th className="px-5 py-3 text-left font-medium">1099 status</th>
                      <th className="px-5 py-3 text-left font-medium">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contractors.map(c => {
                      const over = c.ytd_paid >= 600;
                      const hasTaxId = !!c.tax_id;
                      const ready = over && hasTaxId;
                      return (
                        <tr key={c.id} className="hover:bg-background-cream/40">
                          <td className="px-5 py-3">
                            <Link
                              href={`/billing/contractors/${c.id}`}
                              className="font-semibold text-primary hover:text-gold-dark"
                            >
                              {c.display_name ?? c.legal_name}
                            </Link>
                            {c.display_name && c.display_name !== c.legal_name && (
                              <div className="text-caption text-foreground-muted">{c.legal_name}</div>
                            )}
                            {c.email && <div className="text-caption text-foreground-muted">{c.email}</div>}
                          </td>
                          <td className="px-5 py-3">
                            {c.tax_id ? (
                              <span className="font-mono text-primary">
                                {c.tax_id_type === 'SSN' ? '***-**-' + c.tax_id.slice(-4) : c.tax_id}
                              </span>
                            ) : (
                              <span className="text-caption text-amber-700 italic">missing — request W-9</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-primary">
                            {formatMoney(c.ytd_paid)}
                            <div className="text-caption text-foreground-muted font-normal">
                              {c.ytd_expense_count} expense{c.ytd_expense_count !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {over ? (
                              ready ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold border bg-green-50 text-green-800 border-green-200">
                                  <CheckCircle2 className="h-3 w-3" /> Ready to file
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold border bg-amber-50 text-amber-900 border-amber-200">
                                  Needs W-9
                                </span>
                              )
                            ) : (
                              <span className="text-caption text-foreground-muted">below $600</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {c.active ? (
                              <span className="inline-flex items-center gap-1 text-caption text-green-800">
                                <CheckCircle2 className="h-3 w-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-caption text-foreground-muted">
                                <PauseCircle className="h-3 w-3" /> Inactive
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
