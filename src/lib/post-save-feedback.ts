/**
 * Shared helpers for the "I saved a thing, now what?" pattern across
 * billing forms. Solves two recurring papercuts:
 *
 *   1. Operator hits Save, the form redirects, and the destination list
 *      still shows the pre-save snapshot — because Next.js's router
 *      cache kept the previously-mounted client component, so its
 *      useEffect data fetch never re-ran. Result: "I added it but it
 *      didn't save." (It did. It just looked invisible.)
 *
 *   2. Even when the save did fire correctly, there's no visual
 *      confirmation. The form just navigates away silently. The
 *      operator can't tell a successful create from a no-op redirect
 *      from a duplicate-email overlap.
 *
 * Pattern:
 *
 *   // ── In a form on save success ──
 *   pushPendingToast({ entity: 'client', mode: 'create', name, existed });
 *   router.push(withBust('/billing/clients'));
 *   router.refresh();
 *
 *   // ── In a list page (wrapped in <Suspense>) ──
 *   const bust = usePostSaveBust();   // re-runs the fetch effect when set
 *   useEffect(() => {
 *     const p = consumePendingToast();
 *     if (p?.entity === 'client') toast.show({ message: describePendingToast(p) });
 *   }, []);
 *   useEffect(() => { fetchData(); }, [bust]);
 *
 * The bust query param (?t=<ts>) is the trick: changing the URL forces
 * useSearchParams to return a new value, which we feed into the data-
 * fetching effect's dep array. router.refresh() handles server-rendered
 * data; this handles client-rendered data.
 */

import { useSearchParams } from 'next/navigation';

export type BillingEntity =
  | 'client'
  | 'property'
  | 'contractor'
  | 'recurring'
  | 'expense'
  | 'invoice';

export type SaveMode = 'create' | 'edit' | 'delete' | 'restore';

export interface PendingToast {
  entity: BillingEntity;
  mode: SaveMode;
  /** Human-readable label for the toast — usually the record's display name. */
  name: string;
  /** True when the API short-circuited because the row already existed
   *  (e.g. duplicate-email path on POST /api/clients). */
  existed?: boolean;
  /** Optional id, useful if the consumer wants to link to the record. */
  id?: string;
}

const KEY = 'billing.pending_toast';

/** Persist a one-shot toast payload across navigation. Picked up by the
 *  next page that calls consumePendingToast(). Silent fail on private
 *  browsing / quota — the worst case is no toast, not a broken save. */
export function pushPendingToast(payload: PendingToast): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch { /* sessionStorage unavailable — skip */ }
}

/** Read and clear the pending toast. Returns null if nothing's stored
 *  or the payload is unparseable. */
export function consumePendingToast(): PendingToast | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as PendingToast;
  } catch {
    return null;
  }
}

/** Default message for a pending toast. Most callers can use this
 *  directly; pass a custom message to toast.show() if the entity needs
 *  domain-specific phrasing ("Voided", "Sent", etc.). */
export function describePendingToast(p: PendingToast): string {
  const verb =
      p.mode === 'edit'    ? 'Updated'
    : p.mode === 'delete'  ? 'Deleted'
    : p.mode === 'restore' ? 'Restored'
    : p.existed            ? 'Already saved'
    :                        'Created';
  const tail = p.existed ? ' — opened the existing record.' : '.';
  return `${verb} ${p.name}${tail}`;
}

/** Append `?t=<ts>` (or `&t=<ts>`) to a path. Pushing a URL with this
 *  param means the destination's useSearchParams hook reads a fresh
 *  value, which we use as a useEffect dep to force a re-fetch past
 *  Next.js's router cache. */
export function withBust(path: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}t=${Date.now()}`;
}

/** Hook for list pages: returns the current bust value as a string.
 *  Include it in your data-fetching useEffect's dependency array. The
 *  consumer MUST be wrapped in a <Suspense> boundary because
 *  useSearchParams forces client-side rendering during prerender. */
export function usePostSaveBust(): string {
  const sp = useSearchParams();
  return sp?.get('t') ?? '';
}
