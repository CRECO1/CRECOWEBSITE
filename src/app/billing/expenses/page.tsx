'use client';

/**
 * /billing/expenses — list expenses, filter by category, stats strip.
 *
 * Mirrors the /billing/invoices list visually so the two surfaces feel
 * consistent. Click a row → /billing/expenses/[id] for view/edit.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, ArrowDownCircle, Filter, Plus, ReceiptText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  EXPENSE_CATEGORIES, categoryStyle, formatMoney, formatDate,
  type Expense,
} from '@/lib/expenses';

export default function ExpensesListPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (cancelled) return;
      if (error) {
        setError(
          error.message.includes('does not exist')
            ? 'The expenses table does not exist yet. Run migration 0012_expenses.sql in the Supabase SQL editor.'
            : error.message,
        );
        setExpenses([]);
      } else {
        setExpenses((data ?? []) as Expense[]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => filter === 'all' ? (expenses ?? []) : (expenses ?? []).filter(e => e.category === filter),
    [expenses, filter],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let thisMonth = 0;
    let allTime = 0;
    let reimbursable = 0;
    for (const e of expenses ?? []) {
      allTime += Number(e.amount);
      if (new Date(e.expense_date + 'T12:00:00') >= startOfMonth) {
        thisMonth += Number(e.amount);
      }
      if (e.reimbursable) reimbursable += Number(e.amount);
    }
    return { thisMonth, allTime, reimbursable };
  }, [expenses]);

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Billing
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-gold" /> Expenses
            </h1>
          </div>
          <Link
            href="/billing/expenses/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New expense
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="This month" value={formatMoney(stats.thisMonth)} />
          <StatCard label="All time" value={formatMoney(stats.allTime)} />
          <StatCard label="Reimbursable" value={formatMoney(stats.reimbursable)} accent={stats.reimbursable > 0} />
        </section>

        <section className="flex items-center gap-2 flex-wrap">
          <span className="text-caption uppercase tracking-widest text-foreground-muted mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Category
          </span>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
              filter === 'all' ? 'bg-primary border-primary text-white' : 'bg-white border-border text-foreground-muted hover:border-primary'
            }`}
          >
            All
          </button>
          {EXPENSE_CATEGORIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                filter === c ? 'bg-primary border-primary text-white' : 'bg-white border-border text-foreground-muted hover:border-primary'
              }`}
            >
              {c}
            </button>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-white overflow-hidden">
          {error && (
            <div className="p-6 text-body-sm text-destructive bg-destructive/5 border-b border-destructive/20">
              {error}
            </div>
          )}
          {expenses === null ? (
            <div className="p-12 text-center text-foreground-muted">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <ReceiptText className="mx-auto h-10 w-10 text-foreground-subtle mb-3" />
              <p className="text-body-sm text-foreground-muted">
                {(expenses?.length ?? 0) === 0
                  ? 'No expenses recorded yet.'
                  : 'No expenses match this filter.'}
              </p>
              {(expenses?.length ?? 0) === 0 && !error && (
                <Link
                  href="/billing/expenses/new"
                  className="inline-flex items-center gap-2 mt-5 rounded-lg bg-gold px-5 py-2.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  <Plus className="h-4 w-4" /> Record expense
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-background-cream border-b border-border">
                <tr className="text-left text-caption uppercase tracking-widest text-foreground-muted">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Vendor</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold text-right">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-background-cream/50 transition-colors">
                    <td className="px-5 py-4 text-body-sm text-foreground-muted whitespace-nowrap">{formatDate(e.expense_date)}</td>
                    <td className="px-5 py-4 text-body-sm text-primary">
                      <div className="flex items-center gap-2">
                        <Link href={`/billing/expenses/${e.id}`} className="font-semibold hover:text-gold-dark">
                          {e.vendor}
                        </Link>
                        {e.reimbursable && (
                          <span className="text-caption text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">Reimbursable</span>
                        )}
                      </div>
                      {e.description && <div className="text-caption text-foreground-muted line-clamp-1">{e.description}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold border ${categoryStyle(e.category)}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-body-sm text-foreground-muted">{e.payment_method ?? '—'}</td>
                    <td className="px-5 py-4 text-body-sm font-mono font-semibold text-primary text-right">{formatMoney(e.amount)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/billing/expenses/${e.id}`} className="inline-flex items-center gap-1 text-body-sm text-gold-dark hover:text-gold">
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-caption uppercase tracking-widest text-foreground-muted">{label}</p>
      <p className={`mt-2 font-heading text-display-sm font-bold ${accent ? 'text-amber-700' : 'text-primary'}`}>{value}</p>
    </div>
  );
}
