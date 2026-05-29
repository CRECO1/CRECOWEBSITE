'use client';

/**
 * /billing/properties — list of properties / deals for per-property
 * P&L tagging. Click a row to see drill-down revenue, expenses, and
 * net. "New" creates the row; the picker on /billing/invoices/new and
 * /billing/expenses/new can then attach those entities.
 *
 * Filter buttons: Active / Closed / Inactive / All. Mirrors the
 * invoice list filter pattern. Soft-deleted properties are hidden by
 * default and can be revealed via a "Show deleted" toggle for restore.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FilePlus2, Building2, Filter, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  PROPERTY_STATUS_STYLES,
  type Property,
  type PropertyStatus,
} from '@/lib/properties';

type FilterValue = 'all' | PropertyStatus;
const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Active',   value: 'active' },
  { label: 'Closed',   value: 'closed' },
  { label: 'Inactive', value: 'inactive' },
];

export default function PropertiesListPage() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const query = supabase.from('properties').select('*').order('created_at', { ascending: false });
      const { data, error } = showDeleted ? await query : await query.is('deleted_at', null);
      if (cancelled) return;
      if (error) setError(error.message);
      setProperties((data ?? []) as Property[]);
    })();
    return () => { cancelled = true; };
  }, [showDeleted]);

  const filtered = useMemo(
    () => (properties ?? []).filter(p => filter === 'all' || p.status === filter),
    [properties, filter],
  );

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
              <Building2 className="h-5 w-5 text-gold" /> Properties
            </h1>
          </div>
          <Link
            href="/billing/properties/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            <FilePlus2 className="h-4 w-4" /> New property
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
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
            title={showDeleted ? 'Hide soft-deleted properties' : 'Show soft-deleted properties'}
          >
            {showDeleted ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showDeleted ? 'Hiding deleted' : 'Show deleted'}
          </button>
        </section>

        <section className="rounded-xl border border-border bg-white overflow-hidden">
          {error && (
            <div className="p-6 text-body-sm text-destructive bg-destructive/5 border-b border-destructive/20">{error}</div>
          )}
          {properties === null ? (
            <div className="p-12 text-center text-foreground-muted">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Building2 className="mx-auto h-10 w-10 text-foreground-subtle mb-3" />
              <p className="text-body-sm text-foreground-muted">
                {properties.length === 0
                  ? 'No properties yet. Create your first one.'
                  : 'No properties match this filter.'}
              </p>
              {properties.length === 0 && (
                <Link
                  href="/billing/properties/new"
                  className="inline-flex items-center gap-2 mt-5 rounded-lg bg-gold px-5 py-2.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  <FilePlus2 className="h-4 w-4" /> Create property
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-background-cream border-b border-border">
                  <tr className="text-left text-caption uppercase tracking-widest text-foreground-muted">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Address</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const statusStyle = PROPERTY_STATUS_STYLES[p.status];
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-border last:border-0 hover:bg-background-cream/50 transition-colors ${
                          p.deleted_at ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-5 py-4">
                          <Link href={`/billing/properties/${p.id}`} className="text-body-sm font-semibold text-primary hover:text-gold-dark">
                            {p.name}
                            {p.deleted_at && <span className="ml-2 text-caption text-foreground-muted">(deleted)</span>}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-body-sm text-foreground-muted">
                          {p.address ? `${p.address}${p.city ? `, ${p.city}` : ''}` : '—'}
                        </td>
                        <td className="px-5 py-4 text-body-sm text-foreground-muted capitalize">
                          {p.property_type ?? '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold border ${statusStyle.className}`}>
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/billing/properties/${p.id}`}
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
      </div>
    </main>
  );
}
