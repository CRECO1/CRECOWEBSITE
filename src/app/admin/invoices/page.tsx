'use client';

/**
 * /admin/invoices — the invoice control center.
 *
 * Shows a stats strip across the top (Outstanding / Overdue / Paid this
 * month) and a filterable table below. Click a row → /admin/invoices/[id]
 * to view, edit, send, or mark paid.
 *
 * All reads/writes go through the Supabase client using the admin's session
 * — RLS gates the actual access. Server-side actions (PDF, email) live in
 * /api/invoices/[id]/* routes.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FilePlus2, Filter, Mail, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  formatMoney, formatDate, effectiveStatus, STATUS_STYLES,
  type Invoice, type InvoiceStatus,
} from '@/lib/invoices';

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
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
  }, []);

  const enriched = useMemo(
    () => (invoices ?? []).map(inv => ({ ...inv, _status: effectiveStatus(inv) })),
    [invoices],
  );

  const filtered = useMemo(
    () => filter === 'all' ? enriched : enriched.filter(i => i._status === filter),
    [enriched, filter],
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
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
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
              href="/admin/invoices/settings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2.5 text-body-sm text-foreground-muted hover:text-primary"
              title="Edit email template"
            >
              <Mail className="h-4 w-4" /> Email template
            </Link>
            <Link
              href="/admin/invoices/new"
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
                  href="/admin/invoices/new"
                  className="inline-flex items-center gap-2 mt-5 rounded-lg bg-gold px-5 py-2.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  <FilePlus2 className="h-4 w-4" /> Create invoice
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-background-cream border-b border-border">
                <tr className="text-left text-caption uppercase tracking-widest text-foreground-muted">
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
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-background-cream/50 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/admin/invoices/${inv.id}`} className="font-mono text-body-sm font-semibold text-primary hover:text-gold-dark">
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold border ${style.className}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/invoices/${inv.id}`}
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
          )}
        </section>
      </div>
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
