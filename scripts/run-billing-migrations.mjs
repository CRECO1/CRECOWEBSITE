#!/usr/bin/env node
/**
 * One-off migration runner for the four /billing migrations:
 *   0010_invoices.sql
 *   0011_invoice_settings.sql
 *   0012_expenses.sql
 *   0013_invoice_reminders.sql
 *
 * Connects to DATABASE_URL from .env.local. Runs each file in order, prints
 * what it found. Safe to re-run — every statement is idempotent.
 *
 * Verifies we're connected to CRECO (not FORG) by checking for a known
 * CRECO-only marker table before applying any DDL.
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tiny .env.local parser — avoids a dotenv dep for this one-off script.
// Handles KEY=value and KEY="value" lines, skips comments + blanks.
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
  '0010_invoices.sql',
  '0011_invoice_settings.sql',
  '0012_expenses.sql',
  '0013_invoice_reminders.sql',
  '0014_invoice_email_overrides.sql',
];
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in .env.local');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  // Supabase pooler requires SSL but the cert chain is fine
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('Connecting…');
  await client.connect();

  // Sanity-check we're on CRECO, not FORG. CRECO has `subscribers` (from
  // migration 0009); FORG doesn't have that exact table. We use this as
  // a project fingerprint before applying any DDL.
  const { rows: marker } = await client.query(
    `select count(*)::int as c
       from information_schema.tables
      where table_schema = 'public' and table_name = 'subscribers'`,
  );
  if (marker[0].c === 0) {
    console.error(
      '❌ This database is missing the `subscribers` table, which CRECO has from migration 0009. ' +
      'DATABASE_URL may be pointing at the wrong project. Aborting.',
    );
    await client.end();
    process.exit(2);
  }
  console.log('✓ Confirmed connection to CRECO (subscribers table present)');

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

  // Verify the four target tables now exist
  console.log('\nVerifying tables exist…');
  const { rows: tables } = await client.query(
    `select table_name from information_schema.tables
      where table_schema = 'public'
        and table_name in ('invoices', 'invoice_line_items', 'invoice_settings', 'expenses', 'invoice_reminders')
      order by table_name`,
  );
  for (const r of tables) console.log(`  ✓ public.${r.table_name}`);

  const missing = [
    'invoices', 'invoice_line_items', 'invoice_settings', 'expenses', 'invoice_reminders',
  ].filter(t => !tables.some(r => r.table_name === t));
  if (missing.length) {
    console.warn(`\n⚠️  Still missing: ${missing.join(', ')}`);
  } else {
    console.log('\n✅ All 5 billing tables present.');
  }

  // Force PostgREST to reload its schema cache so the API picks up the new
  // tables immediately (without this, the dashboard may keep showing
  // "schema cache" errors for ~30s).
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
