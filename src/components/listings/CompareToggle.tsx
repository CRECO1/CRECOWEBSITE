'use client';

/**
 * Toggle button to add/remove a listing from the compare shortlist. Stops
 * propagation so it can sit inside a clickable Listing card without
 * triggering the parent navigation.
 */

import { Scale, Check } from 'lucide-react';
import { useCompareList, MAX_COMPARE } from '@/hooks/useCompareList';

interface Props {
  listingId: string;
  /** "icon" = compact icon-only button (for cards). "full" = with label. */
  variant?: 'icon' | 'full';
  className?: string;
}

export function CompareToggle({ listingId, variant = 'icon', className = '' }: Props) {
  const { has, toggle, full } = useCompareList();
  const active = has(listingId);
  const disabled = !active && full;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    toggle(listingId);
  }

  const title = active
    ? 'Remove from compare'
    : disabled
      ? `Compare list full (max ${MAX_COMPARE})`
      : 'Add to compare';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={title}
        aria-label={title}
        aria-pressed={active}
        disabled={disabled}
        className={`inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors ${
          active
            ? 'bg-gold border-gold text-primary'
            : 'bg-white/95 border-white/60 text-primary hover:bg-gold hover:border-gold'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {active ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-body-sm font-semibold transition-colors ${
        active
          ? 'bg-gold border-gold text-primary'
          : 'bg-white border-border text-primary hover:border-gold'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {active ? <><Check className="h-4 w-4" /> Added to compare</> : <><Scale className="h-4 w-4" /> Add to compare</>}
    </button>
  );
}
