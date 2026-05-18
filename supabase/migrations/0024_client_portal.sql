-- 0024_client_portal.sql
--
-- Token-based client portal — no login, no signup. Each saved client gets
-- a stable random UUID (portal_token). Anyone with the token can view that
-- client's invoices + payments at /client/[token].
--
-- Why token-not-login: the operator's clients are mostly small-business
-- owners and property managers who won't sign up for yet another portal.
-- Token-in-the-email + "anyone with the link" semantics is the same model
-- Stripe, Calendly, FreshBooks use for their B2B customer surfaces.
--
-- Security tradeoffs:
--   * Tokens are UUIDs (128 bits of entropy) — not guessable
--   * Tokens go in URLs and email bodies — visible in browser history /
--     forwarded emails. Anyone forwarded the link has access.
--   * No write actions in the MVP — view-only ledger + PDF downloads. If
--     we add pay-online or "request a statement" later, those'd still be
--     gated by additional confirmations.
--
-- Operator can rotate a leaked token by UPDATE clients SET portal_token =
-- gen_random_uuid() WHERE id = ... — old URL stops working immediately.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS portal_token uuid DEFAULT gen_random_uuid() NOT NULL;

-- Backfill any rows that came in before the default kicked in. The
-- DEFAULT only applies to inserts; pre-existing rows need explicit values.
UPDATE public.clients
SET portal_token = gen_random_uuid()
WHERE portal_token IS NULL;

-- Unique so two clients can't share a token. Index supports the lookup
-- on every /client/[token] page load.
CREATE UNIQUE INDEX IF NOT EXISTS clients_portal_token_idx
  ON public.clients(portal_token);
