'use client';

/**
 * /billing — financial dashboard.
 *
 * The "open the app and immediately know how the business is doing" view.
 * Pulls invoices + expenses, derives the key KPIs (paid this month vs last,
 * outstanding A/R, expenses, net income), renders an A/R aging snapshot,
 * a 6-month revenue trend, top expense categories, and a recent activity
 * feed. Everything is computed client-side via src/lib/billing-reports so
 * we don't pay a server roundtrip on every metric.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Receipt, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown,
  FilePlus2, Plus, AlertTriangle, Loader2, Clock, Wallet, ArrowRight,
  BarChart3, FileBadge, Building2, History,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  effectiveStatus, formatMoney, formatDate, STATUS_STYLES,
  type Invoice,
} from '@/lib/invoices';
import { categoryStyle, type Expense } from '@/lib/expenses';
import {
  computeArAging, computePl, sortCategoriesByAmount, trailing12MonthsRange,
  BUCKET_LABELS,
} from '@/lib/billing-reports';
import { CashFlowWidget } from '@/components/billing/CashFlowWidget';
import { ActivityFeedWidget } from '@/components/billing/ActivityFeedWidget';

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [invRes, expRes] = await Promise.all([
        // Exclude soft-deleted rows from the dashboard rollups — those
        // numbers should match the visible-by-default invoice/expense
        // lists. To see deleted rows the operator flips the "Show
        // deleted" toggle on the list pages.
        supabase.from('invoices').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').is('deleted_at', null).order('expense_date', { ascending: false }),
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

  // Core KPI math — current + previous month, then comparisons
  const stats = useMemo(() => {
    const now = new Date();
    const ym = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const thisMonth = ym(now);
    const lastMonth = ym(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

    let paidThisMonth = 0, paidLastMonth = 0;
    let expensesThisMonth = 0, expensesLastMonth = 0;

    for (const inv of invoices ?? []) {
      if (inv.status !== 'paid' || !inv.paid_at) continue;
      const k = inv.paid_at.slice(0, 7);
      const amt = Number(inv.paid_amount ?? inv.total);
      if (k === thisMonth) paidThisMonth += amt;
      else if (k === lastMonth) paidLastMonth += amt;
    }
    for (const e of expenses ?? []) {
      const k = e.expense_date.slice(0, 7);
      const amt = Number(e.amount);
      if (k === thisMonth) expensesThisMonth += amt;
      else if (k === lastMonth) expensesLastMonth += amt;
    }

    // YTD
    const yearPrefix = String(now.getUTCFullYear());
    let revenueYtd = 0, expensesYtd = 0;
    for (const inv of invoices ?? []) {
      if (inv.status === 'paid' && inv.paid_at?.startsWith(yearPrefix)) {
        revenueYtd += Number(inv.paid_amount ?? inv.total);
      }
    }
    for (const e of expenses ?? []) {
      if (e.expense_date.startsWith(yearPrefix)) expensesYtd += Number(e.amount);
    }

    return {
      paidThisMonth,
      paidLastMonth,
      paidDelta: paidLastMonth === 0 ? null : ((paidThisMonth - paidLastMonth) / paidLastMonth),
      expensesThisMonth,
      expensesLastMonth,
      expensesDelta: expensesLastMonth === 0 ? null : ((expensesThisMonth - expensesLastMonth) / expensesLastMonth),
      netThisMonth: paidThisMonth - expensesThisMonth,
      netLastMonth: paidLastMonth - expensesLastMonth,
      revenueYtd,
      expensesYtd,
      netYtd: revenueYtd - expensesYtd,
    };
  }, [invoices, expenses]);

  // A/R aging — drives the snapshot card
  const ar = useMemo(() => computeArAging(invoices ?? []), [invoices]);

  // Trailing 12 months — drives the trend chart
  const pl = useMemo(
    () => computePl(invoices ?? [], expenses ?? [], trailing12MonthsRange()),
    [invoices, expenses],
  );

  // Top 5 expense categories for the current month
  const topCategoriesThisMonth = useMemo(() => {
    const yearPrefix = new Date().getUTCFullYear() + '-' + String(new Date().getUTCMonth() + 1).padStart(2, '0');
    const byCat: Record<string, number> = {};
    for (const e of expenses ?? []) {
      if (!e.expense_date.startsWith(yearPrefix)) continue;
      byCat[e.category] = (byCat[e.category] ?? 0) + Number(e.amount);
    }
    return sortCategoriesByAmount(byCat).slice(0, 5);
  }, [expenses]);

  // Recent activity (last 10 across invoices + expenses)
  const recent = useMemo(() => {
    type Entry =
      | { kind: 'invoice'; date: string; data: Invoice }
      | { kind: 'expense'; date: string; data: Expense };
    const entries: Entry[] = [];
    for (const inv of invoices ?? []) entries.push({ kind: 'invoice', date: inv.created_at, data: inv });
    for (const e of expenses ?? []) entries.push({ kind: 'expense', date: e.created_at, data: e });
    entries.sort((a, b) => (a.date < b.date ? 1 : -1));
    return entries.slice(0, 10);
  }, [invoices, expenses]);

  const loading = invoices === null || expenses === null;

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-heading-md font-bold text-primary">Dashboard</h1>
            <p className="text-caption text-foreground-muted">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
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
            {/* ── Top KPIs ───────────────────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Kpi
                icon={ArrowUpCircle}
                label="Revenue this month"
                value={formatMoney(stats.paidThisMonth)}
                tone="green"
                delta={stats.paidDelta}
                compareLabel="vs last month"
                href="/billing/invoices?status=paid"
              />
              <Kpi
                icon={Receipt}
                label="Outstanding A/R"
                value={formatMoney(ar.summary.total_outstanding)}
                tone={ar.summary.total_overdue > 0 ? 'red' : 'gold'}
                sublabel={ar.summary.total_overdue > 0 ? `${formatMoney(ar.summary.total_overdue)} overdue` : undefined}
                href="/billing/reports/ar-aging"
              />
              <Kpi
                icon={ArrowDownCircle}
                label="Expenses this month"
                value={formatMoney(stats.expensesThisMonth)}
                tone="slate"
                delta={stats.expensesDelta}
                deltaInverted
                compareLabel="vs last month"
                href="/billing/expenses"
              />
              <Kpi
                icon={Wallet}
                label="Net income (month)"
                value={formatMoney(stats.netThisMonth)}
                tone={stats.netThisMonth >= 0 ? 'green' : 'red'}
                sublabel={`YTD ${formatMoney(stats.netYtd)}`}
              />
            </section>

            {/* ── Trend chart + A/R aging snapshot ──────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-heading text-body font-bold text-primary">Revenue vs expenses</h2>
                    <p className="text-caption text-foreground-muted">Trailing 12 months</p>
                  </div>
                  <Link
                    href="/billing/reports/profit-loss"
                    className="text-caption text-gold-dark hover:text-gold font-semibold inline-flex items-center gap-1"
                  >
                    Full P&L <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <TrendChart
                  revenueByMonth={pl.revenue_by_month}
                  expensesByMonth={Object.fromEntries(
                    Object.entries(pl.expenses_by_month_category).map(([m, cats]) => [
                      m, Object.values(cats).reduce((a, b) => a + b, 0),
                    ]),
                  )}
                />
              </div>

              <div className="rounded-xl border border-border bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-body font-bold text-primary">A/R aging</h2>
                  <Link
                    href="/billing/reports/ar-aging"
                    className="text-caption text-gold-dark hover:text-gold font-semibold inline-flex items-center gap-1"
                  >
                    Details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {ar.summary.total_outstanding === 0 ? (
                  <div className="py-8 text-center text-body-sm text-foreground-muted">
                    All caught up. Nothing outstanding.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(['current', '1-30', '31-60', '61-90', '90+'] as const).map(b => {
                      const amt = ar.summary[b];
                      const pct = ar.summary.total_outstanding > 0
                        ? (amt / ar.summary.total_outstanding) * 100 : 0;
                      const overdue = b !== 'current';
                      return (
                        <div key={b}>
                          <div className="flex items-center justify-between text-caption mb-1">
                            <span className="text-foreground-muted">{BUCKET_LABELS[b]}</span>
                            <span className={`font-mono font-semibold ${overdue && amt > 0 ? 'text-red-700' : 'text-primary'}`}>
                              {formatMoney(amt)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-background-cream overflow-hidden">
                            <div
                              className={`h-full ${
                                b === 'current'  ? 'bg-blue-400' :
                                b === '1-30'     ? 'bg-amber-400' :
                                b === '31-60'    ? 'bg-orange-500' :
                                b === '61-90'    ? 'bg-red-500'    :
                                                   'bg-red-700'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ── Top expense categories + Quick actions ─────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-body font-bold text-primary">Top expense categories (this month)</h2>
                  <Link
                    href="/billing/expenses"
                    className="text-caption text-gold-dark hover:text-gold font-semibold inline-flex items-center gap-1"
                  >
                    All expenses <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {topCategoriesThisMonth.length === 0 ? (
                  <div className="py-8 text-center text-body-sm text-foreground-muted">
                    No expenses recorded this month.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {topCategoriesThisMonth.map(c => {
                      const pct = stats.expensesThisMonth > 0
                        ? (c.total / stats.expensesThisMonth) * 100 : 0;
                      return (
                        <li key={c.category}>
                          <div className="flex items-center justify-between text-caption mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-medium border ${categoryStyle(c.category)}`}>
                              {c.category}
                            </span>
                            <span className="font-mono font-semibold text-primary">{formatMoney(c.total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-background-cream overflow-hidden">
                            <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-border bg-white p-5">
                <h2 className="font-heading text-body font-bold text-primary mb-4">Quick links</h2>
                <ul className="space-y-2">
                  <QuickLink href="/billing/invoices" icon={Receipt} label="All invoices" />
                  <QuickLink href="/billing/properties" icon={Building2} label="Properties / deals" />
                  <QuickLink href="/billing/recurring" icon={ArrowRight} label="Recurring invoices" />
                  <QuickLink href="/billing/reports/profit-loss" icon={BarChart3} label="P&L report" />
                  <QuickLink href="/billing/reports/ar-aging" icon={Clock} label="A/R aging" />
                  <QuickLink href="/billing/reports/1099" icon={FileBadge} label="1099 export" />
                  <QuickLink href="/billing/activity" icon={History} label="Activity log" />
                </ul>
              </div>
            </section>

            {/* ── Recent activity ────────────────────────────────────── */}
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

            {/* Cash forecast + activity feed — both client-side widgets
                that read their own data on mount. Keep them at the
                bottom of the dashboard so the existing "today" view
                stays the top-of-page anchor. */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <CashFlowWidget />
              </div>
              <ActivityFeedWidget limit={8} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// ───── Subcomponents ─────────────────────────────────────────────────────────

function Kpi({
  icon: Icon, label, value, sublabel, tone, delta, deltaInverted, compareLabel, href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
  tone: 'gold' | 'red' | 'green' | 'slate';
  /** Decimal change vs the comparison period (e.g. 0.12 for +12%). */
  delta?: number | null;
  /** When true, positive delta is treated as bad (used for expenses). */
  deltaInverted?: boolean;
  compareLabel?: string;
  href?: string;
}) {
  const toneColor =
    tone === 'red' ? 'text-red-600' :
    tone === 'green' ? 'text-green-700' :
    tone === 'slate' ? 'text-slate-700' :
    'text-gold-dark';

  let deltaEl: React.ReactNode = null;
  if (delta !== null && delta !== undefined) {
    const isPositive = delta >= 0;
    const isGood = deltaInverted ? !isPositive : isPositive;
    const Arrow = isPositive ? TrendingUp : TrendingDown;
    const cls = isGood ? 'text-green-700' : 'text-red-600';
    const pctStr = (Math.abs(delta) * 100).toFixed(0) + '%';
    deltaEl = (
      <span className={`inline-flex items-center gap-0.5 text-caption font-medium ${cls}`}>
        <Arrow className="h-3 w-3" /> {isPositive ? '+' : '−'}{pctStr}
      </span>
    );
  }

  const inner = (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption uppercase tracking-widest text-foreground-muted">{label}</span>
        <Icon className={`h-4 w-4 ${toneColor}`} />
      </div>
      <p className={`font-heading text-display-sm font-bold ${toneColor}`}>{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {deltaEl}
        {compareLabel && delta !== null && delta !== undefined && (
          <span className="text-caption text-foreground-muted">{compareLabel}</span>
        )}
        {sublabel && <span className="text-caption text-foreground-muted">{sublabel}</span>}
      </div>
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

/** Stacked bar chart: revenue (green) vs expenses (gray) by month. */
function TrendChart({
  revenueByMonth, expensesByMonth,
}: {
  revenueByMonth: Record<string, number>;
  expensesByMonth: Record<string, number>;
}) {
  // Build 12 month columns ending now
  const now = new Date();
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  const data = months.map(m => ({
    m,
    revenue: revenueByMonth[m] ?? 0,
    expenses: expensesByMonth[m] ?? 0,
  }));
  const max = Math.max(1, ...data.map(d => Math.max(d.revenue, d.expenses)));

  return (
    <div>
      {/* Horizontal scroll lane on narrow screens — 12 bars across 320px is unreadable */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex items-end justify-between gap-1 h-32 sm:h-40 min-w-[480px] sm:min-w-0">
          {data.map(d => {
            const rH = (d.revenue / max) * 100;
            const eH = (d.expenses / max) * 100;
            const label = new Date(d.m + '-01T00:00:00Z')
              .toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
            return (
              <div key={d.m} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${label}: ${formatMoney(d.revenue)} rev / ${formatMoney(d.expenses)} exp`}>
                <div className="w-full flex items-end justify-center gap-0.5 h-24 sm:h-32">
                  <div className="w-1/2 bg-green-500/80 rounded-t" style={{ height: `${rH}%`, minHeight: d.revenue > 0 ? '2px' : '0' }} />
                  <div className="w-1/2 bg-slate-300 rounded-t" style={{ height: `${eH}%`, minHeight: d.expenses > 0 ? '2px' : '0' }} />
                </div>
                <span className="text-caption text-foreground-muted">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-foreground-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-green-500/80" /> Revenue (paid)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-300" /> Expenses</span>
      </div>
    </div>
  );
}

function QuickLink({
  href, icon: Icon, label,
}: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-background-cream/60 text-body-sm text-primary">
        <span className="inline-flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-gold-dark" /> {label}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-foreground-muted" />
      </Link>
    </li>
  );
}
