'use client';

/**
 * Shared modal scaffolding. Every modal in the app uses the same:
 *   - Fixed full-viewport backdrop with click-to-close
 *   - role="dialog" aria-modal="true" markup
 *   - Escape-to-close keyboard handler
 *   - Focus trap (Tab/Shift+Tab cycle inside the dialog)
 *   - z-50 stacking so it always wins over MobileStickyCTA / CompareBar
 *
 * Before this component existed, that whole pattern was copy-pasted into
 * each modal — drift was inevitable (different backdrop opacities, missing
 * focus traps, inconsistent escape handlers). Now consumers only own the
 * content: header, body, footer, sizing.
 *
 * The wrapper renders nothing when `open` is false so consumers can mount
 * <ModalBase /> unconditionally in their JSX and just toggle `open`.
 *
 * `disableClose` exists for in-flight states — a Cancel button is
 * disabled while a POST is in flight, and the backdrop / Escape should
 * follow the same rule. Setting this true makes both no-ops until you
 * flip it back.
 *
 * `size` picks a `max-w-*` token. Defaults to `md`. The actual width is
 * `w-full` capped at that max — fits any viewport down to phones.
 *
 * Content is `position: relative` inside an already-positioned overlay,
 * so consumers can position an absolute close button at `right-3 top-3`
 * if they want a corner X. Most do.
 */

import { useRef } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** When true, backdrop click and Escape are no-ops. Use during an in-flight POST. */
  disableClose?: boolean;
  size?: ModalSize;
  /** ID of the element that titles the dialog (for aria-labelledby). */
  labelledBy?: string;
  /** Optional inner-dialog className override — for cases like an inline
   *  invoice mark-paid modal that wants extra y-margin so it scrolls in a
   *  long viewport. Caller styles win. */
  innerClassName?: string;
  /** Backdrop opacity / blur tweak. Default is bg-black/55 backdrop-blur-sm
   *  which matches the prevailing app treatment. */
  backdropClassName?: string;
  children: React.ReactNode;
}

export function ModalBase({
  open, onClose, disableClose, size = 'md',
  labelledBy, innerClassName, backdropClassName, children,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape-to-close. Gated on !disableClose so a mid-write keypress doesn't
  // tear down state while a request is in flight (consumer handles the
  // re-enable when it finishes).
  useEscapeKey(() => { if (!disableClose) onClose(); }, open);

  // Trap focus inside the dialog while it's open so Tab can't escape onto
  // the page underneath. Engages only when open.
  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center backdrop-blur-sm p-4 sm:p-8 overflow-y-auto',
        backdropClassName ?? 'bg-black/55',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={() => { if (!disableClose) onClose(); }}
    >
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl my-8 overflow-hidden',
          SIZE_CLASS[size],
          innerClassName,
        )}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
