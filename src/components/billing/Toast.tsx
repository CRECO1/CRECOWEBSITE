'use client';

/**
 * Toast system for the billing surface. Lightweight context + bottom-
 * right stack. The motivating use case is "I just void'd / mark-paid'd
 * the wrong invoice — give me 6 seconds to undo it." Saves the operator
 * a navigate-and-restore loop on self-inflicted mistakes.
 *
 * Pattern:
 *   const toast = useToast();
 *   toast.show({
 *     message: 'Marked INV-001 as paid.',
 *     undo: async () => { ...revert the change... },
 *     durationMs: 6000,
 *   });
 *
 * The toast component handles its own dismiss timer. Undo button stops
 * the timer + calls the callback + dismisses on success. If the
 * operator never clicks undo, the toast auto-dismisses.
 *
 * Stack: max 3 visible at a time. New toasts replace the oldest. Each
 * has its own auto-dismiss timer.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Undo2, X, CheckCircle2 } from 'lucide-react';

interface ToastInput {
  /** Short status line. e.g. "Marked INV-001 as paid." */
  message: string;
  /** When provided, the toast renders an Undo button. The callback
   *  should reverse the mutation. Failure should display its own
   *  toast/error; this system doesn't handle errors from undo. */
  undo?: () => Promise<void> | void;
  /** Auto-dismiss delay. Default 6 seconds — long enough for a
   *  thoughtful undo, short enough not to pile up. */
  durationMs?: number;
  /** Optional visual variant. */
  variant?: 'success' | 'info';
}

interface ToastEntry extends Required<Omit<ToastInput, 'undo'>> {
  id: string;
  undo?: () => Promise<void> | void;
}

interface ToastContextValue {
  show: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Outside the provider — return a no-op so consumers don't need to
    // null-check. This happens during SSR before hydration, and in
    // hypothetical out-of-tree usage.
    return { show: () => { /* noop */ } };
  }
  return ctx;
}

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const show = useCallback((input: ToastInput) => {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const entry: ToastEntry = {
      id,
      message: input.message,
      durationMs: input.durationMs ?? 6000,
      variant: input.variant ?? 'success',
      undo: input.undo,
    };
    setToasts(prev => {
      // Cap the stack — older toasts age out first.
      const next = [...prev, entry];
      if (next.length > MAX_VISIBLE) return next.slice(next.length - MAX_VISIBLE);
      return next;
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastView key={t.id} entry={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ entry, onDismiss }: { entry: ToastEntry; onDismiss: (id: string) => void }) {
  const [undoing, setUndoing] = useState(false);
  const dismissedRef = useRef(false);

  // Auto-dismiss timer. Skipped when an undo is in flight so the
  // operator's click doesn't race a fade-out.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!dismissedRef.current) onDismiss(entry.id);
    }, entry.durationMs);
    return () => clearTimeout(t);
  }, [entry.id, entry.durationMs, onDismiss]);

  async function handleUndo() {
    if (!entry.undo || undoing) return;
    setUndoing(true);
    try {
      await entry.undo();
    } finally {
      setUndoing(false);
      dismissedRef.current = true;
      onDismiss(entry.id);
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-white shadow-lg px-4 py-2.5 min-w-[280px] max-w-md animate-fade-in"
    >
      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
      <p className="text-body-sm text-primary flex-1">{entry.message}</p>
      {entry.undo && (
        <button
          type="button"
          onClick={handleUndo}
          disabled={undoing}
          className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/5 px-2.5 py-1 text-caption font-semibold text-gold-dark hover:bg-gold/10 disabled:opacity-60"
        >
          <Undo2 className="h-3 w-3" />
          {undoing ? 'Undoing…' : 'Undo'}
        </button>
      )}
      <button
        type="button"
        onClick={() => { dismissedRef.current = true; onDismiss(entry.id); }}
        aria-label="Dismiss"
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted hover:text-primary hover:bg-background-cream/60"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
