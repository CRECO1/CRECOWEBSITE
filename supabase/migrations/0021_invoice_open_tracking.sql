-- ============================================================================
-- Invoice email open tracking
-- ============================================================================
-- Resend has built-in open + click tracking. When the domain has it
-- enabled, Resend rewrites image URLs in the sent email and fires
-- webhook events as those tracked images load (or links get clicked).
--
-- This migration adds:
--   1. A column on `invoices` for the latest send's Resend message_id,
--      so we can correlate webhook events back to the invoice.
--   2. Roll-up columns on `invoices` for the most common queries (was
--      it opened, when, how many times) — so the UI doesn't have to
--      JOIN every render.
--   3. A full event log table so we can show a timeline + power any
--      future "click maps", "bounce reports", etc.
--
-- The cron reminders table already stores the Resend message_id in
-- `invoice_reminders.email_id`, so reminder events get attributed to
-- the right invoice via that link.

alter table public.invoices
  add column if not exists last_email_message_id text,
  add column if not exists first_opened_at       timestamptz,
  add column if not exists last_opened_at        timestamptz,
  add column if not exists open_count            integer not null default 0;

create index if not exists invoices_last_email_message_id_idx
  on public.invoices (last_email_message_id)
  where last_email_message_id is not null;

create table if not exists public.invoice_email_events (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id) on delete cascade,
  -- Resend's email id from the send response (also the value in
  -- webhook payloads under `data.email_id`).
  message_id    text not null,
  -- Resend event types we care about. Untyped string here in case
  -- Resend adds new ones — we don't want to drop unknown events.
  event_type    text not null,
  occurred_at   timestamptz not null,
  recipient_email text,
  user_agent    text,
  ip_address    text,
  -- Full webhook body for forensics in case we need to debug a
  -- specific event later.
  raw           jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists invoice_email_events_invoice_time_idx
  on public.invoice_email_events (invoice_id, occurred_at desc);
create index if not exists invoice_email_events_message_id_idx
  on public.invoice_email_events (message_id);
-- Dedup safety net: Resend retries webhooks, so the same (message_id,
-- event_type, occurred_at) tuple must not insert twice.
create unique index if not exists invoice_email_events_dedup_idx
  on public.invoice_email_events (message_id, event_type, occurred_at);

alter table public.invoice_email_events enable row level security;
drop policy if exists "admin_can_all_invoice_email_events" on public.invoice_email_events;
create policy "admin_can_all_invoice_email_events"
  on public.invoice_email_events for all to authenticated using (true) with check (true);
