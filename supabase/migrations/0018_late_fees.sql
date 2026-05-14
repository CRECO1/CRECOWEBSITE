-- ============================================================================
-- Auto late fees
-- ============================================================================
-- Operator turns it on in /billing/invoices/settings. After an invoice is
-- N days past due, the daily cron adds a late-fee line item to the invoice
-- and recomputes totals. If `late_fee_recurring=true` it adds another fee
-- every N days thereafter; otherwise one-and-done.

alter table public.invoice_settings
  add column if not exists late_fee_enabled   boolean default false not null,
  add column if not exists late_fee_type      text default 'percent' not null
                              check (late_fee_type in ('percent', 'flat')),
  -- Percent: 0.05 = 5% of the invoice subtotal at time of fee.
  -- Flat:    50.00 = $50 added regardless of invoice size.
  add column if not exists late_fee_amount    numeric(8,4) default 0 not null,
  -- Days after due_date before the first fee is added.
  add column if not exists late_fee_days      integer default 30 not null,
  -- When true, add another fee every `late_fee_days` thereafter (compounding
  -- delinquency). When false, add once and stop.
  add column if not exists late_fee_recurring boolean default false not null;

-- Mark which invoice line items are auto-generated late fees so we (a)
-- never double-add on the same day and (b) can report on cumulative late
-- fees separately from real charges.
alter table public.invoice_line_items
  add column if not exists is_late_fee boolean default false not null;

create index if not exists invoice_line_items_late_fee_idx
  on public.invoice_line_items (invoice_id, is_late_fee)
  where is_late_fee = true;
