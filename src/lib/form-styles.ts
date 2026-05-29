/**
 * Shared Tailwind class strings for form-field styling. Before this file
 * existed, every billing/admin form re-declared `const inputCls = "..."`
 * at the bottom of its module — 7 copies in two slightly different
 * variants (one used `focus:border-gold`, another `focus:border-primary`;
 * one used `rounded-lg`, another `rounded-md`). Visual drift inevitable.
 *
 * The `<Input />` component in src/components/ui is the right call when
 * you want a labeled, error-aware form field. These tokens are for the
 * cases where you need raw `<input>` / `<textarea>` / `<select>` with
 * the same look — modals, inline filter bars, tables with editable
 * cells, etc.
 *
 * Keep this file lean. If you find yourself adding a 5th variant, ask
 * whether `<Input />` should grow new props instead.
 */

/**
 * Standard input height + border + focus styling for billing/admin
 * forms. Use on `<input>`, `<select>`, `<textarea>`. Matches the
 * surface treatment of `<Input />` for visual consistency.
 */
export const formInputCls =
  'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20';

/**
 * Label that sits above a form field. Mirrors the `<Input />` label
 * treatment — caption-size, uppercase, gold-tinged muted for hierarchy.
 */
export const formLabelCls =
  'block text-caption uppercase tracking-widest text-foreground-muted mb-1.5';
