-- 0022_client_defaults.sql
--
-- Per-client billing defaults. Solves the friction of re-picking the same
-- tax rate / payment terms / reminder cadence on every invoice for a
-- repeat client.
--
-- Columns:
--   default_tax_rate            numeric  — decimal (0.0825 = 8.25%)
--   default_payment_terms       text     — "Net 15", "Net 30", "Due on receipt"
--   reminders_enabled_default   boolean  — whether new invoices for this
--                                          client get reminders by default
--   reminder_cadence            text     — 'standard' (current 6-stage schedule)
--                                          or 'gentle' (skip the early stages
--                                          for trusted slow-payers) or 'firm'
--                                          (an aggressive variant we may add)
--
-- Backward compatible: every column is nullable / has a default, so existing
-- code paths that don't read these continue to work unchanged. The invoice
-- new form will read them when the operator picks a saved client.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS default_tax_rate          numeric,
  ADD COLUMN IF NOT EXISTS default_payment_terms     text,
  ADD COLUMN IF NOT EXISTS reminders_enabled_default boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_cadence          text DEFAULT 'standard';

-- Constraint: reminder_cadence is a small enum. Use a text + check rather
-- than a real enum so it's easy to extend later without a schema change.
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_reminder_cadence_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_reminder_cadence_check
  CHECK (reminder_cadence IN ('standard','gentle','firm'));
