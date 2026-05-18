#!/usr/bin/env node
/**
 * One-off applier for migrations 0022 → 0024:
 *   0022_client_defaults.sql                  — default_tax_rate, payment_terms, reminder_cadence on clients
 *   0023_bank_invoice_reconciliation.sql      — reconciled_invoice_id on bank_transactions
 *   0024_client_portal.sql                    — portal_token on clients
 *
 * Connects to DATABASE_URL from .env.local. Idempotent — every statement
 * uses ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS so re-runs are
 * safe. Prints a summary of which columns landed.
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env.local parser
const envPath = path.join(__dirname, '..', '.env.local');
if (fsSync.existsSync(envPath)) {
  for (const line of fsSync.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const MIGRATIONS = [
  '0022_client_defaults.sql',
  '0023_bank_invoice_reconciliation.sql',
  '0024_client_portal.sql',
];
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in .env.local');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('Connecting…');
  await client.connect();

  // Confirm we can see the billing tables — if not, abort.
  const { rows: tables } = await client.query(
    `select table_name from information_schema.tables
      where table_schema = 'public'
        and table_name in ('clients', 'invoices', 'bank_transactions')
      order by table_name`,
  );
  const have = new Set(tables.map(r => r.table_name));
  for (const t of ['clients', 'invoices', 'bank_transactions']) {
    if (!have.has(t)) {
      console.error(`❌ Missing required table: public.${t} — DATABASE_URL may be pointed at the wrong project.`);
      await client.end();
      process.exit(2);
    }
  }
  console.log('✓ Required tables present (clients, invoices, bank_transactions)');

  for (const filename of MIGRATIONS) {
    const filepath = path.join(MIGRATIONS_DIR, filename);
    let sql;
    try {
      sql = await fs.readFile(filepath, 'utf8');
    } catch {
      console.error(`❌ Missing migration file: ${filepath}`);
      continue;
    }
    console.log(`\n→ Running ${filename} (${sql.length} chars)…`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${filename} applied`);
    } catch (err) {
      console.error(`  ❌ ${filename} failed: ${err.message}`);
    }
  }

  // Verify expected columns landed
  console.log('\nVerifying schema…');
  const checks = [
    { table: 'clients', column: 'default_tax_rate' },
    { table: 'clients', column: 'default_payment_terms' },
    { table: 'clients', column: 'reminders_enabled_default' },
    { table: 'clients', column: 'reminder_cadence' },
    { table: 'clients', column: 'portal_token' },
    { table: 'bank_transactions', column: 'reconciled_invoice_id' },
  ];
  for (const c of checks) {
    const { rows } = await client.query(
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = $1 and column_name = $2`,
      [c.table, c.column],
    );
    console.log(`  ${rows.length > 0 ? '✓' : '✗'} ${c.table}.${c.column}`);
  }

  // Backfill: count how many existing clients now have portal_token populated
  const { rows: portalCount } = await client.query(
    `select count(*)::int as c from public.clients where portal_token is not null`,
  );
  const { rows: totalCount } = await client.query(
    `select count(*)::int as c from public.clients`,
  );
  console.log(`\n${portalCount[0].c}/${totalCount[0].c} clients have a portal_token assigned.`);

  // Reload PostgREST schema cache
  console.log('\nReloading PostgREST schema cache…');
  await client.query("notify pgrst, 'reload schema'");
  console.log('  ✓ Notified pgrst');

  await client.end();
}

main().catch(async err => {
  console.error('Fatal error:', err);
  try { await client.end(); } catch {}
  process.exit(1);
});
