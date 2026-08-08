/**
 * Expense shared types + constants. Mirrors src/lib/invoices.ts in shape so
 * the /billing pages can compose both with consistent formatting and math.
 */

import { formatMoney, formatDate } from './invoices';

export interface Expense {
  id: string;
  expense_date: string;        // YYYY-MM-DD
  vendor: string;
  category: string;
  amount: number;
  payment_method: string | null;
  description: string | null;
  receipt_url: string | null;
  property_reference: string | null;
  reimbursable: boolean;
  internal_notes: string | null;
  /** When set, the vendor is a contractor whose 1099 we track. */
  contractor_id: string | null;
  /** Counted toward the year-end 1099-NEC for the linked contractor. */
  is_1099_eligible: boolean;
  /** Optional FK to properties.id — links the expense to a deal for
   *  property-level P&L. Falls back to property_reference (text) when
   *  null, so legacy rows still surface in reports. */
  property_id: string | null;
  /** Soft-delete timestamp. List queries filter on `IS NULL`; the
   *  Trash view sets `IS NOT NULL`. Restored entries set this to NULL. */
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contractor {
  id: string;
  legal_name: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  tax_id_type: 'SSN' | 'EIN' | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Canonical category list — also acts as the dropdown in the create/edit
 * forms. Stored as plain text in the DB so the user can pick "Other" and
 * type their own without a migration. Tailored for a commercial brokerage:
 * the categories should map cleanly to Schedule C lines at tax time.
 */
export const EXPENSE_CATEGORIES = [
  'Marketing & Advertising',
  'Software & Subscriptions',
  'Travel & Mileage',
  'Meals & Client Entertainment',
  'Professional Services',
  'Office & Supplies',
  'Property Operations',
  'Insurance & Licensing',
  'Continuing Education',
  'Other',
] as const;

export const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'ACH',
  'Check',
  'Cash',
  'Wire',
  'Other',
] as const;

/**
 * Colored badge styles per category — same vibe as STATUS_STYLES in
 * invoices.ts. Subtle so the list view doesn't look like a rainbow.
 */
export const CATEGORY_STYLES: Record<string, string> = {
  'Marketing & Advertising':     'bg-purple-50 text-purple-700 border-purple-100',
  'Software & Subscriptions':    'bg-blue-50 text-blue-700 border-blue-100',
  'Travel & Mileage':            'bg-sky-50 text-sky-700 border-sky-100',
  'Meals & Client Entertainment':'bg-amber-50 text-amber-800 border-amber-100',
  'Professional Services':       'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Office & Supplies':           'bg-slate-50 text-slate-700 border-slate-200',
  'Property Operations':         'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Insurance & Licensing':       'bg-rose-50 text-rose-700 border-rose-100',
  'Continuing Education':        'bg-cyan-50 text-cyan-700 border-cyan-100',
  'Other':                       'bg-gray-50 text-gray-600 border-gray-200',
};

export function categoryStyle(category: string): string {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES['Other'];
}

// Re-export the same money/date formatters so /billing pages can pull
// everything from one module without juggling imports.
export { formatMoney, formatDate };
