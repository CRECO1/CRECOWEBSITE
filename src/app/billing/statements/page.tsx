'use client';

/**
 * /billing/statements — pick a client + period, get a statement.
 *
 * Lists every client we've ever invoiced (distinct by email) with their
 * outstanding balance and last-activity date. Click a client → choose a
 * period → download the PDF or email it.
 *
 * Quarterly is the default because PM clients usually want a clean
 * three-month recap; other ranges (custom, YTD, last quarter) are one
 * tap away.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertTriangle, ArrowLeft, FileText, Download, Mail, CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { effectiveStatus, formatMoney, type Invoice } from '@/lib/invoices';

interface ClientSummary {
  email: string;
  name: string;
  company: string | null;
  invoice_count: number;
  outstanding: number;
  last_activity: string;
}

type Preset = 'last_quarter' | 'this_quarter' | 'ytd' | 'last_year' | 'custom';

function quarterRange(year: number, q: 1 | 2 | 3 | 4) {
  const startMonth = (q - 1) * 3;     // 0, 3, 6, 9
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function currentQuarter(now: Date = new Date()): 1 | 2 | 3 | 4 {
  return (Math.floor(now.getUTCMonth() / 3) + 1) as 1 | 2 | 3 | 4;
}

export default function StatementsPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('this_quarter');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [busy, setBusy] = useState<'download' | 'email' | null>(null);
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      setInvoices((data ?? []) as Invoice[]);
    })();
    return () => { cancelled = true; };
  }, []);

  // Roll invoices up to one row per client (by email)
  const clients: ClientSummary[] = useMemo(() => {
    const byEmail: Record<string, ClientSummary> = {};
    for (const inv of invoices ?? []) {
      const email = inv.client_email;
      if (!email) continue;
      const eff = effectiveStatus(inv);
      const outstanding = eff === 'sent' || eff === 'overdue' ? Number(inv.total) : 0;
      const last = inv.paid_at?.slice(0, 10) ?? inv.issue_date;
      if (!byEmail[email]) {
        byEmail[email] = {
          email,
          name: inv.client_name,
          company: inv.client_company,
          invoice_count: 0,
          outstanding: 0,
          last_activity: last,
        };
      }
      byEmail[email].invoice_count++;
      byEmail[email].outstanding = Math.round((byEmail[email].outstanding + outstanding + Number.EPSILON) * 100) / 100;
      if (last > byEmail[email].last_activity) byEmail[email].last_activity = last;
    }
    return Object.values(byEmail).sort((a, b) => (a.last_activity < b.last_activity ? 1 : -1));
  }, [invoices]);

  const selectedClient = clients.find(c => c.email === selectedEmail) ?? null;

  const range = useMemo(() => {
    const now = new Date();
    const year = now.getUTCFullYear();
    if (preset === 'this_quarter') return quarterRange(year, currentQuarter(now));
    if (preset === 'last_quarter') {
      const q = currentQuarter(now);
      if (q === 1) return quarterRange(year - 1, 4);
      return quarterRange(year, (q - 1) as 1 | 2 | 3);
    }
    if (preset === 'ytd') return { start: `${year}-01-01`, end: now.toISOString().slice(0, 10) };
    if (preset === 'last_year') return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` };
    return { start: customStart, end: customEnd };
  }, [preset, customStart, customEnd]);

  async function generate(action: 'download' | 'email') {
    if (!selectedClient) return;
    if (!range.start || !range.end) {
      setActionError('Pick a period first');
      return;
    }
    setBusy(action);
    setActionError(null);
    setSentNotice(null);

    try {
      const res = await fetch(`/api/statements?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_email: selectedClient.email,
          period_start: range.start,
          period_end: range.end,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      if (action === 'download') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statement-${selectedClient.email}-${range.start}-to-${range.end}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setSentNotice(`Statement emailed to ${selectedClient.email}`);
        setTimeout(() => setSentNotice(null), 5000);
      }
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold" /> Statements
            </h1>
            <p className="text-caption text-foreground-muted">
              Pick a client + a period, deliver a PDF statement.
            </p>
          </div>
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
            Loading clients…
          </div>
        ) : clients.length === 0 ? (
          <section className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-foreground-muted mb-3" />
            <h3 className="font-heading text-body font-bold text-primary mb-1">No clients yet</h3>
            <p className="text-body-sm text-foreground-muted">
              Create an invoice first; the client will show up here automatically.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client list */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="font-heading text-body font-bold text-primary">Clients</h2>
                  <p className="text-caption text-foreground-muted">{clients.length} total</p>
                </div>
                <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {clients.map(c => {
                    const selected = c.email === selectedEmail;
                    return (
                      <li key={c.email}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmail(c.email);
                            setSentNotice(null);
                            setActionError(null);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-background-cream/60 ${selected ? 'bg-gold/10' : ''}`}
                        >
                          <div className="text-body-sm text-primary font-semibold truncate">{c.name}</div>
                          {c.company && <div className="text-caption text-foreground-muted truncate">{c.company}</div>}
                          <div className="mt-1 flex items-center justify-between text-caption text-foreground-muted">
                            <span>{c.invoice_count} invoice{c.invoice_count !== 1 ? 's' : ''}</span>
                            {c.outstanding > 0 ? (
                              <span className="text-red-700 font-semibold">{formatMoney(c.outstanding)} due</span>
                            ) : (
                              <span className="text-green-700">paid up</span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Statement builder */}
            <div className="lg:col-span-2">
              {!selectedClient ? (
                <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
                  <p className="text-body-sm text-foreground-muted">
                    Pick a client from the list to generate a statement.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Client summary card */}
                  <section className="rounded-xl border border-border bg-white p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h2 className="font-heading text-heading-sm font-bold text-primary">
                          {selectedClient.name}
                        </h2>
                        {selectedClient.company && (
                          <p className="text-body-sm text-foreground-muted">{selectedClient.company}</p>
                        )}
                        <p className="text-caption text-foreground-muted">{selectedClient.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-caption uppercase tracking-widest text-foreground-muted">Outstanding</p>
                        <p className={`font-heading text-heading-sm font-bold ${selectedClient.outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {formatMoney(selectedClient.outstanding)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Period picker */}
                  <section className="rounded-xl border border-border bg-white p-5 space-y-4">
                    <h3 className="font-heading text-body font-bold text-primary">Statement period</h3>
                    <div className="flex flex-wrap gap-2">
                      {([
                        ['this_quarter', 'This quarter'],
                        ['last_quarter', 'Last quarter'],
                        ['ytd',          'YTD'],
                        ['last_year',    'Last year'],
                        ['custom',       'Custom'],
                      ] as [Preset, string][]).map(([k, label]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setPreset(k)}
                          className={`px-4 py-2 rounded-md border text-body-sm ${
                            preset === k
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-primary border-border hover:border-primary'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {preset === 'custom' && (
                      <div className="flex items-center gap-2 text-body-sm flex-wrap">
                        <input
                          type="date"
                          value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                          className="rounded-md border border-border px-3 py-2"
                        />
                        <span className="text-foreground-muted">to</span>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={e => setCustomEnd(e.target.value)}
                          className="rounded-md border border-border px-3 py-2"
                        />
                      </div>
                    )}
                    <p className="text-caption text-foreground-muted">
                      Period: <span className="font-mono text-primary">{range.start} → {range.end}</span>
                    </p>
                  </section>

                  {/* Actions */}
                  <section className="rounded-xl border border-border bg-white p-5">
                    <h3 className="font-heading text-body font-bold text-primary mb-3">Deliver</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => generate('download')}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                      >
                        {busy === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => generate('email')}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-body-sm font-semibold text-primary hover:border-primary disabled:opacity-60"
                      >
                        {busy === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Email to client
                      </button>
                    </div>
                    {sentNotice && (
                      <div className="mt-3 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-body-sm text-green-800 inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {sentNotice}
                      </div>
                    )}
                    {actionError && (
                      <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-body-sm text-red-800">
                        {actionError}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
