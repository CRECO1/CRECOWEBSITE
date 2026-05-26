-- 0025_clients_reminder_cadence_index.sql
--
-- The smart-cadence reminder cron (added in /api/cron/invoice-reminders)
-- pulls every client referenced by an outstanding invoice and reads
-- reminder_cadence. Today's volume is small enough that a sequential scan
-- is fine, but as the client roster grows this query — `SELECT id,
-- reminder_cadence FROM clients WHERE id = ANY($1)` — benefits from an
-- index that lets Postgres skip the full-table read.
--
-- Partial index excludes 'standard' (the default for everyone) so we only
-- index rows the cron actually needs to special-case. Tiny index, fast
-- lookups for the gentle/firm clients without bloating storage for the
-- 95% who are on standard cadence.

CREATE INDEX IF NOT EXISTS clients_reminder_cadence_non_standard_idx
  ON public.clients (reminder_cadence)
  WHERE reminder_cadence IS NOT NULL AND reminder_cadence <> 'standard';
