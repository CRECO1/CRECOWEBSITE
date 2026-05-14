-- ============================================================================
-- Plaid bank feed integration
-- ============================================================================
-- One bank_accounts row per linked institution-account pair (a single
-- Plaid "Item" can expose multiple accounts — checking + credit card on
-- the same login). bank_transactions are pulled daily by the cron and
-- land in an "unreviewed" state. The operator goes through the inbox,
-- decides what each transaction is (an expense, a transfer, a payment
-- against an invoice), and the corresponding expense row is created
-- inline.

-- ── Linked Plaid Items + accounts ─────────────────────────────────────────
create table if not exists public.bank_accounts (
  id                  uuid primary key default gen_random_uuid(),
  -- Plaid identifiers — we encrypt the access_token at application level
  -- if needed but for now the service-role-only access on the table is
  -- the security boundary. The access_token IS the credential.
  plaid_item_id       text not null,
  plaid_access_token  text not null,
  plaid_account_id    text not null unique,
  -- Display metadata pulled from Plaid at link time
  institution_name    text,
  account_name        text,
  account_mask        text,                          -- last 4 of account #
  account_type        text,                          -- depository, credit, etc
  account_subtype     text,                          -- checking, savings, credit card
  -- Lifecycle
  active              boolean default true not null,
  last_synced_at      timestamptz,
  last_sync_error     text,
  -- Sync cursor for Plaid /transactions/sync — null means "first sync"
  plaid_cursor        text,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

create index if not exists bank_accounts_active_idx on public.bank_accounts (active);
create index if not exists bank_accounts_item_id_idx on public.bank_accounts (plaid_item_id);

-- ── Transactions inbox ────────────────────────────────────────────────────
-- Plaid sign convention: positive amount = outflow (money leaving your
-- account). Negative = inflow (deposit, credit, refund). We preserve
-- that sign here.
create table if not exists public.bank_transactions (
  id                      uuid primary key default gen_random_uuid(),
  bank_account_id         uuid not null references public.bank_accounts(id) on delete cascade,
  plaid_transaction_id    text not null unique,
  posted_date             date not null,
  amount                  numeric(12,2) not null,        -- + outflow, - inflow
  merchant_name           text,
  description             text,                          -- raw Plaid `name`
  plaid_category          text,                          -- best-effort
  pending                 boolean default false not null,
  -- Workflow state. unreviewed → expensed | ignored | reconciled
  status                  text default 'unreviewed' not null
                              check (status in ('unreviewed','expensed','ignored','reconciled')),
  -- When `expensed`, the created expense row's id lives here so we can
  -- two-way link from the transaction back to the expense and prevent
  -- duplicate creation.
  expense_id              uuid references public.expenses(id) on delete set null,
  reviewed_at             timestamptz,
  reviewed_by             uuid references auth.users(id) on delete set null,
  -- Notes the operator adds during review
  internal_notes          text,
  created_at              timestamptz default now() not null
);

create index if not exists bank_transactions_status_date_idx
  on public.bank_transactions (status, posted_date desc);
create index if not exists bank_transactions_account_idx
  on public.bank_transactions (bank_account_id, posted_date desc);
create index if not exists bank_transactions_unreviewed_idx
  on public.bank_transactions (posted_date desc)
  where status = 'unreviewed' and pending = false;

-- ── Updated-at trigger ────────────────────────────────────────────────────
drop trigger if exists tg_bank_accounts_updated_at on public.bank_accounts;
create trigger tg_bank_accounts_updated_at
  before update on public.bank_accounts
  for each row execute function public.tg_set_updated_at();

-- ── RLS — admin authenticated users only ──────────────────────────────────
alter table public.bank_accounts     enable row level security;
alter table public.bank_transactions enable row level security;

-- Same pattern as the other admin-only tables: authenticated users can
-- do everything; service role bypasses RLS for the cron.
drop policy if exists "admin_can_all_bank_accounts" on public.bank_accounts;
create policy "admin_can_all_bank_accounts"
  on public.bank_accounts for all to authenticated using (true) with check (true);

drop policy if exists "admin_can_all_bank_transactions" on public.bank_transactions;
create policy "admin_can_all_bank_transactions"
  on public.bank_transactions for all to authenticated using (true) with check (true);
