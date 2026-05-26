'use client';

/**
 * useEscapeKey — call `handler` when the Escape key is pressed and `active`
 * is true. Wires + unwires a global keydown listener cleanly with the React
 * lifecycle. Pattern used by every modal in the app so the UX feels native
 * (cancel/close on Esc is the expected web convention).
 *
 * Pass `active` so the listener auto-detaches when the modal isn't visible;
 * keeps the keyboard surface uncluttered and avoids stale-closure handlers
 * firing for re-mounted modals.
 */

import { useEffect } from 'react';

export function useEscapeKey(handler: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handler();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler, active]);
}
