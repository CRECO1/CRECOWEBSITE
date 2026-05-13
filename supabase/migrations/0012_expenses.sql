-- ============================================================================
-- CRECO – Expenses
--
-- Records of money the firm spends — vendor, category, amount, payment
-- method, optional property attribution, optional receipt URL. Sits next
-- to `invoices` (revenue) so the /billing dashboard can show revenue,
-- expenses, and net side-by-side.
--
-- v1 keeps the receipt as a URL field (paste a Drive / Dropbox / direct
-- link). File uploads come later — they need a dedicated Supabase storage
-- bucket with stricter RLS than the public `images` bucket.
-- ============================================================================

create table if not exists public.expenses (
  id                   uuid primary key default gen_random_uuid(),

  -- When the expense happened (the date the firm actually paid — not the
  -- date the row was created)
  expense_date         date not null default current_date,

  -- Who got paid
  vendor               text not null,
  -- Bucket — see EXPENSE_CATEGORIES in src/lib/expenses.ts for the
  -- canonical list. Stored as text (not a check constraint) so the user
  -- can add custom categories without a migration.
  category             text not null default 'Other',

  amount               numeric(12, 2) not null,

  -- How it was paid (Cash / Check / Credit Card / ACH / Other). Same
  -- text-not-enum approach as category.
  payment_method       text default 'Credit Card',

  description          text,             -- short human-readable note
  receipt_url          text,             -- link to Drive / Dropbox / direct file
  property_reference   text,             -- optional — attribute to a deal/property
  reimbursable         boolean not null default false,
  internal_notes       text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists expenses_date_idx     on public.expenses (expense_date desc);
create index if not exists expenses_category_idx on public.expenses (category);
create index if not exists expenses_vendor_idx   on public.expenses (lower(vendor));

-- updated_at trigger (shared function)
do $$ begin
  create trigger expenses_set_updated_at
    before update on public.expenses
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Expenses include vendor relationships, amounts, and (optionally) deal
-- attribution. No public access. Authenticated CRUD only.
alter table public.expenses enable row level security;

drop policy if exists "authenticated read expenses"   on public.expenses;
drop policy if exists "authenticated insert expenses" on public.expenses;
drop policy if exists "authenticated update expenses" on public.expenses;
drop policy if exists "authenticated delete expenses" on public.expenses;

create policy "authenticated read expenses"   on public.expenses for select to authenticated using (true);
create policy "authenticated insert expenses" on public.expenses for insert to authenticated with check (true);
create policy "authenticated update expenses" on public.expenses for update to authenticated using (true) with check (true);
create policy "authenticated delete expenses" on public.expenses for delete to authenticated using (true);
