'use client';

/**
 * /billing/clients — saved client directory.
 *
 * Every client you've ever invoiced gets a row here (backfilled by
 * migration 0020). New invoices auto-upsert into this table on save,
 * so the list grows as you bill. Click a row to edit; the typeahead
 * on the invoice form reads from here.
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertTriangle, Plus, Users, ArrowLeft, Search, Receipt,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate, effectiveStatus, type Invoice } from '@/lib/invoices';
import type { Client } from '@/lib/clients';
import { useToast } from '@/components/billing/Toast';
import {
  consumePendingToast, describePendingToast, usePostSaveBust,
} from '@/lib/post-save-feedback';

interface ClientWithStats extends Client {
  invoice_count: number;
  outstanding: number;
  last_billed: string | null;
}

/**
 * Outer wrapper exists only to satisfy Next.js's requirement that any
 * tree using useSearchParams sit inside a Suspense boundary. Without
 * this, the build's prerender pass throws "should be wrapped in a
 * suspense boundary" and aborts.
 */
export default function ClientsListPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </main>
    }>
      <ClientsListPageInner />
    </Suspense>
  );
}

function ClientsListPageInner() {
  const [clients, setClients] = useState<ClientWithStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // The ?t=<ts> ClientForm appends on redirect — changing it forces the
  // fetch effect below to re-run past Next.js's router cache. Without
  // this, the previously-mounted list component stays put and the new
  // row looks invisible.
  const bust = usePostSaveBust();
  const toast = useToast();

  // Pop the post-save toast handoff on mount. Tells the operator
  // whether their save was a fresh insert, an update, a duplicate-email
  // overlap, or a delete.
  useEffect(() => {
    const payload = consumePendingToast();
    if (payload?.entity === 'client') {
      toast.show({ message: describePendingToast(payload) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: rows, error: e1 }, { data: invs }] = await Promise.all([
        supabase.from('clients').select('*').order('name'),
        supabase.from('invoices').select('id, client_id, client_email, total, status, due_date, paid_at, issue_date'),
      ]);
      if (cancelled) return;
      if (e1) {
        setError(e1.message.includes('does not exist')
          ? 'Clients table missing — run migration 0020.'
          : e1.message);
        setClients([]);
        return;
      }

      // Roll up invoice stats per client. Match by client_id first,
      // fall back to email so historical invoices without the link
      // still count.
      type InvoiceWithLink = Invoice & { client_id: string | null };
      const statsById: Record<string, { count: number; outstanding: number; last: string | null }> = {};
      const statsByEmail: Record<string, { count: number; outstanding: number; last: string | null }> = {};
      for (const i of (invs ?? []) as InvoiceWithLink[]) {
        const inv = i;
        const eff = effectiveStatus(inv);
        const out = eff === 'sent' || eff === 'overdue' ? Number(inv.total) : 0;
        const last = inv.paid_at?.slice(0, 10) ?? inv.issue_date;
        if (inv.client_id) {
          const r = (statsById[inv.client_id] ??= { count: 0, outstanding: 0, last: null });
          r.count++; r.outstanding = Math.round((r.outstanding + out + Number.EPSILON) * 100) / 100;
          if (!r.last || last > r.last) r.last = last;
        }
        const e = inv.client_email?.toLowerCase();
        if (e) {
          const r = (statsByEmail[e] ??= { count: 0, outstanding: 0, last: null });
          r.count++; r.outstanding = Math.round((r.outstanding + out + Number.EPSILON) * 100) / 100;
          if (!r.last || last > r.last) r.last = last;
        }
      }

      const enriched: ClientWithStats[] = (rows ?? []).map(c => {
        const byId = statsById[c.id];
        const byEmail = statsByEmail[c.email.toLowerCase()];
        const stats = byId ?? byEmail ?? { count: 0, outstanding: 0, last: null };
        return {
          ...(c as Client),
          invoice_count: stats.count,
          outstanding: stats.outstanding,
          last_billed: stats.last,
        };
      });
      setClients(enriched);
    })();
    return () => { cancelled = true; };
  // `bust` is the ?t=<ts> the form sets after save — changing it forces
  // this effect to re-fetch the list. Without it, the router cache may
  // serve the previously-mounted tree and the new row appears missing.
  }, [bust]);

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q)
      );
    });
  }, [clients, query]);

  const summary = useMemo(() => {
    if (!clients) return { total: 0, withOutstanding: 0, totalOutstanding: 0 };
    let withOutstanding = 0, totalOutstanding = 0;
    for (const c of clients) {
      if (c.outstanding > 0) { withOutstanding++; totalOutstanding += c.outstanding; }
    }
    return { total: clients.length, withOutstanding, totalOutstanding };
  }, [clients]);

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" /> Clients
            </h1>
            <p className="text-caption text-foreground-muted">
              Saved bill-to records. Pick from the typeahead on the New Invoice form to skip re-typing.
            </p>
          </div>
          <Link
            href="/billing/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New client
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        {clients === null ? (
          <div className="py-20 text-center text-foreground-muted">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold mb-2" />
            Loading clients…
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Tile label="Saved clients" value={String(summary.total)} />
              <Tile label="With outstanding balance" value={String(summary.withOutstanding)} tone={summary.withOutstanding > 0 ? 'red' : 'slate'} />
              <Tile label="Total outstanding" value={formatMoney(summary.totalOutstanding)} tone={summary.totalOutstanding > 0 ? 'red' : 'slate'} />
            </section>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, email, or company…"
                className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
              />
            </div>

            {filtered.length === 0 ? (
              <section className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-foreground-muted mb-3" />
                <h3 className="font-heading text-body font-bold text-primary mb-1">
                  {clients.length === 0 ? 'No clients yet' : 'No matches'}
                </h3>
                <p className="text-body-sm text-foreground-muted mb-5">
                  {clients.length === 0
                    ? "Clients are saved automatically when you invoice them. Create one manually if you want them ready to pick before the first bill."
                    : `No saved client matches "${query}".`}
                </p>
                {clients.length === 0 && (
                  <Link
                    href="/billing/clients/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" /> Add a client
                  </Link>
                )}
              </section>
            ) : (
              <section className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-body-sm min-w-[720px]">
                    <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Name</th>
                        <th className="px-5 py-3 text-left font-medium">Email</th>
                        <th className="px-5 py-3 text-left font-medium">Company</th>
                        <th className="px-5 py-3 text-right font-medium">Invoices</th>
                        <th className="px-5 py-3 text-right font-medium">Outstanding</th>
                        <th className="px-5 py-3 text-left font-medium">Last billed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map(c => (
                        <tr key={c.id} className="hover:bg-background-cream/40">
                          <td className="px-5 py-3">
                            <Link
                              href={`/billing/clients/${c.id}`}
                              className="font-semibold text-primary hover:text-gold-dark"
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-foreground-muted">{c.email}</td>
                          <td className="px-5 py-3 text-foreground-muted">{c.company ?? '—'}</td>
                          <td className="px-5 py-3 text-right text-primary">
                            <Link
                              href={`/billing/invoices?client=${encodeURIComponent(c.email)}`}
                              className="inline-flex items-center gap-1 text-primary hover:text-gold-dark"
                            >
                              <Receipt className="h-3 w-3" /> {c.invoice_count}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {c.outstanding > 0 ? (
                              <span className="font-mono font-semibold text-red-700">{formatMoney(c.outstanding)}</span>
                            ) : (
                              <span className="text-foreground-muted">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-foreground-muted">
                            {c.last_billed ? formatDate(c.last_billed) : '—'}
                          </td>
                        </tr>
                      ))}
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

function Tile({
  label, value, tone,
}: { label: string; value: string; tone?: 'red' | 'slate' }) {
  const cls = tone === 'red' ? 'text-red-600' : 'text-primary';
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-caption uppercase tracking-widest text-foreground-muted">{label}</p>
      <p className={`font-heading text-display-sm font-bold mt-1 ${cls}`}>{value}</p>
    </div>
  );
}
