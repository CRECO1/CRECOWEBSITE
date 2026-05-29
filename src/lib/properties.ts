/**
 * Property / deal records — the CRE-specific tagging layer that turns
 * the flat invoice + expense ledger into a per-property P&L story.
 *
 * Backed by public.properties (migration 0027). Invoices and expenses
 * carry an optional property_id FK; legacy rows without an FK still
 * surface through the free-form `property_reference` text field.
 *
 * Status enum drives the picker UX:
 *   - 'active'    — currently working this property / deal
 *   - 'closed'    — deal done; keep visible for historical P&L roll-up
 *   - 'inactive'  — paused; hide from new-invoice picker but show on
 *                   reports
 *
 * Soft delete uses `deleted_at` — a deleted property is fully hidden
 * from the picker but historical invoices/expenses still display the
 * snapshot name via JOIN (or property_reference fallback).
 */

export type PropertyStatus = 'active' | 'closed' | 'inactive';

export type PropertyType =
  | 'retail'
  | 'office'
  | 'industrial'
  | 'flex'
  | 'land'
  | 'mixed-use'
  | 'multifamily'
  | 'other';

export interface Property {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_type: PropertyType | null;
  status: PropertyStatus;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Trimmed shape for the picker dropdown — just enough to render. */
export interface PropertyLite {
  id: string;
  name: string;
  address: string | null;
  status: PropertyStatus;
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'retail',      label: 'Retail' },
  { value: 'office',      label: 'Office' },
  { value: 'industrial',  label: 'Industrial / Warehouse' },
  { value: 'flex',        label: 'Flex' },
  { value: 'land',        label: 'Land' },
  { value: 'mixed-use',   label: 'Mixed-Use' },
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'other',       label: 'Other' },
];

export const PROPERTY_STATUS_STYLES: Record<PropertyStatus, { label: string; className: string }> = {
  active:   { label: 'Active',   className: 'bg-green-50 text-green-800 border-green-200' },
  closed:   { label: 'Closed',   className: 'bg-blue-50 text-blue-800 border-blue-200' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-700 border-gray-300' },
};

/**
 * Build the friendly display string for a property — name with optional
 * city in parens. Used in pickers, property cards, P&L headers.
 */
export function formatPropertyLabel(p: { name: string; city: string | null } | PropertyLite | null | undefined): string {
  if (!p) return '—';
  const city = 'city' in p ? p.city : null;
  return city ? `${p.name} (${city})` : p.name;
}
