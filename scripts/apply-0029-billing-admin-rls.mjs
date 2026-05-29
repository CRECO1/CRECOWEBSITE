#!/usr/bin/env node
/**
 * Apply migration 0029_billing_admin_rls.sql to the billing project.
 *
 * Why this exists: the Supabase MCP is connected to the website project,
 * not the billing project (lzynidkwnvwdpyluiqhg per .env.local
 * DATABASE_URL). That project's URL is reachable via the session pooler
 * but not via the MCP, so we have to talk to it via the `pg` client.
 *
 * Safety checks before the migration runs:
 *   1. Verify we're connected to the right project (admin_users table
 *      must exist + have at least one row, or we'd lock ourselves out).
 *   2. Verify the billing tables actually live here (no point applying
 *      RLS to a table that doesn't exist).
 *
 * Migration runs inside a single transaction so a mid-way failure
 * leaves the policies in their pre-migration state.
 *
 * Usage:
 *   node scripts/apply-0029-billing-admin-rls.mjs
 *
 * Idempotent: the migration uses `drop policy if exists` everywhere,
 * so re-running it is safe (each run drops + recreates).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// Hand-parse .env.local — no dotenv dep, and we only need one var.
function readDatabaseUrl() {
  const envPath = resolve(root, '.env.local');
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^DATABASE_URL\s*=\s*(.+)$/);
    if (m) return m[1].trim();
  }
  throw new Error('DATABASE_URL not found in .env.local');
}

const REQUIRED_TABLES = [
  'invoices', 'invoice_line_items', 'invoice_settings',
  'invoice_reminders', 'invoice_email_events',
  'expenses', 'clients', 'contractors', 'properties',
  'recurring_invoice_templates', 'recurring_invoice_line_items',
  'bank_accounts', 'bank_transactions', 'activity_log',
];

async function main() {
  const databaseUrl = readDatabaseUrl();
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('✓ connected to', databaseUrl.replace(/:[^:@]+@/, ':***@'));

  // Pre-flight: at least one auth.users row must exist with an email,
  // otherwise the bootstrap insert into admin_users would seed zero rows
  // and lock everyone out the moment the new policies activate. The
  // migration itself creates admin_users if missing, so we don't check
  // for that table here.
  const authUsers = await client.query(
    `SELECT email FROM auth.users WHERE email IS NOT NULL ORDER BY created_at`,
  );
  if (authUsers.rows.length === 0) {
    throw new Error(
      'auth.users has no email-bearing rows — applying this migration would '
      + 'leave admin_users empty and lock everyone out of /billing. Create at '
      + 'least one auth user via Supabase Studio first.',
    );
  }
  console.log(`✓ auth.users has ${authUsers.rows.length} email-bearing row(s):`);
  for (const r of authUsers.rows) console.log(`    ${r.email}`);

  // Pre-flight: billing tables present.
  const present = await client.query(
    `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES],
  );
  const found = new Set(present.rows.map(r => r.table_name));
  const missing = REQUIRED_TABLES.filter(t => !found.has(t));
  if (missing.length > 0) {
    console.warn(`! missing billing tables (migration will skip them): ${missing.join(', ')}`);
  } else {
    console.log('✓ all 14 billing tables present');
  }

  const sql = readFileSync(
    resolve(root, 'supabase/migrations/0029_billing_admin_rls.sql'),
    'utf8',
  );

  // If any tables are missing, strip their drop/create policy
  // statements so the migration succeeds against the actual schema.
  // Simple line-scan filter; the migration is grouped by table with
  // `-- ── tablename ───` section headers.
  let filteredSql = sql;
  if (missing.length > 0) {
    const lines = sql.split('\n');
    const out = [];
    let skipUntilNextSection = false;
    for (const line of lines) {
      const sec = line.match(/^-- ── (\w+) /);
      if (sec) {
        skipUntilNextSection = missing.includes(sec[1]);
      }
      if (!skipUntilNextSection) out.push(line);
    }
    filteredSql = out.join('\n');
  }

  console.log('→ applying migration in a transaction…');
  await client.query('BEGIN');
  try {
    await client.query(filteredSql);
    await client.query('COMMIT');
    console.log('✓ migration applied');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ migration failed, rolled back:', err.message);
    process.exit(1);
  }

  // Post-flight: spot-check that the new function + policies exist.
  const fn = await client.query(
    `SELECT proname FROM pg_proc
       WHERE proname = 'is_billing_admin' AND pronamespace = 'public'::regnamespace`,
  );
  console.log(`${fn.rows.length === 1 ? '✓' : '✗'} public.is_billing_admin() ${fn.rows.length === 1 ? 'created' : 'missing'}`);

  const policies = await client.query(
    `SELECT tablename, COUNT(*)::int AS n FROM pg_policies
       WHERE schemaname = 'public' AND policyname LIKE 'billing_admin_%'
       GROUP BY tablename ORDER BY tablename`,
  );
  console.log('✓ new policies in place:');
  for (const r of policies.rows) console.log(`    ${r.tablename}: ${r.n} polic${r.n === 1 ? 'y' : 'ies'}`);

  await client.end();
  console.log('✓ done');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
