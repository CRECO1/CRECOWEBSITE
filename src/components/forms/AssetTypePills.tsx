'use client';

/**
 * A single row of tappable asset-type pills.
 *
 * The inline alerts card asked for an email and nothing else, so every
 * subscriber arrived with no stated interest. This adds the one question worth
 * asking — office, industrial, retail, flex or land — without turning a
 * one-field card into a form.
 *
 * Friction rules it follows: nothing is required, "All types" is the default
 * and stays selected until a specific type is tapped, tapping the last
 * selected type returns to "All types", and the whole control is one wrapping
 * row with 44px touch targets. A visitor who ignores it entirely still
 * subscribes on one tap of the button.
 */

import { ALERT_ASSET_TYPES } from '@/lib/asset-types';

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
  tone?: 'dark' | 'light';
  /** Shown above the row. Omit on surfaces where the card body already asks. */
  label?: string;
}

export function AssetTypePills({ selected, onChange, tone = 'light', label = 'What are you looking for?' }: Props) {
  const allSelected = selected.length === 0;

  const base = 'inline-flex items-center rounded-full border px-3.5 py-2 text-body-sm font-semibold transition-colors min-h-[38px] cursor-pointer';
  const on = tone === 'dark'
    ? 'bg-gold text-primary border-gold'
    : 'bg-primary text-white border-primary';
  const off = tone === 'dark'
    ? 'bg-white/5 text-white/80 border-white/20 hover:border-gold hover:text-white'
    : 'bg-white text-foreground-muted border-border hover:border-gold hover:text-primary';

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(next);
  }

  return (
    <div className="mb-3">
      {label && (
        <p className={`mb-2 text-caption font-semibold uppercase tracking-wider ${tone === 'dark' ? 'text-white/60' : 'text-foreground-muted'}`}>
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([])}
          aria-pressed={allSelected}
          className={`${base} ${allSelected ? on : off}`}
        >
          All types
        </button>
        {ALERT_ASSET_TYPES.map(t => {
          const isOn = selected.includes(t.value);
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => toggle(t.value)}
              aria-pressed={isOn}
              className={`${base} ${isOn ? on : off}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
