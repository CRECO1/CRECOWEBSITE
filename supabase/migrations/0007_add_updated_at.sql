-- ============================================================================
-- CRECO – Add missing updated_at columns to testimonials + leads
--
-- The admin save handler always tags an `updated_at` field on update payloads.
-- Tables without that column reject writes silently with a schema-cache error.
-- This adds the column + trigger to both, so admin edits persist correctly.
-- ============================================================================

alter table public.testimonials
  add column if not exists updated_at timestamptz not null default now();

alter table public.leads
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  create trigger testimonials_set_updated_at
    before update on public.testimonials
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger leads_set_updated_at
    before update on public.leads
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
