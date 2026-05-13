'use client';

/**
 * /billing/reports/ar-aging — accounts receivable aging report.
 *
 * Lists every outstanding invoice (sent + overdue), bucketed into
 * current / 1-30 / 31-60 / 61-90 / 90+ days past due. The single most-used
 * collections report in any service business. Includes a CSV export so you
 * can hand the overdue list to a collections agent or your CPA.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertTriangle, Download, ArrowLeft, Mail, ExternalLink, Phone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate, type Invoice } from '@/lib/invoices';
import { computeArAging, BUCKET_LABELS, BUCKET_STYLES, type ArBucket } from '@/lib/billing-reports';

const BUCKET_ORDER: ArBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];

export default function ArAgingPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bucketFilter, setBucketFilter] = useState<ArBucket | 'all'>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .in('status', ['sent', 'overdue'])
        .order('due_date', { ascending: true });
      if (cancelled) return;
      if (error) setError(error.message);
      setInvoices((data ?? []) as Invoice[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const ar = useMemo(() => computeArAging(invoices ?? []), [invoices]);
  const filteredRows = useMemo(
    () => bucketFilter === 'all' ? ar.rows : ar.rows.filter(r => r.bucket === bucketFilter),
    [ar.rows, bucketFilter],
  );

  function downloadCsv() {
    const header = ['Invoice', 'Client', 'Email', 'Issued', 'Due', 'Days Overdue', 'Bucket', 'Total', 'Payment Link'];
    const escape = (v: string | number | null | undefined): string => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = ar.rows.map(r => [
      r.invoice.invoice_number,
      r.invoice.client_name,
      r.invoice.client_email,
      r.invoice.issue_date,
      r.invoice.due_date,
      r.days_overdue > 0 ? r.days_overdue : 0,
      BUCKET_LABELS[r.bucket],
      Number(r.invoice.total).toFixed(2),
      r.invoice.stripe_payment_link_url ?? '',
    ].map(escape).join(','));
    const csv = [header.map(escape).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ar-aging-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary">A/R Aging</h1>
            <p className="text-caption text-foreground-muted">Who owes you, how much, how overdue.</p>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={ar.rows.length === 0}
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

        {invoices === null ? (
          <div className="py-20 text-center text-foreground-muted">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold mb-2" />
            Loading aging report…
          </div>
        ) : (
          <>
            {/* Bucket tiles + filter */}
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {BUCKET_ORDER.map(b => {
                const amt = ar.summary[b];
                const active = bucketFilter === b;
                const count = ar.rows.filter(r => r.bucket === b).length;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBucketFilter(active ? 'all' : b)}
                    className={`text-left rounded-xl border bg-white p-4 transition-all ${
                      active ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="text-caption uppercase tracking-widest text-foreground-muted truncate">
                      {b === 'current' ? 'Current' : b === '90+' ? '90+ days' : `${b} days`}
                    </p>
                    <p className={`font-heading text-heading-sm font-bold mt-1 ${b === 'current' ? 'text-primary' : amt > 0 ? 'text-red-700' : 'text-foreground-muted'}`}>
                      {formatMoney(amt)}
                    </p>
                    <p className="text-caption text-foreground-muted mt-0.5">
                      {count} invoice{count !== 1 ? 's' : ''}
                    </p>
                  </button>
                );
              })}
            </section>

            {/* Total + filter status */}
            <section className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-border bg-white p-4">
              <div>
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Total outstanding</p>
                <p className="font-heading text-display-sm font-bold text-primary">
                  {formatMoney(ar.summary.total_outstanding)}
                </p>
                {ar.summary.total_overdue > 0 && (
                  <p className="text-caption text-red-700 font-medium">
                    {formatMoney(ar.summary.total_overdue)} overdue
                  </p>
                )}
              </div>
              {bucketFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setBucketFilter('all')}
                  className="text-caption text-gold-dark hover:text-gold font-semibold"
                >
                  Clear filter ({BUCKET_LABELS[bucketFilter]}) →
                </button>
              )}
            </section>

            {/* Detail table */}
            <section className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-heading text-body font-bold text-primary">
                  {bucketFilter === 'all' ? 'All outstanding invoices' : BUCKET_LABELS[bucketFilter]}
                </h2>
                <span className="text-caption text-foreground-muted">
                  {filteredRows.length} of {ar.rows.length}
                </span>
              </div>
              {filteredRows.length === 0 ? (
                <div className="p-12 text-center text-foreground-muted text-body-sm">
                  {bucketFilter === 'all'
                    ? 'No outstanding invoices. Nice.'
                    : 'Nothing in this bucket.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-body-sm">
                    <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Invoice</th>
                        <th className="px-5 py-3 text-left font-medium">Client</th>
                        <th className="px-5 py-3 text-left font-medium">Due</th>
                        <th className="px-5 py-3 text-right font-medium">Total</th>
                        <th className="px-5 py-3 text-left font-medium">Bucket</th>
                        <th className="px-5 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRows.map(r => (
                        <tr key={r.invoice.id} className="hover:bg-background-cream/40">
                          <td className="px-5 py-3 align-top">
                            <Link
                              href={`/billing/invoices/${r.invoice.id}`}
                              className="font-mono font-semibold text-primary hover:text-gold-dark"
                            >
                              {r.invoice.invoice_number}
                            </Link>
                            <div className="text-caption text-foreground-muted">
                              Issued {formatDate(r.invoice.issue_date)}
                            </div>
                          </td>
                          <td className="px-5 py-3 align-top text-primary">
                            {r.invoice.client_name}
                            {r.invoice.client_company && (
                              <div className="text-caption text-foreground-muted">{r.invoice.client_company}</div>
                            )}
                          </td>
                          <td className="px-5 py-3 align-top">
                            <div className="text-primary">{formatDate(r.invoice.due_date)}</div>
                            <div className={`text-caption font-medium ${r.days_overdue > 0 ? 'text-red-700' : 'text-foreground-muted'}`}>
                              {r.days_overdue > 0 ? `${r.days_overdue} day${r.days_overdue !== 1 ? 's' : ''} overdue` : `due in ${-r.days_overdue} day${-r.days_overdue !== 1 ? 's' : ''}`}
                            </div>
                          </td>
                          <td className="px-5 py-3 align-top text-right">
                            <span className="font-mono font-semibold text-primary">{formatMoney(r.invoice.total)}</span>
                          </td>
                          <td className="px-5 py-3 align-top">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold border ${BUCKET_STYLES[r.bucket]}`}>
                              {r.bucket === 'current' ? 'Current' : r.bucket === '90+' ? '90+ days' : `${r.bucket} days`}
                            </span>
                          </td>
                          <td className="px-5 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <a
                                href={`mailto:${r.invoice.client_email}?subject=Following up on invoice ${r.invoice.invoice_number}&body=Hi ${encodeURIComponent(r.invoice.client_name)},%0D%0A%0D%0AThis is a quick note about invoice ${r.invoice.invoice_number} for ${formatMoney(r.invoice.total)} which was due ${formatDate(r.invoice.due_date)}.${r.invoice.stripe_payment_link_url ? `%0D%0A%0D%0APayment link: ${r.invoice.stripe_payment_link_url}` : ''}%0D%0A%0D%0AThanks!`}
                                className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-white text-foreground-muted hover:text-primary hover:border-primary"
                                title="Email client"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                              {r.invoice.stripe_payment_link_url && (
                                <a
                                  href={r.invoice.stripe_payment_link_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-white text-foreground-muted hover:text-primary hover:border-primary"
                                  title="Open payment link"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Collections tips */}
            {ar.summary.total_overdue > 0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-heading text-body font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Collections playbook
                </h3>
                <ul className="text-body-sm text-amber-900 space-y-1.5 leading-relaxed">
                  <li>• 1–30 days: friendly reminder email (auto-sent by the cron — verify the invoice has reminders enabled).</li>
                  <li>• 31–60 days: phone call. Email follow-ups stop working past day 30. Pick up the phone.</li>
                  <li>• 61–90 days: written letter with consequences (late fees, collections referral, service suspension).</li>
                  <li>• 90+ days: escalate to a collections agent or small-claims court. Anything still here is a write-down candidate.</li>
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
