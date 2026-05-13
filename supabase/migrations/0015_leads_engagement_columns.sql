-- Drop the restrictive source CHECK — the app layer owns valid values now.
-- The old constraint silently rejected legitimate sources like
-- 'tour-request', 'valuation-request', 'owner-inquiry', 'tenant-needs'.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;

-- Same for status — the existing constraint blocked 'tour-scheduled',
-- 'loi-sent', 'lost' which the spec referenced. The app should drive these.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- One-click tour confirmation: broker clicks a tokenized URL in the
-- notification email, we flip the lead to 'tour-scheduled' and email
-- the prospect. The token is one-time-use, consumed on confirm.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tour_confirmed_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tour_confirmation_token text;

-- Valuation drip sequence: Day-3 follow-up cron looks for valuation-request
-- leads created 3+ days ago with no follow-up yet sent.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS valuation_followup_sent_at timestamptz;

-- Unique partial index — lets us look up by token without scanning
-- the whole table, and prevents collision on the (rare) random hex match.
CREATE UNIQUE INDEX IF NOT EXISTS leads_tour_confirmation_token_idx
  ON public.leads (tour_confirmation_token)
  WHERE tour_confirmation_token IS NOT NULL;

-- Index that supports the Day-3 follow-up cron query.
CREATE INDEX IF NOT EXISTS leads_valuation_followup_idx
  ON public.leads (created_at)
  WHERE source = 'valuation-request' AND valuation_followup_sent_at IS NULL;
