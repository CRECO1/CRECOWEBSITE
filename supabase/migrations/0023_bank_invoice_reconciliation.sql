-- 0023_bank_invoice_reconciliation.sql
--
-- Link bank transactions back to the invoices they pay. The existing
-- bank_transactions table already has status='reconciled' as a sentinel
-- but no FK column — so we couldn't show "this deposit paid INV-456"
-- anywhere on the UI.
--
-- After this migration the operator can:
--   * see suggested invoice matches for an inflow (amount + date proximity)
--   * one-click apply: marks the invoice paid + flips the txn to reconciled
--   * trace the linkage in both directions (invoice detail + bank txn row)
--
-- Nullable + ON DELETE SET NULL because invoices and bank transactions
-- have independent lifecycles — voiding an invoice shouldn't cascade-
-- delete its bank record, and deleting a bank record shouldn't nuke
-- the invoice's payment history.

ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS reconciled_invoice_id uuid
  REFERENCES public.invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bank_transactions_reconciled_invoice_idx
  ON public.bank_transactions(reconciled_invoice_id)
  WHERE reconciled_invoice_id IS NOT NULL;
