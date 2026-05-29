/**
 * Saved-view persistence for billing list pages. Operators can snapshot
 * a filter combo ("Overdue Acme invoices", "Q3 expenses by category")
 * and recall it in one click.
 *
 * Storage: localStorage, keyed by page namespace so different list
 * pages don't collide. Values are JSON-encoded with a version field
 * for future migrations.
 *
 * Honest scope: this is opinionated about being client-side-only. We
 * don't sync views across devices because a solo-operator doesn't
 * usually need that. If we add multi-user later, lift to the DB.
 */

const VERSION = 1;
const STORAGE_PREFIX = 'creco_saved_views/';

export interface SavedView<TFilters> {
  id: string;
  name: string;
  filters: TFilters;
  createdAt: string;
}

interface Envelope<TFilters> {
  v: number;
  views: SavedView<TFilters>[];
}

function key(namespace: string): string {
  return `${STORAGE_PREFIX}${namespace}`;
}

/** Read all saved views for a namespace. Returns [] on any failure. */
export function readSavedViews<TFilters>(namespace: string): SavedView<TFilters>[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key(namespace));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Envelope<TFilters>;
    if (parsed.v !== VERSION) return [];
    return Array.isArray(parsed.views) ? parsed.views : [];
  } catch {
    return [];
  }
}

function writeSavedViews<TFilters>(namespace: string, views: SavedView<TFilters>[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      key(namespace),
      JSON.stringify({ v: VERSION, views } satisfies Envelope<TFilters>),
    );
  } catch { /* quota / private mode — silent fail is fine */ }
}

/** Append a new view. Returns the full updated list. */
export function addSavedView<TFilters>(
  namespace: string,
  view: Omit<SavedView<TFilters>, 'id' | 'createdAt'>,
): SavedView<TFilters>[] {
  const existing = readSavedViews<TFilters>(namespace);
  const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const next: SavedView<TFilters>[] = [
    ...existing,
    { id, name: view.name, filters: view.filters, createdAt: new Date().toISOString() },
  ];
  writeSavedViews(namespace, next);
  return next;
}

/** Remove a view by id. Returns the updated list. */
export function removeSavedView<TFilters>(
  namespace: string,
  id: string,
): SavedView<TFilters>[] {
  const next = readSavedViews<TFilters>(namespace).filter(v => v.id !== id);
  writeSavedViews(namespace, next);
  return next;
}
