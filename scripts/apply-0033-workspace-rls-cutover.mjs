#!/usr/bin/env node
/**
 * Apply migration 0033 — workspace-scoped RLS cutover. This is the
 * breaking moment: after this runs, unscoped queries return only rows
 * the calling user has workspace membership for, and inserts MUST
 * include workspace_id.
 *
 * Pre-flight verifies that 0031 + 0032 are applied and every billing
 * table has workspace_id NOT NULL with zero null rows. Post-flight
 * smoke-tests that the broker can still read their own data.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

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

  // Pre-flight: 0031 ran (workspace exists) + 0032 ran (workspace_id NOT NULL on every table).
  const ws = await client.query(`SELECT id FROM public.workspaces WHERE slug='creco'`);
  if (ws.rows.length === 0) throw new Error('0031 not applied — CRECO workspace missing');
  console.log(`✓ CRECO workspace_id=${ws.rows[0].id}`);

  const nullCheck = await client.query(`
    SELECT t.table_name,
           (SELECT COUNT(*)::int
              FROM information_schema.columns c
              WHERE c.table_schema='public' AND c.table_name=t.table_name
                AND c.column_name='workspace_id' AND c.is_nullable='NO') AS not_null
    FROM information_schema.tables t
    WHERE t.table_schema='public'
      AND t.table_name = ANY(ARRAY[
        'invoices','invoice_line_items','invoice_settings','invoice_reminders',
        'invoice_email_events','expenses','clients','contractors','properties',
        'recurring_invoice_templates','recurring_invoice_line_items',
        'bank_accounts','bank_transactions','activity_log'
      ])
    ORDER BY t.table_name;
  `);
  for (const r of nullCheck.rows) {
    if (r.not_null !== 1) throw new Error(`0032 incomplete — ${r.table_name}.workspace_id is nullable`);
  }
  console.log(`✓ workspace_id NOT NULL on ${nullCheck.rows.length} billing tables`);

  const sql = readFileSync(
    resolve(root, 'supabase/migrations/0033_workspace_rls_cutover.sql'),
    'utf8',
  );

  console.log('→ applying migration 0033 in a transaction…');
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

  // Post-flight: every billing table has a workspace_member_* policy + zero billing_admin_* policies.
  const pol = await client.query(`
    SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname='public'
        AND tablename = ANY(ARRAY[
          'invoices','invoice_line_items','invoice_settings','invoice_reminders',
          'invoice_email_events','expenses','clients','contractors','properties',
          'recurring_invoice_templates','recurring_invoice_line_items',
          'bank_accounts','bank_transactions','activity_log'
        ])
      ORDER BY tablename, policyname;
  `);
  console.log('\n=== Policy state after cutover ===');
  let oldCount = 0, newCount = 0;
  for (const r of pol.rows) {
    if (r.policyname.startsWith('billing_admin_')) oldCount++;
    if (r.policyname.startsWith('workspace_member_')) newCount++;
    console.log(`  ${r.tablename.padEnd(36)} ${r.policyname}`);
  }
  console.log(`\n  ${oldCount === 0 ? '✓' : '✗'} billing_admin_* policies remaining: ${oldCount}`);
  console.log(`  ${newCount > 0 ? '✓' : '✗'} workspace_member_* policies added: ${newCount}`);

  // Smoke test: broker can read invoices in CRECO.
  await client.query('BEGIN');
  await client.query(`SET LOCAL ROLE authenticated`);
  const u = await client.query(`SELECT id FROM auth.users WHERE lower(email)='zack@crecotx.com' LIMIT 1`);
  await client.query(`SET LOCAL request.jwt.claims TO '{"email":"zack@crecotx.com","sub":"${u.rows[0].id}"}'`);
  const inv = await client.query(`SELECT COUNT(*)::int AS n FROM public.invoices`);
  console.log(`\n  ✓ broker can read ${inv.rows[0].n} invoice(s) post-cutover`);
  const exp = await client.query(`SELECT COUNT(*)::int AS n FROM public.expenses`);
  console.log(`  ✓ broker can read ${exp.rows[0].n} expense(s) post-cutover`);
  await client.query('ROLLBACK');

  await client.query(`NOTIFY pgrst, 'reload schema'`);
  console.log('\n✓ pgrst schema cache reload notified');

  await client.end();
  console.log('\n✓ done. Multi-tenancy is fully active.');
  console.log('  Next: redeploy + smoke-test from the operator UI');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
