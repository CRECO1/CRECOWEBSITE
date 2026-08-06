-- 0042_recurring_invoice_dedup.sql
--
-- Backstop against double-generating a recurring invoice for the same
-- period. The app advances recurring_invoice_templates.next_run_date after
-- each generation, but that guard isn't concurrency-safe: the daily cron
-- and a manual "Generate now" (which ignores next_run_date) can fire the
-- same day, a double-clicked button can fire twice, or the advance write
-- can fail after the invoice is created. Any of those would create a
-- second invoice — and, for send_immediately templates, send a second
-- email — for the same billing period.
--
-- This partial unique index makes the DB reject a second invoice for the
-- same (recurring_template_id, issue_date), turning a would-be
-- double-bill/double-email into a rejected insert. Manual one-off invoices
-- (recurring_template_id IS NULL) are excluded by the partial predicate, so
-- normal ad-hoc invoicing is unaffected.
--
-- Applied to the live DB alongside this commit.

create unique index if not exists invoices_recurring_template_period_uidx
  on public.invoices (recurring_template_id, issue_date)
  where recurring_template_id is not null;
