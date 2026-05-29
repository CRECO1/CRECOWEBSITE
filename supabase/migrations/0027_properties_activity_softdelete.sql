-- 0027_properties_activity_softdelete.sql
--
-- Three accounting upgrades landing as one migration:
--
--   1. `properties` table — CRE-specific tagging so the operator can
--      answer "what's my P&L on 8000 Fair Oaks Pkwy?" or "how much did
--      the Lakewood development cost us in legal fees?". Without this,
--      every invoice + expense lives in one flat ledger and the
--      property-level story has to be re-built in a spreadsheet.
--
--   2. Soft delete (`deleted_at`) on invoices + expenses. Self-inflicted
--      mistakes — fat-finger voids, wrong payment dates, hastily-deleted
--      expenses — are the #1 admin pain point in any solo accounting
--      tool. Hard deletes leave no recovery; soft deletes give us an
--      undo button.
--
--   3. `activity_log` table — answers "what changed and when" across
--      invoices, expenses, clients, and properties. Powers a dashboard
--      activity feed and forensic lookups when something goes sideways.
--
-- All additions are nullable / additive so legacy rows continue to work
-- pre-population. The application code reads `property_reference` (text)
-- as a fallback when `property_id` is null.

-- ────────────────────────────────────────────────────────────────────
-- 1. properties table
-- ────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

create table if not exists public.properties (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text,
  city            text,
  state           text,
  zip             text,
  property_type   text,
  -- Deal lifecycle. Operator can hide closed/sold from active pickers
  -- while preserving historical P&L attribution.
  status          text not null default 'active',
  notes           text,
  -- Soft delete: pickers + lists filter on `deleted_at is null`. Hard
  -- delete reserved for never-used rows or via janitor cron.
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists properties_status_idx
  on public.properties(status)
  where deleted_at is null;

create index if not exists properties_name_idx
  on public.properties(name)
  where deleted_at is null;

-- RLS — operator-only access. Matches the pattern used by invoices.
alter table public.properties enable row level security;

drop policy if exists "properties auth select" on public.properties;
drop policy if exists "properties auth insert" on public.properties;
drop policy if exists "properties auth update" on public.properties;
drop policy if exists "properties auth delete" on public.properties;

create policy "properties auth select" on public.properties for select to authenticated using (true);
create policy "properties auth insert" on public.properties for insert to authenticated with check (true);
create policy "properties auth update" on public.properties for update to authenticated using (true) with check (true);
create policy "properties auth delete" on public.properties for delete to authenticated using (true);

-- updated_at trigger so the operator can see staleness in lists
create or replace function public.touch_properties_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists properties_touch_updated_at on public.properties;
create trigger properties_touch_updated_at
  before update on public.properties
  for each row execute function public.touch_properties_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 2. property_id + deleted_at on invoices + expenses
-- ────────────────────────────────────────────────────────────────────

alter table public.invoices
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists deleted_at  timestamptz;

alter table public.expenses
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists deleted_at  timestamptz;

-- Partial indexes — only the live rows participate in most reads.
create index if not exists invoices_property_id_active_idx
  on public.invoices(property_id) where deleted_at is null and property_id is not null;
create index if not exists invoices_deleted_at_idx
  on public.invoices(deleted_at) where deleted_at is not null;

create index if not exists expenses_property_id_active_idx
  on public.expenses(property_id) where deleted_at is null and property_id is not null;
create index if not exists expenses_deleted_at_idx
  on public.expenses(deleted_at) where deleted_at is not null;

-- ────────────────────────────────────────────────────────────────────
-- 3. activity_log
-- ────────────────────────────────────────────────────────────────────

create table if not exists public.activity_log (
  id            uuid primary key default gen_random_uuid(),
  -- Actor: usually a Supabase user, occasionally null for system events
  -- (e.g. the late-fee cron applying a fee). Email denormalized so we
  -- can still show "zach@crecotx.com" after the auth user is deleted.
  actor_id      uuid,
  actor_email   text,
  -- Action enum: short imperative verbs ('created','updated','sent',
  -- 'marked_paid','voided','deleted','restored','reminder_sent',
  -- 'late_fee_applied','payment_recorded'). CHECK keeps the set tight.
  action        text not null,
  -- Entity references — entity_type + entity_id pair. entity_type is
  -- one of ('invoice','expense','client','property','contractor',
  -- 'recurring_template') so the feed can route clicks back to the
  -- right detail page.
  entity_type   text not null,
  entity_id     uuid not null,
  -- Friendly label denormalized at log time so the feed renders
  -- correctly even after the entity has been edited / soft-deleted.
  entity_label  text,
  -- Optional structured payload — old + new values for an edit,
  -- amount + method for a payment, etc. Kept loose by design.
  diff          jsonb,
  created_at    timestamptz not null default now()
);

alter table public.activity_log
  drop constraint if exists activity_log_action_check;
alter table public.activity_log
  add constraint activity_log_action_check check (action in (
    'created','updated','sent','marked_paid','voided','deleted',
    'restored','reminder_sent','late_fee_applied','payment_recorded',
    'duplicated','reopened'
  ));

alter table public.activity_log
  drop constraint if exists activity_log_entity_type_check;
alter table public.activity_log
  add constraint activity_log_entity_type_check check (entity_type in (
    'invoice','expense','client','property','contractor','recurring_template'
  ));

-- Indexes:
--   - feed query: ORDER BY created_at DESC LIMIT 50
--   - entity lookup: WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at DESC
create index if not exists activity_log_created_at_idx
  on public.activity_log(created_at desc);
create index if not exists activity_log_entity_idx
  on public.activity_log(entity_type, entity_id, created_at desc);
create index if not exists activity_log_actor_idx
  on public.activity_log(actor_id, created_at desc) where actor_id is not null;

alter table public.activity_log enable row level security;

-- Read: any authenticated operator.
-- Insert: any authenticated operator. RLS enforces actor_id = auth.uid()
-- so a logged-in user can't impersonate another. NULL allowed for
-- service-role inserts (system actions like the cron).
-- Update/Delete: nobody. Log is append-only by design.

drop policy if exists "activity_log auth select" on public.activity_log;
drop policy if exists "activity_log auth insert" on public.activity_log;

create policy "activity_log auth select" on public.activity_log
  for select to authenticated using (true);

create policy "activity_log auth insert" on public.activity_log
  for insert to authenticated
  with check (actor_id is null or actor_id = auth.uid());
