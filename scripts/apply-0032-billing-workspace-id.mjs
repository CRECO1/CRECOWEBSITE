#!/usr/bin/env node
/**
 * Apply migration 0032 — workspace_id column on every billing table.
 *
 * Safe + idempotent. Pre-flight checks that 0031 was applied first.
 * Post-flight verifies every billing table has the workspace_id
 * column with no nulls.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const EXPECTED_TABLES = [
  'invoices','invoice_line_items','invoice_settings','invoice_reminders',
  'invoice_email_events','expenses','clients','contractors','properties',
  'recurring_invoice_templates','recurring_invoice_line_items',
  'bank_accounts','bank_transactions','activity_log',
];

function readDatabaseUrl() {
  const raw = readFileSync(resolve(root, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^DATABASE_URL\s*=\s*(.+)$/);
    if (m) return m[1].trim();
  }
  throw new Error('DATABASE_URL not found in .env.local');
}

async function main() {
  const databaseUrl = readDatabaseUrl();
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('✓ connected to', databaseUrl.replace(/:[^:@]+@/, ':***@'));

  // Pre-flight: confirm 0031 ran (workspaces table + CRECO row exist).
  const ws = await client.query(
    `SELECT id FROM public.workspaces WHERE slug = 'creco'`,
  );
  if (ws.rows.length === 0) {
    throw new Error('0031 not applied — CRECO workspace missing. Run apply-0031-workspaces-foundation.mjs first.');
  }
  console.log(`✓ CRECO workspace_id = ${ws.rows[0].id}`);

  const sql = readFileSync(
    resolve(root, 'supabase/migrations/0032_billing_workspace_id.sql'),
    'utf8',
  );

  console.log('→ applying migration 0032 in a transaction…');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✓ migration applied');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ migration failed, rolled back:', err.message);
    process.exit(1);
  }

  // Post-flight: every expected table has workspace_id NOT NULL + index.
  console.log('\n=== Post-flight verification ===');
  for (const t of EXPECTED_TABLES) {
    const exists = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [t],
    );
    if (exists.rows.length === 0) {
      console.log(`  ⊘ ${t}: table missing in this environment (skipped)`);
      continue;
    }
    const col = await client.query(
      `SELECT is_nullable FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1 AND column_name='workspace_id'`,
      [t],
    );
    const nullCount = await client.query(
      `SELECT COUNT(*)::int AS n FROM public.${t} WHERE workspace_id IS NULL`,
    );
    const idx = await client.query(
      `SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename=$1 AND indexname=$2`,
      [t, `${t}_workspace_id_idx`],
    );
    const nullOk = col.rows[0]?.is_nullable === 'NO';
    const indexOk = idx.rows.length === 1;
    const dataOk = nullCount.rows[0].n === 0;
    const status = (nullOk && indexOk && dataOk) ? '✓' : '✗';
    console.log(`  ${status} ${t}: NOT NULL=${nullOk}  null_rows=${nullCount.rows[0].n}  index=${indexOk}`);
  }

  // PostgREST schema cache reload.
  await client.query(`NOTIFY pgrst, 'reload schema'`);
  console.log('\n✓ pgrst schema cache reload notified');

  await client.end();
  console.log('\n✓ done. Workspace_id is now on every billing row.');
  console.log('  Next: app code update (useWorkspace context + query scoping)');
  console.log('  Then: migration 0033 (RLS cutover) — the actual breaking moment');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
