'use client';

/**
 * Global keyboard shortcuts for the billing surface. Mounted from the
 * billing layout. Listens for keys at the window level and routes to
 * actions that match operator intent.
 *
 * Shortcuts (active only when no input/textarea is focused):
 *   n  → new invoice
 *   N  → new expense  (capital N, since both routes start with "new")
 *   g i → go to invoices    (vim-style chord)
 *   g e → go to expenses
 *   g c → go to clients
 *   g p → go to properties
 *   g a → go to activity log
 *   g d → go to dashboard
 *   ?  → open help modal listing all shortcuts
 *
 * Cmd+K and "/" are owned by CommandPalette — see that component.
 *
 * The g-chord is implemented with a short timeout buffer: press `g`,
 * then press the next letter within 1.5s. This matches GitHub / Linear.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Keyboard, X } from 'lucide-react';
import { ModalBase } from '@/components/ui/ModalBase';

interface Shortcut {
  keys: string;
  description: string;
}

const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: 'Search',
    items: [
      { keys: '⌘K / Ctrl+K', description: 'Open command palette (search anything)' },
      { keys: '/',           description: 'Open command palette' },
    ],
  },
  {
    group: 'Create',
    items: [
      { keys: 'n',           description: 'New invoice' },
      { keys: 'Shift+N',     description: 'New expense' },
    ],
  },
  {
    group: 'Navigate',
    items: [
      { keys: 'g d',         description: 'Dashboard' },
      { keys: 'g i',         description: 'Invoices' },
      { keys: 'g e',         description: 'Expenses' },
      { keys: 'g c',         description: 'Clients' },
      { keys: 'g p',         description: 'Properties' },
      { keys: 'g a',         description: 'Activity log' },
    ],
  },
  {
    group: 'Help',
    items: [
      { keys: '?',           description: 'Open this help' },
      { keys: 'esc',         description: 'Close modals' },
    ],
  },
];

const CHORD_TIMEOUT_MS = 1500;

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  // Tracks the `g` chord buffer. Cleared by timeout or after a chord
  // resolution.
  const chordRef = useRef<{ key: string; clearAt: number } | null>(null);

  const navigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inEditable = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );
      // While the operator is typing in a field, get out of the way.
      if (inEditable) return;
      // Don't fight modifier shortcuts — CommandPalette owns ⌘K / Ctrl+K
      // and we never want to clobber browser actions like ⌘R.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Continuation of a `g _` chord
      const chord = chordRef.current;
      const now = Date.now();
      if (chord && chord.clearAt > now) {
        chordRef.current = null;
        if (chord.key === 'g') {
          const key = e.key.toLowerCase();
          let target: string | null = null;
          if (key === 'i') target = '/billing/invoices';
          else if (key === 'e') target = '/billing/expenses';
          else if (key === 'c') target = '/billing/clients';
          else if (key === 'p') target = '/billing/properties';
          else if (key === 'a') target = '/billing/activity';
          else if (key === 'd') target = '/billing';
          if (target) {
            e.preventDefault();
            navigate(target);
            return;
          }
        }
      }

      // Single-key shortcuts
      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen(true);
      } else if (e.key === 'n') {
        e.preventDefault();
        navigate('/billing/invoices/new');
      } else if (e.key === 'N') {
        e.preventDefault();
        navigate('/billing/expenses/new');
      } else if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        chordRef.current = { key: 'g', clearAt: now + CHORD_TIMEOUT_MS };
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <ModalBase
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      size="lg"
      labelledBy="kbd-help-title"
    >
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
            <Keyboard className="h-4 w-4" />
          </span>
          <div>
            <h2 id="kbd-help-title" className="font-heading text-body font-bold text-primary">Keyboard shortcuts</h2>
            <p className="text-caption text-foreground-muted">Active anywhere in /billing</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(false)}
          aria-label="Close"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream/60"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        {SHORTCUTS.map(grp => (
          <div key={grp.group}>
            <h3 className="text-caption uppercase tracking-widest text-foreground-muted font-semibold mb-2">{grp.group}</h3>
            <dl className="space-y-1.5">
              {grp.items.map(s => (
                <div key={s.keys} className="flex items-center justify-between gap-3">
                  <dt className="text-body-sm text-foreground">{s.description}</dt>
                  <dd>
                    <kbd className="font-mono text-caption px-1.5 py-0.5 rounded border border-border bg-background-cream/60 text-primary">{s.keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </ModalBase>
  );
}
