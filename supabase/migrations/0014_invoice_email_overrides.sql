-- ============================================================================
-- CRECO – Per-invoice email overrides
--
-- Adds two columns to the invoices table that hold the rendered email
-- subject + body for that specific invoice. NULL means "use the global
-- template at send time" (the existing behavior). Non-NULL means "the
-- admin customized this invoice's email — send these exact strings".
--
-- The send route prefers per-invoice values, falls back to template
-- substitution, falls back to the hard-coded FALLBACK_TEMPLATE.
-- ============================================================================

alter table public.invoices
  add column if not exists email_subject text,
  add column if not exists email_message text;

-- No backfill needed — existing invoices stay NULL → template render at send time.
