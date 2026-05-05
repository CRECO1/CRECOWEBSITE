'use client';

/**
 * Shortlist of listing IDs the user wants to compare side-by-side.
 *
 * Persisted in localStorage so the comparison survives navigation and
 * refresh. Cross-tab sync via the `storage` event so adding a listing in
 * one tab updates the chip count in another.
 *
 * Capped at MAX_COMPARE listings — beyond that the side-by-side gets
 * unwieldy. We dispatch a custom event so non-React listeners (and
 * components nested under different providers) can react.
 */

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'creco-compare-list';
const UPDATE_EVENT = 'creco-compare-update';
export const MAX_COMPARE = 4;

function readList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(list: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch { /* quota / private mode */ }
}

export function useCompareList() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readList());
    const sync = () => setIds(readList());
    window.addEventListener('storage', sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  const add = useCallback((id: string) => {
    const cur = readList();
    if (cur.includes(id)) return;
    if (cur.length >= MAX_COMPARE) return;
    writeList([...cur, id]);
  }, []);

  const remove = useCallback((id: string) => {
    writeList(readList().filter(x => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    const cur = readList();
    if (cur.includes(id)) {
      writeList(cur.filter(x => x !== id));
    } else if (cur.length < MAX_COMPARE) {
      writeList([...cur, id]);
    }
  }, []);

  const clear = useCallback(() => writeList([]), []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, add, remove, toggle, clear, has, full: ids.length >= MAX_COMPARE };
}
