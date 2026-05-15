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
  created_at: string;
  updated_at: string;
}

export interface ClientLite {
  id: string;
  name: string;
  email: string;
  company: string | null;
  address: string | null;
  property_reference: string | null;
}
