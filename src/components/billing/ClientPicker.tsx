'use client';

/**
 * Typeahead client picker for the invoice + recurring-template forms.
 *
 * Drops in above the bill-to fields. Loads every saved client on mount,
 * filters client-side as you type, and shows a dropdown of matches.
 * Clicking a match calls `onPick(client)` so the parent can prefill all
 * the bill-to inputs. Typing a name that doesn't match anything just
 * stays in the input — the parent form's existing inputs handle the
 * "new client" path (and the save handler will upsert into the clients
 * table by email).
 *
 * Why client-side filtering: the universe of saved clients is small (a
 * brokerage has dozens, maybe a few hundred). Loading them all on mount
 * makes the typeahead snappy without server round-trips.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, UserPlus, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ClientLite } from '@/lib/clients';

export function ClientPicker({
  selectedId,
  onPick,
  onClear,
}: {
  selectedId: string | null;
  onPick: (client: ClientLite) => void;
  onClear: () => void;
}) {
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name, email, company, address, property_reference')
        .eq('active', true)
        .order('name');
      setClients((data ?? []) as ClientLite[]);
    })();
  }, []);

  // Click-outside to close the dropdown
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
    if (!q) return clients.slice(0, 8);
    return clients.filter(c => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [clients, query]);

  const selectedClient = selectedId ? clients.find(c => c.id === selectedId) ?? null : null;

  return (
    <div ref={wrapRef} className="relative">
      <div className="block">
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">
          Saved client
        </span>
        {selectedClient ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2.5">
            <div className="min-w-0">
              <div className="text-body-sm font-semibold text-primary inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
                {selectedClient.name}
              </div>
              <div className="text-caption text-foreground-muted truncate">
                {selectedClient.email}
                {selectedClient.company ? ` · ${selectedClient.company}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="text-foreground-muted hover:text-primary"
              aria-label="Pick a different client"
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
                placeholder="Type to find a saved client, or fill the fields below for a new one"
                className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
              />
            </div>
            {open && filtered.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-72 overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onPick(c);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-background-cream/60 border-b border-border last:border-0"
                  >
                    <div className="text-body-sm text-primary font-medium truncate">{c.name}</div>
                    <div className="text-caption text-foreground-muted truncate">
                      {c.email}
                      {c.company ? ` · ${c.company}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {open && query.trim().length > 0 && filtered.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-border bg-white shadow-lg p-3">
                <div className="text-body-sm text-foreground-muted inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-gold-dark" />
                  No saved client matches — fill the fields below and we'll save them on first invoice.
                </div>
              </div>
            )}
            <p className="mt-1.5 text-caption text-foreground-muted">
              {clients.length === 0
                ? 'No saved clients yet. Fill the fields below and the client is saved on first invoice.'
                : `${clients.length} saved client${clients.length !== 1 ? 's' : ''}. Pick to autofill, or enter a new one.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
