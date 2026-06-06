/**
 * Plaid transaction sync — shared by the manual-trigger API route and the
 * daily cron. Uses Plaid's /transactions/sync endpoint with cursor-based
 * pagination so we only get new/updated/removed transactions since the
 * last call (not a re-pull of the whole history every time).
 *
 * For each bank_account row we:
 *   1. Call /transactions/sync with the saved cursor
 *   2. Upsert `added` transactions into bank_transactions (status='unreviewed')
 *   3. Update `modified` transactions in-place (pending→posted is the common case)
 *   4. Mark `removed` transactions as removed (rare; Plaid uses this for
 *      transactions the bank later disputes / corrects out of history)
 *   5. Save the new cursor + the last_synced_at timestamp
 *
 * Pulls through has_more pagination until Plaid says we're caught up.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getPlaidClient } from './plaid';

export interface SyncResult {
  account_id: string;
  added: number;
  modified: number;
  removed: number;
  error?: string;
}

interface BankAccountRow {
  id: string;
  /** Multi-tenancy: transactions inherit the account's workspace. */
  workspace_id: string;
  plaid_access_token: string;
  plaid_account_id: string;
  plaid_cursor: string | null;
  account_name: string | null;
}

export async function syncAllAccounts(supabase: SupabaseClient): Promise<SyncResult[]> {
  const plaid = getPlaidClient();
  if (!plaid) {
    throw new Error('Plaid not configured');
  }

  const { data: accounts } = await supabase
    .from('bank_accounts')
    .select('id, workspace_id, plaid_access_token, plaid_account_id, plaid_cursor, account_name')
    .eq('active', true);

  const results: SyncResult[] = [];

  for (const acct of (accounts as BankAccountRow[] | null) ?? []) {
    try {
      const r = await syncOneAccount(supabase, acct);
      results.push(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ account_id: acct.id, added: 0, modified: 0, removed: 0, error: msg });
      // Persist the error on the row so the UI can show it without
      // making the operator dig in logs.
      await supabase
        .from('bank_accounts')
        .update({ last_sync_error: msg.slice(0, 500) })
        .eq('id', acct.id);
    }
  }

  return results;
}

async function syncOneAccount(supabase: SupabaseClient, acct: BankAccountRow): Promise<SyncResult> {
  const plaid = getPlaidClient()!;
  let cursor = acct.plaid_cursor ?? undefined;
  let added = 0, modified = 0, removed = 0;
  let hasMore = true;

  // Plaid pages by 100; loop until has_more=false. Limit to 10 iterations
  // as a sanity cap (1000 transactions per account per sync) to avoid
  // runaway loops in case the cursor protocol behaves unexpectedly.
  for (let iter = 0; iter < 10 && hasMore; iter++) {
    const res = await plaid.client.transactionsSync({
      access_token: acct.plaid_access_token,
      cursor,
      count: 100,
    });

    // Filter to just this account — a single Item can have multiple
    // accounts and /transactions/sync returns transactions across all
    // of them. We persist them per-account-row.
    const matches = res.data.added.filter(t => t.account_id === acct.plaid_account_id);
    if (matches.length > 0) {
      const rows = matches.map(t => ({
        // Inherit workspace from the parent account so cross-tenant
        // queries can't leak via the bank_transactions table.
        workspace_id: acct.workspace_id,
        bank_account_id: acct.id,
        plaid_transaction_id: t.transaction_id,
        posted_date: t.date,                  // YYYY-MM-DD
        amount: t.amount,                     // Plaid: + outflow, - inflow
        merchant_name: t.merchant_name ?? null,
        description: t.name,
        plaid_category: t.personal_finance_category?.primary ?? (t.category?.[0] ?? null),
        pending: t.pending,
        status: 'unreviewed',
      }));
      const { error } = await supabase
        .from('bank_transactions')
        .upsert(rows, { onConflict: 'plaid_transaction_id', ignoreDuplicates: true });
      if (error) throw new Error(`Insert added: ${error.message}`);
      added += matches.length;
    }

    const modMatches = res.data.modified.filter(t => t.account_id === acct.plaid_account_id);
    for (const t of modMatches) {
      const { error } = await supabase
        .from('bank_transactions')
        .update({
          posted_date: t.date,
          amount: t.amount,
          merchant_name: t.merchant_name ?? null,
          description: t.name,
          plaid_category: t.personal_finance_category?.primary ?? (t.category?.[0] ?? null),
          pending: t.pending,
        })
        .eq('plaid_transaction_id', t.transaction_id);
      if (error) throw new Error(`Update modified: ${error.message}`);
      modified++;
    }

    // Removed transactions are rare. We mark them ignored rather than
    // deleting so the audit trail stays intact.
    if (res.data.removed.length > 0) {
      const removedIds = res.data.removed.map(r => r.transaction_id).filter(Boolean) as string[];
      if (removedIds.length > 0) {
        const { error } = await supabase
          .from('bank_transactions')
          .update({ status: 'ignored', internal_notes: 'Removed by bank' })
          .in('plaid_transaction_id', removedIds);
        if (error) throw new Error(`Update removed: ${error.message}`);
        removed += removedIds.length;
      }
    }

    cursor = res.data.next_cursor;
    hasMore = res.data.has_more;
  }

  // Save the cursor + sync timestamp; clear any stale error
  await supabase
    .from('bank_accounts')
    .update({
      plaid_cursor: cursor,
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    })
    .eq('id', acct.id);

  return { account_id: acct.id, added, modified, removed };
}
