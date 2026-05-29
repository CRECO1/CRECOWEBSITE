'use client';

/**
 * useFocusTrap — keeps keyboard focus inside a modal/dialog container.
 *
 * Without this, Tab from the last focusable element jumps out of the
 * dialog and onto whatever is behind it on the page — bad for both
 * accessibility (screen-reader users get lost) and UX (sighted keyboard
 * users have to Tab back in). WCAG 2.1 SC 2.4.3 also expects this.
 *
 * Pattern:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useFocusTrap(ref, isOpen);
 *   return <div ref={ref}>...</div>;
 *
 * Active gate: when `active` is false the hook detaches its listener
 * cleanly, so the same component can mount/unmount or toggle without
 * leaking handlers.
 *
 * Initial focus: if the container has no element currently focused, we
 * focus the first focusable element when the trap activates. This makes
 * a modal usable immediately after the parent flips `open` true.
 */

import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable child if nothing inside the container is
    // already focused. Common case on modal open.
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables.length === 0) return;
    const active_inside = container.contains(document.activeElement);
    if (!active_inside) {
      // Defer to next tick so an autoFocus on a child input wins. Otherwise
      // a Skip-the-first-focusable race can flicker focus onto a Close icon
      // before the input takes it.
      requestAnimationFrame(() => {
        const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        focusables[0]?.focus();
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (!container) return;
      const items = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;

      // Shift+Tab from the first element wraps to the last; Tab from the
      // last wraps to the first. If focus is somehow outside the container
      // (rare — maybe after a programmatic blur), pull it back to the first.
      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !container.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, containerRef]);
}
