'use client';

/**
 * /billing/invoices — the invoice control center.
 *
 * Shows a stats strip across the top (Outstanding / Overdue / Paid this
 * month) and a filterable table below. Click a row → /billing/invoices/[id]
 * to view, edit, send, or mark paid.
 *
 * All reads/writes go through the Supabase client using the admin's session
 * — RLS gates the actual access. Server-side actions (PDF, email) live in
 * /api/invoices/[id]/* routes.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, FilePlus2, Filter, Mail, Receipt, Eye, EyeOff,
  CheckCircle, Ban, X, Loader2, DollarSign,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  formatMoney, formatDate, effectiveStatus, STATUS_STYLES,
  type Invoice, type InvoiceStatus,
} from '@/lib/invoices';
import { ModalBase } from '@/components/ui/ModalBase';

const FILTERS: { label: string; value: 'all' | InvoiceStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Paid', value: 'paid' },
  { label: 'Void', value: 'void' },
];

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const [error, setError] = useState<string | null>(null);

  // Multi-select state for bulk operations. Set of selected invoice IDs.
  // Cleared when the filter changes (because the visible set changes) so
  // we don't accidentally bulk-act on rows the operator can no longer see.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState<null | 'paid' | 'void'>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ updated: number; failed: number } | null>(null);
  const [bulkMethod, setBulkMethod] = useState<string>('Check');
  const [bulkDate, setBulkDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Note: ModalBase handles Escape-to-close + focus trap, gated on its
  // own `disableClose` prop. Each bulk modal below passes `bulkBusy` so
  // mid-write keypresses don't tear down state.

  // Soft-deleted invoices hide by default. The "Show deleted" toggle
  // below reveals them so the operator can restore from trash.
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      const { data, error } = showDeleted ? await query : await query.is('deleted_at', null);
      if (cancelled) return;
      if (error) {
        setError(
          error.message.includes('does not exist')
            ? 'The invoices table does not exist yet. Run the migration in supabase/migrations/0010_invoices.sql via the Supabase SQL editor.'
            : error.message,
        );
        setInvoices([]);
      } else {
        setInvoices((data ?? []) as Invoice[]);
      }
    })();
    return () => { cancelled = true; };
  }, [showDeleted]);

  const enriched = useMemo(
    () => (invoices ?? []).map(inv => ({ ...inv, _status: effectiveStatus(inv) })),
    [invoices],
  );

  const filtered = useMemo(
    () => filter === 'all' ? enriched : enriched.filter(i => i._status === filter),
    [enriched, filter],
  );

  // Drop any selection that's no longer in the filtered set when the filter
  // changes. Avoids the trap of "I selected 5 on the All view, switched to
  // Paid, and bulk-mark-paid silently applied to 5 invoices I can't see."
  useEffect(() => {
    setSelected(prev => {
      const visible = new Set(filtered.map(i => i.id));
      const next = new Set<string>();
      prev.forEach(id => { if (visible.has(id)) next.add(id); });
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  // Selection helpers
  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAllVisible() {
    setSelected(prev => {
      const allOn = filtered.every(i => prev.has(i.id));
      if (allOn) return new Set();
      const next = new Set<string>();
      filtered.forEach(i => next.add(i.id));
      return next;
    });
  }
  function clearSelection() {
    setSelected(new Set());
  }

  /**
   * Bulk-mark-paid. Stripe links can't be deactivated in a single SQL update
   * (they're per-invoice API calls), so we iterate and fire deactivation in
   * parallel after the DB writes land. Failures don't block — they're
   * counted and surfaced as "X failed" in the result banner.
   */
  async function applyBulkPaid() {
    setBulkBusy(true);
    const ids = Array.from(selected);
    const now = `${bulkDate}T12:00:00.000Z`;
    let updated = 0;
    let failed = 0;
    for (const inv of filtered.filter(i => ids.includes(i.id))) {
      const { error: e } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: now,
          paid_method: bulkMethod,
          paid_amount: inv.total,
        })
        .eq('id', inv.id);
      if (e) { failed++; continue; }
      updated++;
      if (inv.stripe_payment_link_url) {
        fetch(`/api/invoices/${inv.id}/deactivate-payment-link`, { method: 'POST' })
          .catch(err => console.warn('Payment link deactivation failed:', err));
      }
    }
    // Refresh the list
    const reloadQ = supabase
      .from('invoices').select('*')
      .order('created_at', { ascending: false });
    const { data } = showDeleted ? await reloadQ : await reloadQ.is('deleted_at', null);
    setInvoices((data ?? []) as Invoice[]);
    setBulkResult({ updated, failed });
    setBulkBusy(false);
    setBulkOpen(null);
    clearSelection();
    setTimeout(() => setBulkResult(null), 6000);
  }

  async function applyBulkVoid() {
    setBulkBusy(true);
    // Skip invoices that are already void — silently passing them through
    // the UPDATE is a no-op but the operator's success count would lie.
    // Filter first so "Updated N" matches what actually changed.
    const targets = filtered.filter(i => selected.has(i.id) && i._status !== 'void');
    const skipped = selected.size - targets.length;
    let updated = 0;
    let failed = 0;
    for (const inv of targets) {
      const { error: e } = await supabase
        .from('invoices')
        .update({ status: 'void' })
        .eq('id', inv.id);
      if (e) failed++; else updated++;
    }
    if (skipped > 0) {
      console.info(`[bulk-void] Skipped ${skipped} already-void invoice${skipped !== 1 ? 's' : ''}.`);
    }
    const reloadQ = supabase
      .from('invoices').select('*')
      .order('created_at', { ascending: false });
    const { data } = showDeleted ? await reloadQ : await reloadQ.is('deleted_at', null);
    setInvoices((data ?? []) as Invoice[]);
    setBulkResult({ updated, failed });
    setBulkBusy(false);
    setBulkOpen(null);
    clearSelection();
    setTimeout(() => setBulkResult(null), 6000);
  }

  const selectedRows = useMemo(
    () => filtered.filter(i => selected.has(i.id)),
    [filtered, selected],
  );
  const selectedTotal = useMemo(
    () => selectedRows.reduce((s, i) => s + Number(i.total), 0),
    [selectedRows],
  );

  // Stats: outstanding (sent + overdue, not paid), overdue, paid this month
  const stats = useMemo(() => {
    let outstanding = 0;
    let overdue = 0;
    let paidThisMonth = 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    for (const inv of enriched) {
      if (inv._status === 'sent' || inv._status === 'overdue') {
        outstanding += Number(inv.total);
      }
      if (inv._status === 'overdue') overdue += Number(inv.total);
      if (inv._status === 'paid' && inv.paid_at) {
        if (new Date(inv.paid_at) >= startOfMonth) paidThisMonth += Number(inv.paid_amount ?? inv.total);
      }
    }
    return { outstanding, overdue, paidThisMonth };
  }, [enriched]);

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <Receipt className="h-5 w-5 text-gold" />
              Invoices
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/billing/invoices/settings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2.5 text-body-sm text-foreground-muted hover:text-primary"
              title="Edit email template"
            >
              <Mail className="h-4 w-4" /> Email template
            </Link>
            <Link
              href="/billing/invoices/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
            >
              <FilePlus2 className="h-4 w-4" /> New invoice
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Stats strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Outstanding" value={formatMoney(stats.outstanding)} accent="gold" />
          <StatCard label="Overdue" value={formatMoney(stats.overdue)} accent={stats.overdue > 0 ? 'red' : 'gold'} />
          <StatCard label="Paid this month" value={formatMoney(stats.paidThisMonth)} accent="green" />
        </section>

        {/* Filters */}
        <section className="flex items-center gap-2 flex-wrap">
          <span className="text-caption uppercase tracking-widest text-foreground-muted mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter
          </span>
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                filter === f.value
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border text-foreground-muted hover:border-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowDeleted(s => !s)}
            className="ml-auto inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary"
            title={showDeleted ? 'Hide soft-deleted invoices' : 'Show soft-deleted invoices (Trash)'}
          >
            {showDeleted ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showDeleted ? 'Hiding deleted' : 'Show deleted'}
          </button>
        </section>

        {/* Table */}
        <section className="rounded-xl border border-border bg-white overflow-hidden">
          {error && (
            <div className="p-6 text-body-sm text-destructive bg-destructive/5 border-b border-destructive/20">
              {error}
            </div>
          )}
          {invoices === null ? (
            <div className="p-12 text-center text-foreground-muted">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Receipt className="mx-auto h-10 w-10 text-foreground-subtle mb-3" />
              <p className="text-body-sm text-foreground-muted">
                {invoices.length === 0
                  ? 'No invoices yet. Create your first one.'
                  : 'No invoices match this filter.'}
              </p>
              {invoices.length === 0 && !error && (
                <Link
                  href="/billing/invoices/new"
                  className="inline-flex items-center gap-2 mt-5 rounded-lg bg-gold px-5 py-2.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  <FilePlus2 className="h-4 w-4" /> Create invoice
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-background-cream border-b border-border">
                <tr className="text-left text-caption uppercase tracking-widest text-foreground-muted">
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all visible"
                      checked={filtered.length > 0 && filtered.every(i => selected.has(i.id))}
                      ref={el => {
                        if (el) {
                          const some = filtered.some(i => selected.has(i.id));
                          const all = filtered.every(i => selected.has(i.id));
                          el.indeterminate = some && !all;
                        }
                      }}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Issued</th>
                  <th className="px-5 py-3 font-semibold">Due</th>
                  <th className="px-5 py-3 font-semibold text-right">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const style = STATUS_STYLES[inv._status];
                  return (
                    <tr
                      key={inv.id}
                      className={`border-b border-border last:border-0 transition-colors ${
                        inv.deleted_at ? 'opacity-60' : ''
                      } ${
                        selected.has(inv.id) ? 'bg-gold/5 hover:bg-gold/10' : 'hover:bg-background-cream/50'
                      }`}
                    >
                      <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${inv.invoice_number}`}
                          checked={selected.has(inv.id)}
                          onChange={() => toggleOne(inv.id)}
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/billing/invoices/${inv.id}`} className="font-mono text-body-sm font-semibold text-primary hover:text-gold-dark">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-body-sm text-primary">
                        <div>{inv.client_name}</div>
                        {inv.client_company && (
                          <div className="text-caption text-foreground-muted">{inv.client_company}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-body-sm text-foreground-muted">{formatDate(inv.issue_date)}</td>
                      <td className="px-5 py-4 text-body-sm text-foreground-muted">{formatDate(inv.due_date)}</td>
                      <td className="px-5 py-4 text-body-sm font-semibold text-primary text-right">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="px-5 py-4">
                        {/* Combined status + open-tracking pill. Once an
                            invoice has been emailed (sent_at is set) and
                            isn't a draft/void, we append a slash + open
                            state. Drafts / voids show the status alone.
                            Color comes from the base status — opened
                            state is conveyed via icon + suffix text. */}
                        {inv.sent_at && inv._status !== 'void' && inv._status !== 'draft' ? (
                          (inv.open_count ?? 0) > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold border ${style.className}`}
                              title={inv.last_opened_at
                                ? `Opened ${inv.open_count} time${inv.open_count !== 1 ? 's' : ''} — most recent ${new Date(inv.last_opened_at).toLocaleString()}`
                                : `Opened ${inv.open_count} time${inv.open_count !== 1 ? 's' : ''}`}
                            >
                              {style.label} / Opened
                              <Eye className="h-3 w-3" />
                              {inv.open_count && inv.open_count > 1 ? <span className="font-mono">×{inv.open_count}</span> : null}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold border ${style.className}`}
                              title="Sent but the recipient hasn't opened the email yet (or their client blocks tracking)"
                            >
                              {style.label} / Not Opened
                              <EyeOff className="h-3 w-3 opacity-60" />
                            </span>
                          )
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold border ${style.className}`}>
                            {style.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/billing/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 text-body-sm text-gold-dark hover:text-gold"
                        >
                          Open <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </section>

        {bulkResult && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-body-sm text-green-800 inline-flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Updated {bulkResult.updated} invoice{bulkResult.updated !== 1 ? 's' : ''}
            {bulkResult.failed > 0 && <span className="text-red-700">— {bulkResult.failed} failed</span>}.
          </div>
        )}
      </div>

      {/* Floating bulk-action bar — only shown when 1+ invoices are selected.
          Sticky bottom-center so it's always within thumb-reach without
          scrolling. Mirrors the patterns Gmail / Stripe / FreshBooks use
          for multi-select. */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-primary text-white shadow-2xl border border-gold/40 pl-5 pr-2 py-2 max-w-[95vw]">
          <span className="text-body-sm font-semibold whitespace-nowrap">
            {selected.size} selected · {formatMoney(selectedTotal)}
          </span>
          <span className="hidden sm:block h-5 w-px bg-white/20 mx-1" />
          <button
            type="button"
            onClick={() => setBulkOpen('paid')}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 hover:bg-green-700 px-4 py-2 text-body-sm font-semibold"
          >
            <CheckCircle className="h-4 w-4" /> Mark paid
          </button>
          <button
            type="button"
            onClick={() => setBulkOpen('void')}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-body-sm font-semibold"
          >
            <Ban className="h-4 w-4" /> Void
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

      {/* Bulk mark-paid modal */}
      <ModalBase
        open={bulkOpen === 'paid'}
        onClose={() => setBulkOpen(null)}
        disableClose={bulkBusy}
        size="md"
        backdropClassName="bg-black/50"
      >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-800">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-heading text-body font-bold text-primary">
                    Mark {selected.size} invoice{selected.size !== 1 ? 's' : ''} paid
                  </h2>
                  <p className="text-caption text-foreground-muted">
                    Total: {formatMoney(selectedTotal)}
                  </p>
                </div>
              </div>
              <button onClick={() => !bulkBusy && setBulkOpen(null)} disabled={bulkBusy} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream disabled:opacity-50" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-body-sm text-foreground-muted">
                Each invoice will be marked paid for its full total. Payment date and method below apply to all.
                For mixed methods or partial payments, mark them individually.
              </p>

              <div>
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-2">Method</span>
                <div className="grid grid-cols-5 gap-1.5" role="radiogroup">
                  {['Check', 'ACH', 'Stripe', 'Cash', 'Other'].map(m => {
                    const selected = bulkMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setBulkMethod(m)}
                        className={`rounded-lg border-2 px-2 py-1.5 text-caption font-semibold transition-colors ${
                          selected ? 'border-gold bg-gold/5 text-primary' : 'border-border bg-white text-foreground-muted hover:border-gold/50'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Payment date</span>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={e => setBulkDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
                />
              </label>

              <div className="rounded-lg bg-background-cream border border-border p-3 max-h-40 overflow-y-auto">
                <p className="text-caption uppercase tracking-widest text-foreground-muted mb-1">Selected</p>
                <ul className="text-caption text-primary space-y-0.5">
                  {selectedRows.map(r => (
                    <li key={r.id} className="font-mono flex justify-between gap-3">
                      <span>{r.invoice_number}</span>
                      <span className="text-foreground-muted">{formatMoney(r.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-background-cream/40 flex items-center justify-end gap-2 rounded-b-2xl">
              <button onClick={() => setBulkOpen(null)} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-60">
                Cancel
              </button>
              <button onClick={applyBulkPaid} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-5 py-2 text-body-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60">
                {bulkBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><CheckCircle className="h-4 w-4" /> Mark {selected.size} paid</>}
              </button>
            </div>
      </ModalBase>

      {/* Bulk void modal */}
      <ModalBase
        open={bulkOpen === 'void'}
        onClose={() => setBulkOpen(null)}
        disableClose={bulkBusy}
        size="md"
        backdropClassName="bg-black/50"
      >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Ban className="h-4 w-4" />
                </span>
                <h2 className="font-heading text-body font-bold text-primary">
                  Void {selected.size} invoice{selected.size !== 1 ? 's' : ''}?
                </h2>
              </div>
              <button onClick={() => !bulkBusy && setBulkOpen(null)} disabled={bulkBusy} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-body-sm text-foreground-muted">
                Voids are reversible — you can reopen any voided invoice later. Stripe payment links (if any) will be deactivated separately.
              </p>
              <ul className="text-caption text-primary space-y-0.5 max-h-40 overflow-y-auto rounded-lg bg-background-cream border border-border p-3">
                {selectedRows.map(r => (
                  <li key={r.id} className="font-mono flex justify-between gap-3">
                    <span>{r.invoice_number}</span>
                    <span className="text-foreground-muted">{r.client_name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-4 border-t border-border bg-background-cream/40 flex items-center justify-end gap-2 rounded-b-2xl">
              <button onClick={() => setBulkOpen(null)} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-60">
                Cancel
              </button>
              <button onClick={applyBulkVoid} disabled={bulkBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-5 py-2 text-body-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60">
                {bulkBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Voiding…</> : <><Ban className="h-4 w-4" /> Void all</>}
              </button>
            </div>
      </ModalBase>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'gold' | 'red' | 'green';
}) {
  const accentColor =
    accent === 'red' ? 'text-red-600'
    : accent === 'green' ? 'text-green-700'
    : 'text-gold-dark';
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-caption uppercase tracking-widest text-foreground-muted">{label}</p>
      <p className={`mt-2 font-heading text-display-sm font-bold ${accentColor}`}>{value}</p>
    </div>
  );
}
