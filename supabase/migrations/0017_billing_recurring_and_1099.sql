-- ============================================================================
-- Billing extensions: recurring invoices + 1099 contractor tracking
-- ============================================================================

-- ── Recurring invoice templates ────────────────────────────────────────────
-- A template is "the invoice you send the same client every month/quarter/year".
-- The monthly cron reads `next_run_date` and clones the template + its line
-- items into a new draft (or auto-sent) invoice, then advances next_run_date.
create table if not exists public.recurring_invoice_templates (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,                         -- e.g. "Galleria PM monthly fee"
  client_name       text not null,
  client_email      text not null,
  client_company    text,
  client_address    text,
  property_reference text,

  -- Money config (mirrors invoices)
  tax_rate          numeric(6,4) not null default 0,
  payment_terms     text,                                  -- "Net 30", etc.
  notes             text,                                  -- shown on invoice
  internal_notes    text,                                  -- never shown to client

  -- Schedule
  frequency         text not null check (frequency in ('monthly','quarterly','annually')),
  -- ISO date the next invoice should be generated on
  next_run_date     date not null,
  -- ISO date to stop generating (null = forever)
  end_date          date,

  -- Per-template behaviour on cron fire:
  --   draft           — create as draft, owner reviews + sends
  --   send_immediately — create AND send the invoice email automatically
  on_generate       text not null default 'draft' check (on_generate in ('draft','send_immediately')),

  -- Days from issue_date to due_date on the generated invoice
  due_days          integer not null default 30,

  -- Lifecycle
  active            boolean not null default true,
  last_run_at       timestamptz,
  last_run_invoice_id uuid,                                -- forward ref, no FK

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists recurring_templates_active_next_run_idx
  on public.recurring_invoice_templates (active, next_run_date)
  where active = true;

-- ── Recurring template line items ──────────────────────────────────────────
-- Same shape as invoice_line_items; cloned at generation time.
create table if not exists public.recurring_invoice_line_items (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.recurring_invoice_templates(id) on delete cascade,
  description  text not null,
  quantity     numeric(12,2) not null default 1,
  rate         numeric(12,2) not null default 0,
  amount       numeric(12,2) not null default 0,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists recurring_template_line_items_template_id_idx
  on public.recurring_invoice_line_items (template_id, sort_order);

-- ── Link invoices back to their recurring source ────────────────────────────
-- Lets the template detail page show "generated 4 invoices, $X total billed".
alter table public.invoices
  add column if not exists recurring_template_id uuid references public.recurring_invoice_templates(id) on delete set null;

create index if not exists invoices_recurring_template_idx
  on public.invoices (recurring_template_id)
  where recurring_template_id is not null;


-- ── Contractors (for 1099 tracking) ────────────────────────────────────────
-- Anyone you pay $600+/year as a contractor needs a 1099-NEC. The contractors
-- table is the canonical record: legal name, TIN, address — all the info
-- required on the form. Expenses link to a contractor when applicable.
create table if not exists public.contractors (
  id            uuid primary key default gen_random_uuid(),
  -- Legal name on the W-9 (may differ from "doing business as")
  legal_name    text not null,
  display_name  text,                                       -- e.g. "Dave's HVAC"
  email         text,
  phone         text,
  -- Tax ID — store as text to preserve leading zeros and "XX-XXXXXXX" format
  tax_id        text,
  tax_id_type   text check (tax_id_type in ('SSN','EIN')),
  -- Billing/legal address for the 1099
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  zip           text,
  -- Notes (e.g. "1099 sent 1/28/2026")
  notes         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists contractors_active_legal_name_idx
  on public.contractors (active, legal_name);


-- ── Expense → contractor link + 1099 eligibility ────────────────────────────
-- Marking an expense as `is_1099_eligible = true` and linking to a contractor
-- makes it count toward the year-end 1099 total. Goods purchases, software
-- subscriptions, business meals — none of those need 1099s. Contractor
-- labour, professional services, rents paid to landlords (over $600) — do.
alter table public.expenses
  add column if not exists contractor_id uuid references public.contractors(id) on delete set null;
alter table public.expenses
  add column if not exists is_1099_eligible boolean not null default false;

create index if not exists expenses_contractor_id_idx
  on public.expenses (contractor_id)
  where contractor_id is not null;
create index if not exists expenses_1099_idx
  on public.expenses (is_1099_eligible, expense_date)
  where is_1099_eligible = true;


-- ── Updated-at triggers (mirror the pattern used elsewhere) ─────────────────
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;

drop trigger if exists tg_recurring_templates_updated_at on public.recurring_invoice_templates;
create trigger tg_recurring_templates_updated_at
  before update on public.recurring_invoice_templates
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_contractors_updated_at on public.contractors;
create trigger tg_contractors_updated_at
  before update on public.contractors
  for each row execute function public.tg_set_updated_at();


-- ── RLS — admin-only access (mirrors the pattern in 0002_admin_rls_policies) ─
alter table public.recurring_invoice_templates  enable row level security;
alter table public.recurring_invoice_line_items enable row level security;
alter table public.contractors                  enable row level security;

-- The /billing UI runs via the service role (cron) or an authenticated admin
-- session. The simple policy: only authenticated users can see/modify. The
-- service role bypasses RLS regardless.
drop policy if exists "admin_can_all_recurring_templates" on public.recurring_invoice_templates;
create policy "admin_can_all_recurring_templates"
  on public.recurring_invoice_templates for all to authenticated using (true) with check (true);

drop policy if exists "admin_can_all_recurring_line_items" on public.recurring_invoice_line_items;
create policy "admin_can_all_recurring_line_items"
  on public.recurring_invoice_line_items for all to authenticated using (true) with check (true);

drop policy if exists "admin_can_all_contractors" on public.contractors;
create policy "admin_can_all_contractors"
  on public.contractors for all to authenticated using (true) with check (true);
