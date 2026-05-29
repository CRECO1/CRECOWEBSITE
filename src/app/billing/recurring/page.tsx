'use client';

/**
 * /billing/recurring — list of recurring invoice templates.
 *
 * Property management clients pay the same fee every month; this is the
 * "write it once" view. Each template shows its schedule, next run date,
 * and quick stats on what it has generated.
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, AlertTriangle, Plus, Repeat, ArrowLeft, CheckCircle2, PauseCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/invoices';
import {
  FREQUENCY_LABELS, type RecurringTemplate, type RecurringLineItem,
} from '@/lib/recurring-invoices';
import { useToast } from '@/components/billing/Toast';
import {
  consumePendingToast, describePendingToast, usePostSaveBust,
} from '@/lib/post-save-feedback';

interface TemplateWithStats extends RecurringTemplate {
  generated_count: number;
  generated_total: number;
  monthly_value: number;     // estimated based on line items + frequency
}

// useSearchParams requires Suspense during prerender.
export default function RecurringTemplatesPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </main>
    }>
      <RecurringTemplatesPageInner />
    </Suspense>
  );
}

function RecurringTemplatesPageInner() {
  const [templates, setTemplates] = useState<TemplateWithStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bust = usePostSaveBust();
  const toast = useToast();

  useEffect(() => {
    const payload = consumePendingToast();
    if (payload?.entity === 'recurring') {
      toast.show({ message: describePendingToast(payload) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: tpls, error: tplErr } = await supabase
        .from('recurring_invoice_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (tplErr) {
        setError(tplErr.message.includes('does not exist')
          ? 'Recurring templates table missing — run migration 0017.'
          : tplErr.message);
        setTemplates([]);
        return;
      }
      const tplList = (tpls ?? []) as RecurringTemplate[];

      // Pull all line items for these templates in one query
      const ids = tplList.map(t => t.id);
      const { data: items } = ids.length > 0
        ? await supabase.from('recurring_invoice_line_items').select('*').in('template_id', ids)
        : { data: [] as RecurringLineItem[] };

      // Pull invoice generation stats
      const { data: gens } = ids.length > 0
        ? await supabase.from('invoices').select('recurring_template_id, total').in('recurring_template_id', ids)
        : { data: [] as { recurring_template_id: string; total: number }[] };

      const byTplItems: Record<string, RecurringLineItem[]> = {};
      for (const li of (items ?? []) as RecurringLineItem[]) {
        if (!li.template_id) continue;
        (byTplItems[li.template_id] ??= []).push(li);
      }
      const byTplGen: Record<string, { count: number; total: number }> = {};
      for (const g of gens ?? []) {
        const id = (g as { recurring_template_id: string }).recurring_template_id;
        const t = Number((g as { total: number }).total);
        const row = (byTplGen[id] ??= { count: 0, total: 0 });
        row.count++;
        row.total += t;
      }

      const enriched: TemplateWithStats[] = tplList.map(t => {
        const lis = byTplItems[t.id] ?? [];
        const subtotal = lis.reduce((sum, li) => sum + Number(li.amount), 0);
        const total = subtotal * (1 + Number(t.tax_rate));
        const monthlyValue =
          t.frequency === 'monthly'   ? total :
          t.frequency === 'quarterly' ? total / 3 :
          total / 12;
        return {
          ...t,
          generated_count: byTplGen[t.id]?.count ?? 0,
          generated_total: byTplGen[t.id]?.total ?? 0,
          monthly_value: monthlyValue,
        };
      });
      setTemplates(enriched);
    })();
    return () => { cancelled = true; };
    // bust forces re-fetch after a RecurringTemplateForm save.
  }, [bust]);

  const summary = useMemo(() => {
    if (!templates) return { activeCount: 0, mrr: 0 };
    let mrr = 0, activeCount = 0;
    for (const t of templates) {
      if (t.active) { activeCount++; mrr += t.monthly_value; }
    }
    return { activeCount, mrr };
  }, [templates]);

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary">Recurring Invoices</h1>
            <p className="text-caption text-foreground-muted">Bill the same client on a schedule — no manual creation each cycle.</p>
          </div>
          <Link
            href="/billing/recurring/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New template
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        {templates === null ? (
          <div className="py-20 text-center text-foreground-muted">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold mb-2" />
            Loading templates…
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Active templates</p>
                <p className="font-heading text-display-sm font-bold text-primary mt-1">{summary.activeCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Est. monthly recurring</p>
                <p className="font-heading text-display-sm font-bold text-gold-dark mt-1">{formatMoney(summary.mrr)}</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-caption uppercase tracking-widest text-foreground-muted">Total generated</p>
                <p className="font-heading text-display-sm font-bold text-primary mt-1">
                  {templates.reduce((s, t) => s + t.generated_count, 0)}{' '}
                  <span className="text-caption text-foreground-muted font-normal">invoices</span>
                </p>
              </div>
            </section>

            {/* List */}
            {templates.length === 0 ? (
              <section className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
                <Repeat className="mx-auto h-10 w-10 text-foreground-muted mb-3" />
                <h3 className="font-heading text-body font-bold text-primary mb-1">No recurring templates yet</h3>
                <p className="text-body-sm text-foreground-muted mb-5">
                  Create a template for any client you bill on a regular schedule —
                  property management fees, retainers, monthly leasing services.
                </p>
                <Link
                  href="/billing/recurring/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> Create your first template
                </Link>
              </section>
            ) : (
              <section className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-body-sm min-w-[720px]">
                    <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Template</th>
                        <th className="px-5 py-3 text-left font-medium">Frequency</th>
                        <th className="px-5 py-3 text-left font-medium">Next run</th>
                        <th className="px-5 py-3 text-right font-medium">Est. monthly</th>
                        <th className="px-5 py-3 text-left font-medium">Generated</th>
                        <th className="px-5 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {templates.map(t => (
                        <tr key={t.id} className="hover:bg-background-cream/40">
                          <td className="px-5 py-3">
                            <Link
                              href={`/billing/recurring/${t.id}`}
                              className="font-semibold text-primary hover:text-gold-dark"
                            >
                              {t.name}
                            </Link>
                            <div className="text-caption text-foreground-muted">{t.client_name}</div>
                          </td>
                          <td className="px-5 py-3 text-primary">{FREQUENCY_LABELS[t.frequency]}</td>
                          <td className="px-5 py-3">
                            <div className="text-primary">{formatDate(t.next_run_date)}</div>
                            <div className="text-caption text-foreground-muted">{t.on_generate === 'draft' ? 'create as draft' : 'auto-send'}</div>
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-primary">
                            {formatMoney(t.monthly_value)}
                          </td>
                          <td className="px-5 py-3">
                            {t.generated_count > 0 ? (
                              <>
                                <div className="text-primary">{t.generated_count} invoice{t.generated_count !== 1 ? 's' : ''}</div>
                                <div className="text-caption text-foreground-muted">{formatMoney(t.generated_total)} total</div>
                              </>
                            ) : (
                              <span className="text-caption text-foreground-muted">— none yet</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {t.active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold border bg-green-50 text-green-800 border-green-200">
                                <CheckCircle2 className="h-3 w-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold border bg-gray-50 text-gray-600 border-gray-200">
                                <PauseCircle className="h-3 w-3" /> Paused
                              </span>
                            )}
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
