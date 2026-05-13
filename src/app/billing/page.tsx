'use client';

/**
 * /billing — financial dashboard.
 *
 * Pulls invoices + expenses to compute revenue (paid invoices in current
 * month), outstanding (sent + overdue), expenses (this month), and net.
 * Shows recent activity from both feeds interleaved.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Receipt, ArrowDownCircle, ArrowUpCircle, TrendingUp,
  FilePlus2, Plus, AlertTriangle, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  effectiveStatus, formatMoney, formatDate, STATUS_STYLES,
  type Invoice,
} from '@/lib/invoices';
import { categoryStyle, type Expense } from '@/lib/expenses';

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [invRes, expRes] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      ]);
      if (cancelled) return;
      const errs: string[] = [];
      if (invRes.error) {
        errs.push(invRes.error.message.includes('does not exist')
          ? 'Invoices table missing — run migration 0010_invoices.sql.'
          : `Invoices: ${invRes.error.message}`);
      }
      if (expRes.error) {
        errs.push(expRes.error.message.includes('does not exist')
          ? 'Expenses table missing — run migration 0012_expenses.sql.'
          : `Expenses: ${expRes.error.message}`);
      }
      setErrors(errs);
      setInvoices((invRes.data ?? []) as Invoice[]);
      setExpenses((expRes.data ?? []) as Expense[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let outstanding = 0;
    let overdue = 0;
    let paidThisMonth = 0;
    let expensesThisMonth = 0;

    for (const inv of invoices ?? []) {
      const status = effectiveStatus(inv);
      if (status === 'sent' || status === 'overdue') outstanding += Number(inv.total);
      if (status === 'overdue') overdue += Number(inv.total);
      if (status === 'paid' && inv.paid_at) {
        if (new Date(inv.paid_at) >= startOfMonth) paidThisMonth += Number(inv.paid_amount ?? inv.total);
      }
    }
    for (const e of expenses ?? []) {
      if (new Date(e.expense_date + 'T12:00:00') >= startOfMonth) {
        expensesThisMonth += Number(e.amount);
      }
    }
    return {
      outstanding,
      overdue,
      paidThisMonth,
      expensesThisMonth,
      netThisMonth: paidThisMonth - expensesThisMonth,
    };
  }, [invoices, expenses]);

  // Combined "recent activity" feed — last 10 across both
  const recent = useMemo(() => {
    type Entry =
      | { kind: 'invoice'; date: string; data: Invoice }
      | { kind: 'expense'; date: string; data: Expense };
    const entries: Entry[] = [];
    for (const inv of invoices ?? []) {
      entries.push({ kind: 'invoice', date: inv.created_at, data: inv });
    }
    for (const e of expenses ?? []) {
      entries.push({ kind: 'expense', date: e.created_at, data: e });
    }
    entries.sort((a, b) => (a.date < b.date ? 1 : -1));
    return entries.slice(0, 10);
  }, [invoices, expenses]);

  const loading = invoices === null || expenses === null;

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-heading text-heading-md font-bold text-primary">Billing Dashboard</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/billing/expenses/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary"
            >
              <Plus className="h-4 w-4" /> New expense
            </Link>
            <Link
              href="/billing/invoices/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90"
            >
              <FilePlus2 className="h-4 w-4" /> New invoice
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {errors.map(err => (
          <div key={err} className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{err}</div>
          </div>
        ))}

        {loading ? (
          <div className="py-20 text-center text-foreground-muted">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold mb-2" />
            Loading dashboard…
          </div>
        ) : (
          <>
            {/* Stat tiles */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                icon={ArrowUpCircle}
                label="Paid this month"
                value={formatMoney(stats.paidThisMonth)}
                tone="green"
                href="/billing/invoices?status=paid"
              />
              <Stat
                icon={Receipt}
                label="Outstanding"
                value={formatMoney(stats.outstanding)}
                sublabel={stats.overdue > 0 ? `${formatMoney(stats.overdue)} overdue` : undefined}
                tone={stats.overdue > 0 ? 'red' : 'gold'}
                href="/billing/invoices"
              />
              <Stat
                icon={ArrowDownCircle}
                label="Expenses this month"
                value={formatMoney(stats.expensesThisMonth)}
                tone="slate"
                href="/billing/expenses"
              />
              <Stat
                icon={TrendingUp}
                label="Net this month"
                value={formatMoney(stats.netThisMonth)}
                tone={stats.netThisMonth >= 0 ? 'green' : 'red'}
              />
            </section>

            {/* Quick actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionCard
                href="/billing/invoices"
                icon={Receipt}
                title="Invoices"
                body="Create, send, and track invoices. Auto-marks overdue past the due date."
              />
              <ActionCard
                href="/billing/expenses"
                icon={ArrowDownCircle}
                title="Expenses"
                body="Record business expenses with category, vendor, and receipt link. Roll up monthly."
              />
            </section>

            {/* Recent activity */}
            <section className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-heading text-body font-bold text-primary">Recent activity</h2>
              </div>
              {recent.length === 0 ? (
                <div className="p-12 text-center text-foreground-muted text-body-sm">
                  No activity yet. Create an invoice or record an expense to get started.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((entry, i) => (
                    <li key={i}>
                      {entry.kind === 'invoice' ? (
                        <Link
                          href={`/billing/invoices/${entry.data.id}`}
                          className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-background-cream/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-700">
                              <ArrowUpCircle className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-body-sm text-primary truncate">
                                <span className="font-mono font-semibold">{entry.data.invoice_number}</span> · {entry.data.client_name}
                              </div>
                              <div className="text-caption text-foreground-muted">
                                {formatDate(entry.data.issue_date)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold border ${STATUS_STYLES[effectiveStatus(entry.data)].className}`}>
                              {STATUS_STYLES[effectiveStatus(entry.data)].label}
                            </span>
                            <span className="font-mono text-body-sm font-semibold text-primary">{formatMoney(entry.data.total)}</span>
                          </div>
                        </Link>
                      ) : (
                        <Link
                          href={`/billing/expenses/${entry.data.id}`}
                          className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-background-cream/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600">
                              <ArrowDownCircle className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-body-sm text-primary truncate">{entry.data.vendor}</div>
                              <div className="text-caption text-foreground-muted">
                                {formatDate(entry.data.expense_date)} · {entry.data.category}
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-body-sm font-semibold text-primary">−{formatMoney(entry.data.amount)}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({
  icon: Icon, label, value, sublabel, tone, href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
  tone: 'gold' | 'red' | 'green' | 'slate';
  href?: string;
}) {
  const toneColor = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-green-700' : tone === 'slate' ? 'text-slate-700' : 'text-gold-dark';
  const inner = (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption uppercase tracking-widest text-foreground-muted">{label}</span>
        <Icon className={`h-4 w-4 ${toneColor}`} />
      </div>
      <p className={`font-heading text-display-sm font-bold ${toneColor}`}>{value}</p>
      {sublabel && <p className="mt-1 text-caption text-red-600 font-medium">{sublabel}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="rounded-xl border border-border bg-white p-5 hover:border-gold hover:shadow-card-hover transition-all">
      {inner}
    </Link>
  ) : (
    <div className="rounded-xl border border-border bg-white p-5">{inner}</div>
  );
}

function ActionCard({
  href, icon: Icon, title, body,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="group rounded-xl border border-border bg-white p-6 hover:border-gold hover:shadow-card-hover transition-all">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-primary transition-colors shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-heading text-heading-sm font-bold text-primary group-hover:text-gold transition-colors">{title}</h3>
          <p className="mt-1 text-body-sm text-foreground-muted">{body}</p>
        </div>
      </div>
    </Link>
  );
}
