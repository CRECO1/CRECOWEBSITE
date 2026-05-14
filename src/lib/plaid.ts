/**
 * Plaid client + helpers.
 *
 * Plaid has three environments:
 *   - sandbox     — free, mock banks, used for development
 *   - development — limited real banks, free for ~100 items
 *   - production  — full real bank access, paid, requires approval
 *
 * Env vars (set in Vercel):
 *   PLAID_CLIENT_ID
 *   PLAID_SECRET
 *   PLAID_ENV          — 'sandbox' | 'development' | 'production' (default sandbox)
 *
 * If PLAID_CLIENT_ID or PLAID_SECRET aren't set, `getPlaidClient()`
 * returns null and the API routes gracefully respond 503 with a
 * "configure Plaid first" message rather than crashing.
 *
 * In sandbox mode you can link the "Plaid First Platypus Bank" with
 * the test credentials `user_good` / `pass_good` — see Plaid docs for
 * the full list of sandbox flows (failures, ACH micro-deposits, etc).
 */

import { Configuration, PlaidApi, PlaidEnvironments, type CountryCode, type Products } from 'plaid';

export interface PlaidConfig {
  client: PlaidApi;
  env: 'sandbox' | 'development' | 'production';
}

let cached: PlaidConfig | null = null;

export function getPlaidClient(): PlaidConfig | null {
  if (cached) return cached;

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET;
  if (!clientId || !secret) return null;

  const envName = (process.env.PLAID_ENV as 'sandbox' | 'development' | 'production' | undefined) ?? 'sandbox';

  const configuration = new Configuration({
    basePath: PlaidEnvironments[envName],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET':    secret,
      },
    },
  });

  cached = {
    client: new PlaidApi(configuration),
    env: envName,
  };
  return cached;
}

/** Country codes we support (US only for CRECO). */
export const PLAID_COUNTRIES: CountryCode[] = ['US' as CountryCode];

/** Products requested at link time. `transactions` is the core need;
 *  `auth` enables ACH details if we ever want to debit the account
 *  for an invoice payment in-platform. */
export const PLAID_PRODUCTS: Products[] = ['transactions' as Products];
