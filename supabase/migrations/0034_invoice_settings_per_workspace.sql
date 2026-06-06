-- ============================================================================
-- invoice_settings — refactor from singleton (id=1) to per-workspace
-- ============================================================================
-- The original schema (migration 0011) was deliberately a one-row table:
--   id integer primary key check (id = 1)
-- That worked for single-tenant CRECO. Now that multi-tenancy is live,
-- each workspace needs its own row holding its own W-9, email template,
-- and late-fee config. This migration:
--
--   1. Drops the id=1 check constraint.
--   2. Drops the id column entirely — it carries no information now
--      that there's exactly one row per workspace and workspace_id is
--      the unique key.
--   3. Makes workspace_id the primary key (it's already NOT NULL with a
--      FK + an index from migration 0032).
--
-- After this, /api/onboard can insert a fresh invoice_settings row per
-- new workspace without colliding on id, and the settings page queries
-- by workspace_id instead of id=1.
--
-- The CRECO row (currently id=1, workspace_id=<creco_uuid>) is preserved
-- through the column drop — Postgres keeps row data when a column is
-- dropped; only its identifier disappears.
-- ============================================================================

-- 1. Drop the check constraint (idempotent — check both the legacy name
--    Postgres might have auto-generated and the explicit one some envs use).
alter table public.invoice_settings
  drop constraint if exists invoice_settings_id_check;

-- 2. Drop the existing primary key so we can swap it.
alter table public.invoice_settings
  drop constraint if exists invoice_settings_pkey;

-- 3. Drop the id column. The CRECO row's data (subject, message, W-9,
--    late-fee config) is preserved — only the id identifier disappears.
alter table public.invoice_settings
  drop column if exists id;

-- 4. workspace_id becomes the new primary key. Guarantees exactly one
--    row per workspace, satisfies upsert(onConflict='workspace_id'),
--    and gives Postgres a clustered index on the lookup key.
alter table public.invoice_settings
  add primary key (workspace_id);
