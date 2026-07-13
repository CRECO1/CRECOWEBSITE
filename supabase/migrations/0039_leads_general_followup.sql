-- General lead follow-up column.
--
-- Adds `general_followup_sent_at` to leads so the new /api/cron/lead-followup
-- job (T+24hr generic nudge with 2-3 similar listings + broker calendar link)
-- can gate every lead to exactly one send. Distinct from `valuation_followup_sent_at`
-- (Day-3 nudge specific to valuation requests) so the two sequences never
-- conflict — a valuation lead can receive both if the timing works out,
-- and neither can double-send.
--
-- Backfill: no. Existing leads older than 24 hours are past the follow-up
-- window anyway; leaving general_followup_sent_at NULL on them means they
-- won't get retroactively followed up (which is correct — we don't want to
-- surprise 2-week-old leads with a stale "checking in" email).

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS general_followup_sent_at timestamptz;

-- Partial index — only rows where the follow-up hasn't fired yet. Speeds
-- up the daily cron query that filters to
-- `created_at BETWEEN t-30h AND t-20h AND general_followup_sent_at IS NULL`.
-- Since general_followup_sent_at flips from NULL to a timestamp exactly
-- once and stays set, a partial index on the NULL rows keeps the working
-- set small even as the total leads table grows.
CREATE INDEX IF NOT EXISTS leads_pending_general_followup_idx
  ON public.leads (created_at)
  WHERE general_followup_sent_at IS NULL;
