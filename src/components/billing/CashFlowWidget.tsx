'use client';

/**
 * 30/60/90 day cash-flow forecast widget for /billing.
 *
 * Pulls outstanding invoices + active recurring templates, hands them
 * to forecastCashFlow(), and renders three cards. Each card shows the
 * cumulative expected gross cash in that window with a tooltip
 * breakdown of outstanding vs recurring.
 *
 * If the operator has zero outstanding invoices AND zero recurring
 * templates, renders a friendly empty state instead of zero values.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Calendar, Repeat, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/invoices';
import { forecastCashFlow, type CashFlowForecast } from '@/lib/cash-flow';

export function CashFlowWidget() {
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Outstanding = sent or overdue invoices that haven't been paid
      // and aren't soft-deleted. We only need a couple of columns.
      const [invR, tplR] = await Promise.all([
        supabase
          .from('invoices')
          .select('total, due_date, paid_at, status')
          .in('status', ['sent', 'overdue'])
          .is('paid_at', null)
          .is('deleted_at', null),
        supabase
          .from('recurring_invoice_templates')
          .select('id, next_run_date, end_date, frequency, due_days, active')
          .eq('active', true),
      ]);
      if (cancelled) return;
      const invoices = (invR.data ?? []) as { total: number; due_date: string; paid_at: string | null; status: string }[];

      // For each recurring template, sum the line items to get an
      // estimated_total per occurrence. Separate fetch keeps the main
      // queries lean; templates are small in count.
      const tplIds = (tplR.data ?? []).map(t => t.id);
      let totalsByTpl: Record<string, number> = {};
      if (tplIds.length > 0) {
        const { data: lines } = await supabase
          .from('recurring_invoice_line_items')
          .select('template_id, amount')
          .in('template_id', tplIds);
        for (const l of (lines ?? []) as { template_id: string; amount: number }[]) {
          totalsByTpl[l.template_id] = (totalsByTpl[l.template_id] ?? 0) + Number(l.amount);
        }
      }
      const templates = (tplR.data ?? []).map((t: { id: string; next_run_date: string; end_date: string | null; frequency: 'monthly' | 'quarterly' | 'annually'; due_days: number; active: boolean }) => ({
        ...t,
        estimated_total: totalsByTpl[t.id] ?? 0,
      }));

      // Map invoice status to the shape forecastCashFlow expects (which
      // uses a wider InvoiceStatus union from lib/invoices).
      const invoicesForForecast = invoices.map(i => ({
        total: Number(i.total),
        due_date: i.due_date,
        paid_at: i.paid_at,
        status: i.status as 'sent' | 'overdue' | 'paid' | 'draft' | 'void',
      }));
      setForecast(forecastCashFlow(invoicesForForecast, templates));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-heading text-body font-bold text-primary mb-3 inline-flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gold" /> Cash forecast
        </h2>
        <p className="text-caption text-foreground-muted">Loading…</p>
      </section>
    );
  }

  if (!forecast || (forecast.in_30 === 0 && forecast.in_60 === 0 && forecast.in_90 === 0)) {
    return (
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-heading text-body font-bold text-primary mb-3 inline-flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gold" /> Cash forecast
        </h2>
        <p className="text-caption text-foreground-muted">
          No outstanding invoices or recurring templates. Send an invoice or set up a recurring template to start projecting cash.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-heading text-body font-bold text-primary inline-flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gold" /> Cash forecast
        </h2>
        <p className="text-caption text-foreground-muted inline-flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Assumes on-time payment
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ForecastCard
          label="Next 30 days"
          value={forecast.in_30}
          outstanding={forecast.outstanding_30}
          recurring={forecast.recurring_30}
        />
        <ForecastCard
          label="Next 60 days"
          value={forecast.in_60}
          outstanding={forecast.outstanding_60}
          recurring={forecast.recurring_60}
        />
        <ForecastCard
          label="Next 90 days"
          value={forecast.in_90}
          outstanding={forecast.outstanding_90}
          recurring={forecast.recurring_90}
        />
      </div>
      <div className="mt-3 flex items-center justify-end">
        <Link href="/billing/invoices?filter=overdue" className="text-caption text-gold-dark hover:text-gold inline-flex items-center gap-1">
          See outstanding invoices →
        </Link>
      </div>
    </section>
  );
}

function ForecastCard({
  label, value, outstanding, recurring,
}: {
  label: string;
  value: number;
  outstanding: number;
  recurring: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-background-cream/30 p-4">
      <p className="text-caption uppercase tracking-widest text-foreground-muted flex items-center gap-1.5">
        <Calendar className="h-3 w-3" /> {label}
      </p>
      <p className="mt-2 font-heading text-heading-sm font-bold text-primary">{formatMoney(value)}</p>
      <div className="mt-2 space-y-0.5 text-caption text-foreground-muted">
        <div className="flex justify-between"><span>From open invoices</span><span className="font-mono">{formatMoney(outstanding)}</span></div>
        <div className="flex justify-between"><span className="inline-flex items-center gap-1"><Repeat className="h-2.5 w-2.5" />From recurring</span><span className="font-mono">{formatMoney(recurring)}</span></div>
      </div>
    </div>
  );
}
