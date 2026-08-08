'use client';

/**
 * Property typeahead picker for invoice + expense + recurring-template
 * forms. Same pattern as ClientPicker — loads all active properties on
 * mount, filters client-side as the operator types.
 *
 * Why client-side filter: at single-operator scale (dozens of properties,
 * maybe hundreds at most) loading all of them once on mount is faster
 * than a debounced server round-trip per keystroke. The dropdown caps
 * results so the rendered list stays manageable.
 *
 * Selecting "no property" is intentional — the property_id column is
 * NULL-able and the operator may have an expense that doesn't roll up
 * to any specific deal (general overhead, software subscriptions,
 * etc.).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, Building2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PropertyLite } from '@/lib/properties';

interface Props {
  selectedId: string | null;
  onPick: (property: PropertyLite) => void;
  onClear: () => void;
  /** Optional label override. Default is "Property / Deal". */
  label?: string;
}

export function PropertyPicker({ selectedId, onPick, onClear, label }: Props) {
  const [properties, setProperties] = useState<PropertyLite[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, name, address, status')
        // Active + closed both show — operator may want to log a final
        // expense on a closed deal. Soft-deleted are hidden.
        .is('deleted_at', null)
        .in('status', ['active', 'closed'])
        .order('status', { ascending: true })
        .order('name');
      setProperties((data ?? []) as PropertyLite[]);
    })();
  }, []);

  // Click-outside closes the dropdown
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties.slice(0, 8);
    return properties
      .filter(p => p.name.toLowerCase().includes(q) || (p.address ?? '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [properties, query]);

  const selectedProperty = selectedId ? properties.find(p => p.id === selectedId) ?? null : null;

  return (
    <div ref={wrapRef} className="relative">
      <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">
        {label ?? 'Property / Deal'}
      </span>
      {selectedProperty ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2.5">
          <div className="min-w-0">
            <div className="text-body-sm font-semibold text-primary inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-700" />
              {selectedProperty.name}
              {selectedProperty.status === 'closed' && (
                <span className="rounded-full bg-blue-50 text-blue-800 px-1.5 py-0.5 text-caption font-medium">closed</span>
              )}
            </div>
            {selectedProperty.address && (
              <div className="text-caption text-foreground-muted truncate">{selectedProperty.address}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-foreground-muted hover:text-primary"
            aria-label="Clear property selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder={properties.length === 0
                ? 'No properties yet — create one in /billing/properties'
                : 'Type to find a property, or leave blank for general overhead'}
              className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            />
          </div>
          {open && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-72 overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
              {filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onPick(p); setOpen(false); setQuery(''); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-background-cream/60 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-foreground-muted" />
                    <span className="text-body-sm text-primary font-medium truncate">{p.name}</span>
                    {p.status === 'closed' && (
                      <span className="rounded-full bg-blue-50 text-blue-800 px-1.5 py-0.5 text-caption">closed</span>
                    )}
                  </div>
                  {p.address && (
                    <div className="text-caption text-foreground-muted truncate ml-5">{p.address}</div>
                  )}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1.5 text-caption text-foreground-muted">
            {properties.length === 0
              ? <>No properties yet. <Link href="/billing/properties/new" className="text-gold-dark font-semibold">Create your first →</Link></>
              : `${properties.length} property${properties.length === 1 ? '' : 's'} on file. Optional — leave blank for general overhead.`}
          </p>
        </>
      )}
    </div>
  );
}
