-- ============================================================================
-- Workspaces — multi-tenancy foundation for the VultStack billing add-on
-- ============================================================================
-- Story: today the billing surface is single-tenant. Every row implicitly
-- belongs to the CRECO workspace; admin_users gates access at the email
-- level. To sell this as a SaaS add-on to other brokerages, every billing
-- row needs to be scoped to a workspace, and access decisions need to be
-- "is this user a member of THIS workspace?" — not "is this user any kind
-- of admin?".
--
-- This migration is intentionally additive and behavior-preserving:
--   - Creates the workspaces + workspace_members tables.
--   - Creates the is_workspace_member(uuid) helper.
--   - Seeds the CRECO workspace + adds zack@crecotx.com as its admin.
--   - Does NOT touch existing billing-table policies. Those still gate
--     on is_billing_admin() and continue to work exactly as before.
--
-- The actual cutover (replacing is_billing_admin() with is_workspace_member()
-- everywhere) happens in migration 0033 AFTER the app code is updated to
-- pass workspace_id on every query. Migration 0032 adds the workspace_id
-- columns in between.
--
-- Sequence:
--   0031 — this file — add tables + helper + seed (SAFE; no behavior change)
--   0032 — add workspace_id columns + backfill (SAFE; policies don't read it)
--   <app code update + deploy>
--   0033 — flip RLS policies to workspace-scoped (CUTOVER)
-- ============================================================================

-- ── workspaces ──────────────────────────────────────────────────────────────
-- One row per customer brokerage. Slug is the public identifier (used in
-- URLs, storage paths, email signatures). owner_email is the canonical
-- "billable contact" — usually the broker who signed up. Stripe fields
-- get populated when subscription billing is wired in (Step 6 of the
-- rough sequence — not now).

create table if not exists public.workspaces (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text unique not null,
  name                    text not null,
  owner_email             text not null,
  -- Stripe Billing fields — null until the workspace is on a paid plan.
  -- We're shipping the SaaS without billing wired yet; these get
  -- populated in Step 6.
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text default 'trial',
  trial_ends_at           timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Slug constraint — URL-safe, lowercase, hyphens. We're permissive on
-- length to allow long brokerage names like "lee-and-associates-dallas".
alter table public.workspaces
  drop constraint if exists workspaces_slug_format;
alter table public.workspaces
  add constraint workspaces_slug_format
  check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$');

-- Subscription status enum — soft, can extend later.
alter table public.workspaces
  drop constraint if exists workspaces_subscription_status_check;
alter table public.workspaces
  add constraint workspaces_subscription_status_check
  check (subscription_status in ('trial','active','past_due','canceled','paused'));

-- updated_at trigger (reuses existing helper if present, otherwise creates one).
do $$ begin
  if not exists (select 1 from pg_proc where proname = 'tg_set_updated_at') then
    create function public.tg_set_updated_at() returns trigger language plpgsql as $fn$
      begin new.updated_at = now(); return new; end;
    $fn$;
  end if;
end $$;

drop trigger if exists tg_workspaces_updated_at on public.workspaces;
create trigger tg_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.tg_set_updated_at();

-- ── workspace_members ──────────────────────────────────────────────────────
-- Many-to-many: a user can belong to multiple workspaces. In practice
-- most members only belong to one (their employer's). The role column
-- is currently just 'admin'; future roles like 'agent', 'viewer',
-- 'accountant' get added here without schema migration.

create table if not exists public.workspace_members (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- email is denormalized here so the RLS helper can match against
  -- auth.jwt() ->> 'email' without joining auth.users (which is in a
  -- different schema with restrictive permissions).
  email         text not null,
  role          text not null default 'admin',
  joined_at     timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspace_members
  drop constraint if exists workspace_members_role_check;
alter table public.workspace_members
  add constraint workspace_members_role_check
  check (role in ('admin','agent','viewer','accountant'));

create index if not exists workspace_members_email_idx
  on public.workspace_members (lower(email));
create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id);

-- ── is_workspace_member helper ──────────────────────────────────────────────
-- SECURITY DEFINER so RLS policies can call it without granting select
-- on workspace_members to everyone. search_path locked to neutralize
-- function-injection attacks (same pattern as is_billing_admin).
--
-- Match key: lower(auth.jwt() ->> 'email') against lower(email). This
-- mirrors is_billing_admin so the two functions can coexist during the
-- migration window without operator-visible differences.

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = ws_id
      and lower(wm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

comment on function public.is_workspace_member(uuid) is
  'Returns true when the current JWT email is a member of the given '
  'workspace. Used by RLS policies on every billing table to gate '
  'access to workspace-scoped data. SECURITY DEFINER so the lookup '
  'bypasses RLS on workspace_members; search_path locked to neutralize '
  'function-injection.';

-- ── current_user_workspace helper ──────────────────────────────────────────
-- Returns the first workspace the current JWT user belongs to. Used by
-- the app layer (via PostgREST RPC) to seed the workspace context on
-- login. When a user belongs to multiple workspaces a switcher UI picks
-- one; this just gives a safe default.

create or replace function public.current_user_workspace()
returns table (
  workspace_id  uuid,
  workspace_slug text,
  workspace_name text,
  role          text
)
language sql stable security definer
set search_path = public, pg_catalog
as $$
  select w.id, w.slug, w.name, wm.role
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id
  where lower(wm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by wm.joined_at asc
  limit 1;
$$;

revoke all on function public.current_user_workspace() from public;
grant execute on function public.current_user_workspace() to authenticated;

-- ── RLS on the new tables ──────────────────────────────────────────────────
-- workspaces: members can read their own workspaces. Inserts/updates
-- restricted to service_role for now (workspace creation happens via
-- the onboarding API route, not directly from the client).
--
-- workspace_members: same — read-your-own, no client writes. Membership
-- changes go through admin operations on the server.

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "members can read their workspaces" on public.workspaces;
create policy "members can read their workspaces" on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

drop policy if exists "members can read their memberships" on public.workspace_members;
create policy "members can read their memberships" on public.workspace_members
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ── Seed the CRECO workspace + the broker as its admin ──────────────────────
-- Idempotent: conflict-tolerant on both the workspace slug and the
-- member primary key. Safe to re-run.

insert into public.workspaces (slug, name, owner_email, subscription_status, trial_ends_at)
values ('creco', 'CRECO', 'zack@crecotx.com', 'active', null)
on conflict (slug) do nothing;

-- Add zack as admin member of CRECO. Pulls the user_id from auth.users
-- by email; falls back to a NULL match if the user doesn't exist (which
-- would skip the insert harmlessly).
insert into public.workspace_members (workspace_id, user_id, email, role)
select w.id, u.id, u.email, 'admin'
from public.workspaces w
join auth.users u on lower(u.email) = lower(w.owner_email)
where w.slug = 'creco'
on conflict do nothing;
