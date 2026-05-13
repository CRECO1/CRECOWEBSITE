-- ============================================================================
-- CRECO – Invoice email settings
--
-- Stores the global default for the invoice-send email template: the subject
-- line and the personal-message body that appears at the top of every
-- outgoing invoice email. One row per workspace (id is fixed to 1).
--
-- The Compose-before-send modal on /admin/invoices/[id] reads from here to
-- pre-fill the subject + message, then lets the admin tweak per-invoice
-- before hitting send. Per-invoice customizations are NOT persisted today;
-- each send starts from the saved defaults.
-- ============================================================================

create table if not exists public.invoice_settings (
  id                integer primary key check (id = 1),
  default_subject   text not null default 'Invoice {{invoice_number}} from CRECO — {{total}}',
  default_message   text not null default 'Hi {{first_name}},

Please find your invoice attached. Let me know if you have any questions or want to walk through any of the line items.

Thanks for working with us.',
  updated_at        timestamptz not null default now()
);

-- Seed the single row if missing
insert into public.invoice_settings (id) values (1)
on conflict (id) do nothing;

-- updated_at trigger (reuses the shared function)
do $$ begin
  create trigger invoice_settings_set_updated_at
    before update on public.invoice_settings
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.invoice_settings enable row level security;

drop policy if exists "authenticated read invoice_settings"   on public.invoice_settings;
drop policy if exists "authenticated update invoice_settings" on public.invoice_settings;
drop policy if exists "authenticated insert invoice_settings" on public.invoice_settings;

create policy "authenticated read invoice_settings"
  on public.invoice_settings for select to authenticated using (true);
create policy "authenticated update invoice_settings"
  on public.invoice_settings for update to authenticated using (true) with check (true);
create policy "authenticated insert invoice_settings"
  on public.invoice_settings for insert to authenticated with check (id = 1);
