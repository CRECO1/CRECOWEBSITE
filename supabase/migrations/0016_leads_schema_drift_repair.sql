-- Repair schema drift between the migration files and what production has.
-- The /api/inquiry route writes to `intake_data` (per migration 0001) but
-- production has it as `quiz_data` — silent dropped data on every inquiry
-- submission. Rename it to match the code.
ALTER TABLE public.leads RENAME COLUMN quiz_data TO intake_data;

-- The /api/leads route accepts a `company` field (and src/lib/supabase.ts
-- reads it back when rendering the leads list) but the column was never
-- added in production. Every contact-form lead that included a company
-- value silently dropped it. Add it.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company text;
