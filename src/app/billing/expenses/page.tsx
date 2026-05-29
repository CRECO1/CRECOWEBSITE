'use client';

/**
 * /billing/expenses — list expenses, filter by category, stats strip.
 *
 * Mirrors the /billing/invoices list visually so the two surfaces feel
 * consistent. Click a row → /billing/expenses/[id] for view/edit.
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, ArrowDownCircle, Filter, Plus, ReceiptText, Loader2, Download,
  X, Trash2, Tag, CheckCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  EXPENSE_CATEGORIES, categoryStyle, formatMoney, formatDate,
  type Expense,
} from '@/lib/expenses';
import { ModalBase } from '@/components/ui/ModalBase';
import { useToast } from '@/components/billing/Toast';
import { logActivity } from '@/lib/activity-log';
import {
  consumePendingToast, describePendingToast, usePostSaveBust,
} from '@/lib/post-save-feedback';
import { downloadCsv, timestampedFilename } from '@/lib/csv-export';

export default function ExpensesListPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </main>
    }>
      <ExpensesListPageInner />
    </Suspense>
  );
}

function ExpensesListPageInner() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const bust = usePostSaveBust();
  const toast = useToast();

  useEffect(() => {
    const payload = consumePendingToast();
    if (payload?.entity === 'expense') {
      toast.show({ message: describePendingToast(payload) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // bust forces re-fetch after a form save/delete.
  }, [bust]);

  const filtered = useMemo(
    () => filter === 'all' ? (expenses ?? []) : (expenses ?? []).filter(e => e.category === filter),
    [expenses, filter],
  );

  // Multi-select state for bulk operations. Mirrors the invoice list
  // pattern: Set of selected ids, cleared when the filter changes so we
  // don't accidentally act on rows the operator can no longer see.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState<null | 'categorize' | 'delete'>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [bulkResult, setBulkResult] = useState<{ updated: number; failed: number } | null>(null);

  useEffect(() => {
    setSelected(prev => {
      const visible = new Set(filtered.map(e => e.id));
      const next = new Set<string>();
      prev.forEach(id => { if (visible.has(id)) next.add(id); });
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAllVisible() {
    setSelected(prev => {
      const allOn = filtered.length > 0 && filtered.every(e => prev.has(e.id));
      if (allOn) return new Set();
      const next = new Set<string>();
      filtered.forEach(e => next.add(e.id));
      return next;
    });
  }
  function clearSelection() { setSelected(new Set()); }

  const selectedRows = useMemo(
    () => filtered.filter(e => selected.has(e.id)),
    [filtered, selected],
  );
  const selectedTotal = useMemo(
    () => selectedRows.reduce((s, e) => s + Number(e.amount), 0),
    [selectedRows],
  );

  /**
   * Bulk re-category. One SQL UPDATE per row (Supabase doesn't let us
   * UPDATE WHERE id IN (...) AND get per-row error reporting otherwise).
   * Iteration is fine for the volumes a solo operator sees — a hundred
   * rows is the realistic ceiling, and modern Postgres handles those in
   * a hundred ms.
   */
  async function applyBulkCategorize() {
    if (!bulkCategory) return;
    setBulkBusy(true);
    let updated = 0, failed = 0;
    for (const row of selectedRows) {
      const { error } = await supabase
        .from('expenses')
        .update({ category: bulkCategory })
        .eq('id', row.id);
      if (error) { failed++; continue; }
      updated++;
      logActivity({
        action: 'updated',
        entity_type: 'expense',
        entity_id: row.id,
        entity_label: row.vendor,
        diff: { via: 'bulk_categorize', from: row.category, to: bulkCategory },
      });
    }
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    setExpenses((data ?? []) as Expense[]);
    setBulkResult({ updated, failed });
    setBulkBusy(false);
    setBulkOpen(null);
    clearSelection();
    setTimeout(() => setBulkResult(null), 6000);
  }

  /**
   * Bulk delete. Hard delete, no soft-delete column on expenses today.
   * Confirms in the modal; the floating bar already shows N + total
   * so the operator can sanity-check the scope before opening.
   */
  async function applyBulkDelete() {
    setBulkBusy(true);
    let updated = 0, failed = 0;
    for (const row of selectedRows) {
      const { error } = await supabase.from('expenses').delete().eq('id', row.id);
      if (error) { failed++; continue; }
      updated++;
      logActivity({
        action: 'deleted',
        entity_type: 'expense',
        entity_id: row.id,
        entity_label: `${row.vendor} · ${formatMoney(row.amount)}`,
        diff: { via: 'bulk_delete' },
      });
    }
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    setExpenses((data ?? []) as Expense[]);
    setBulkResult({ updated, failed });
    setBulkBusy(false);
    setBulkOpen(null);
    clearSelection();
    setTimeout(() => setBulkResult(null), 6000);
  }

  /**
   * Export the current filter view to CSV. Columns ordered for tax-time
   * sanity: date, vendor, category (tax bucket), amount first; then the
   * supporting columns. Boolean flags get human-readable yes/no.
   */
  function exportExpensesCsv() {
    if (filtered.length === 0) {
      toast.show({ message: 'Nothing to export — clear the filter or add expenses first.' });
      return;
    }
    downloadCsv(
      timestampedFilename('expenses'),
      filtered,
      [
        { header: 'Date',             value: e => e.expense_date },
        { header: 'Vendor',           value: e => e.vendor },
        { header: 'Category',         value: e => e.category },
        { header: 'Amount',           value: e => Number(e.amount).toFixed(2) },
        { header: 'Payment method',   value: e => e.payment_method ?? '' },
        { header: 'Property',         value: e => e.property_reference ?? '' },
        { header: 'Description',      value: e => e.description ?? '' },
        { header: 'Reimbursable',     value: e => e.reimbursable ? 'yes' : 'no' },
        { header: '1099-eligible',    value: e => e.is_1099_eligible ? 'yes' : 'no' },
        { header: 'Receipt URL',      value: e => e.receipt_url ?? '' },
        { header: 'Internal notes',   value: e => e.internal_notes ?? '' },
      ],
    );
    toast.show({ message: `Exported ${filtered.length} expense${filtered.length === 1 ? '' : 's'}.` });
  }

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
          <button
            type="button"
            onClick={exportExpensesCsv}
            className="ml-auto inline-flex items-center gap-1 text-caption text-foreground-muted hover:text-primary"
            title="Export the currently-filtered list to a spreadsheet (CSV)"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
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
            <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-background-cream border-b border-border">
                <tr className="text-left text-caption uppercase tracking-widest text-foreground-muted">
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all visible"
                      checked={filtered.length > 0 && filtered.every(e => selected.has(e.id))}
                      ref={el => {
                        if (el) {
                          const some = filtered.some(e => selected.has(e.id));
                          const all = filtered.every(e => selected.has(e.id));
                          el.indeterminate = some && !all;
                        }
                      }}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </th>
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
                  <tr
                    key={e.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      selected.has(e.id) ? 'bg-gold/5 hover:bg-gold/10' : 'hover:bg-background-cream/50'
                    }`}
                  >
                    <td className="px-3 py-4" onClick={ev => ev.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${e.vendor}`}
                        checked={selected.has(e.id)}
                        onChange={() => toggleOne(e.id)}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </td>
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
            </div>
          )}
        </section>

        {bulkResult && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-body-sm text-green-800 inline-flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Bulk updated {bulkResult.updated} expense{bulkResult.updated !== 1 ? 's' : ''}
            {bulkResult.failed > 0 && <span className="text-red-700">— {bulkResult.failed} failed</span>}.
          </div>
        )}
      </div>

      {/* Floating bulk-action bar. Mirrors the invoice list pattern so
          the two surfaces feel identical — sticky bottom-center, primary
          actions on the left, dismiss on the right. */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-primary text-white shadow-2xl border border-gold/40 pl-5 pr-2 py-2 max-w-[95vw]">
          <span className="text-body-sm font-semibold whitespace-nowrap">
            {selected.size} selected · {formatMoney(selectedTotal)}
          </span>
          <span className="hidden sm:block h-5 w-px bg-white/20 mx-1" />
          <button
            type="button"
            onClick={() => setBulkOpen('categorize')}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-body-sm font-semibold"
          >
            <Tag className="h-4 w-4" /> Re-category
          </button>
          <button
            type="button"
            onClick={() => setBulkOpen('delete')}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-body-sm font-semibold"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Clear selection"
            title="Clear selection"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bulk re-category modal */}
      <ModalBase
        open={bulkOpen === 'categorize'}
        onClose={() => setBulkOpen(null)}
        disableClose={bulkBusy}
        size="md"
        backdropClassName="bg-black/50"
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
              <Tag className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-heading text-body font-bold text-primary">
                Re-category {selected.size} expense{selected.size !== 1 ? 's' : ''}
              </h2>
              <p className="text-caption text-foreground-muted">Total: {formatMoney(selectedTotal)}</p>
            </div>
          </div>
          <button onClick={() => !bulkBusy && setBulkOpen(null)} disabled={bulkBusy} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream disabled:opacity-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-body-sm text-foreground-muted">
            All selected expenses will be re-tagged with the category below. Useful when reconciling a batch of imports or fixing a miscategorized run.
          </p>
          <div>
            <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-2">New category</span>
            <select
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
              value={bulkCategory}
              onChange={ev => setBulkCategory(ev.target.value)}
            >
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="rounded-lg bg-background-cream border border-border p-3 max-h-40 overflow-y-auto">
            <p className="text-caption uppercase tracking-widest text-foreground-muted mb-1">Selected</p>
            <ul className="text-caption text-primary space-y-0.5">
              {selectedRows.map(r => (
                <li key={r.id} className="flex justify-between gap-3">
                  <span className="truncate">{r.vendor}</span>
                  <span className="text-foreground-muted whitespace-nowrap">{r.category} → {bulkCategory}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-background-cream/40 flex items-center justify-end gap-2 rounded-b-2xl">
          <button onClick={() => setBulkOpen(null)} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-60">
            Cancel
          </button>
          <button onClick={applyBulkCategorize} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
            {bulkBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Tag className="h-4 w-4" /> Apply</>}
          </button>
        </div>
      </ModalBase>

      {/* Bulk delete modal */}
      <ModalBase
        open={bulkOpen === 'delete'}
        onClose={() => setBulkOpen(null)}
        disableClose={bulkBusy}
        size="md"
        backdropClassName="bg-black/50"
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <Trash2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-heading text-body font-bold text-primary">
                Delete {selected.size} expense{selected.size !== 1 ? 's' : ''}?
              </h2>
              <p className="text-caption text-foreground-muted">Total: {formatMoney(selectedTotal)}</p>
            </div>
          </div>
          <button onClick={() => !bulkBusy && setBulkOpen(null)} disabled={bulkBusy} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-body-sm text-foreground-muted">
            This permanently removes the rows. Expenses don&apos;t have soft-delete today, so the action can&apos;t be undone from the UI. Receipt files in storage are kept — clean those up separately if needed.
          </p>
          <ul className="text-caption text-primary space-y-0.5 max-h-40 overflow-y-auto rounded-lg bg-background-cream border border-border p-3">
            {selectedRows.map(r => (
              <li key={r.id} className="flex justify-between gap-3">
                <span className="truncate">{r.vendor}</span>
                <span className="text-foreground-muted whitespace-nowrap">{formatMoney(r.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 py-4 border-t border-border bg-background-cream/40 flex items-center justify-end gap-2 rounded-b-2xl">
          <button onClick={() => setBulkOpen(null)} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-60">
            Cancel
          </button>
          <button onClick={applyBulkDelete} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-5 py-2 text-body-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
            {bulkBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : <><Trash2 className="h-4 w-4" /> Delete all</>}
          </button>
        </div>
      </ModalBase>
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
