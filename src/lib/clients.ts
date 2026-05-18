/**
 * Reusable billing-side clients. The canonical record for "who do we
 * invoice" — distinct from CRM contacts and from 1099 contractors.
 *
 * Invoices and recurring templates carry a denormalized snapshot of the
 * client fields (so a deleted/edited client doesn't change historical
 * bills) plus an optional client_id pointing here for the typeahead +
 * "auto-fill last-known address" workflow.
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  address: string | null;
  phone: string | null;
  property_reference: string | null;
  notes: string | null;
  active: boolean;
  // Per-client billing defaults (added in migration 0022). Prefills the
  // /billing/invoices/new form when the operator picks this client from
  // the typeahead. All nullable so unknown values fall back to global
  // defaults (8.25% / Net 30 / standard reminder schedule).
  default_tax_rate: number | null;          // decimal, 0.0825 = 8.25%
  default_payment_terms: string | null;
  reminders_enabled_default: boolean | null;
  reminder_cadence: ReminderCadence | null;
  // Client portal token (added in migration 0024). Each client gets a
  // stable UUID that authenticates them at /client/[token]. Anyone with
  // the URL can view that client's invoices + payment history. Rotate
  // by setting portal_token = gen_random_uuid().
  portal_token: string;
  created_at: string;
  updated_at: string;
}

export type ReminderCadence = 'standard' | 'gentle' | 'firm';

export interface ClientLite {
  id: string;
  name: string;
  email: string;
  company: string | null;
  address: string | null;
  property_reference: string | null;
  // Defaults sent down with the typeahead pick so the invoice form can
  // prefill without an extra round-trip to /api/clients/[id].
  default_tax_rate: number | null;
  default_payment_terms: string | null;
  reminders_enabled_default: boolean | null;
  reminder_cadence: ReminderCadence | null;
}
