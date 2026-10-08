-- Per-invoice CC recipient.
--
-- Until now a CC could only be typed into the Compose modal at the moment of
-- sending, so it was lost if the invoice was prepared ahead of time (a draft
-- for the owner to review, with a colleague who should be copied on send).
-- cc_email is that address, stored on the invoice. The send route uses it when
-- the request doesn't supply one, and the Compose modal pre-fills it.
--
-- Nullable and additive: every existing invoice keeps working unchanged.
alter table public.invoices
  add column if not exists cc_email text;

comment on column public.invoices.cc_email is
  'Optional CC address copied when the invoice is emailed. Pre-fills the Compose modal; a CC typed at send time wins.';
