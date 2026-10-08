-- 0054_invoice_views.sql
--
-- Per-recipient "View invoice online" tracking.
--
-- The tracking pixel can't tell us who READ an invoice: Outlook/Hotmail block it, and mail security
-- scanners and Apple's privacy proxy trigger it without a person. So each recipient's copy of the email
-- carries its own signed link to /inv/<token>; the page records a view only when it actually loads in a
-- browser (JS beacon), plus clicks on "Download PDF" and "Pay online".
--
--   invoice_email_messages  every Resend message id we sent for an invoice, and to whom (the client's
--                           copy and any Cc copy are separate messages) so webhook events resolve.
--   invoice_views           the human-signal events: view | pdf | pay_click.

create table if not exists public.invoice_email_messages (
  message_id      text primary key,
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  workspace_id    uuid,
  recipient_email text not null,
  role            text not null default 'to' check (role in ('to', 'cc')),
  created_at      timestamptz not null default now()
);
create index if not exists invoice_email_messages_invoice_idx on public.invoice_email_messages (invoice_id);

create table if not exists public.invoice_views (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  workspace_id    uuid,
  recipient_email text,
  role            text,
  kind            text not null check (kind in ('view', 'pdf', 'pay_click')),
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);
create index if not exists invoice_views_invoice_time_idx on public.invoice_views (invoice_id, created_at desc);

alter table public.invoice_email_messages enable row level security;
alter table public.invoice_views enable row level security;
drop policy if exists "admin_can_all_invoice_email_messages" on public.invoice_email_messages;
create policy "admin_can_all_invoice_email_messages" on public.invoice_email_messages for all to authenticated using (true) with check (true);
drop policy if exists "admin_can_all_invoice_views" on public.invoice_views;
create policy "admin_can_all_invoice_views" on public.invoice_views for all to authenticated using (true) with check (true);
