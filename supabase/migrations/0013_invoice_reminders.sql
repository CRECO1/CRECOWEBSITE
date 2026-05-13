-- ============================================================================
-- CRECO – Invoice payment reminders
--
-- Adds:
--   1. `reminders_enabled` toggle on invoices (per-invoice opt-out)
--   2. `invoice_reminders` log table — one row per reminder sent, with a
--      unique constraint on (invoice_id, stage) so the cron can't double-send
--
-- The actual schedule lives in code (src/lib/invoice-reminders.ts): six
-- stages — due-soon (T-7), due-today, overdue-3, overdue-7, overdue-14,
-- overdue-30 — sent at most once per invoice each. The cron route checks
-- the log table before sending.
-- ============================================================================

-- Per-invoice opt-out. Default true so existing invoices auto-enroll.
alter table public.invoices
  add column if not exists reminders_enabled boolean not null default true;

create table if not exists public.invoice_reminders (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id) on delete cascade,
  stage         text not null
                check (stage in (
                  'due-soon',     -- T-7 (7 days before due date)
                  'due-today',    -- T+0 (day the invoice is due)
                  'overdue-3',    -- T+3
                  'overdue-7',    -- T+7
                  'overdue-14',   -- T+14
                  'overdue-30'    -- T+30 (final escalation; cron stops after this)
                )),
  sent_at       timestamptz not null default now(),
  -- Resend message ID for tracking (open/click stats land in Resend)
  email_id      text,
  created_at    timestamptz not null default now()
);

-- One reminder per (invoice, stage). The cron's INSERT ... ON CONFLICT DO
-- NOTHING relies on this — if we miss a day and try to send the same stage
-- tomorrow, the unique index blocks the duplicate.
create unique index if not exists invoice_reminders_invoice_stage_unique
  on public.invoice_reminders (invoice_id, stage);

create index if not exists invoice_reminders_sent_at_idx
  on public.invoice_reminders (sent_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.invoice_reminders enable row level security;

drop policy if exists "authenticated read invoice_reminders"   on public.invoice_reminders;
drop policy if exists "authenticated insert invoice_reminders" on public.invoice_reminders;
drop policy if exists "authenticated delete invoice_reminders" on public.invoice_reminders;

create policy "authenticated read invoice_reminders"
  on public.invoice_reminders for select to authenticated using (true);
create policy "authenticated insert invoice_reminders"
  on public.invoice_reminders for insert to authenticated with check (true);
create policy "authenticated delete invoice_reminders"
  on public.invoice_reminders for delete to authenticated using (true);

-- Note: the cron job uses the service_role key to bypass RLS for system writes.
-- service_role is server-side only; never expose it to the browser.
