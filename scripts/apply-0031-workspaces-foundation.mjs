#!/usr/bin/env node
/**
 * Apply migration 0031_workspaces_foundation.sql to the billing project.
 *
 * Safe to re-run — every DDL is `if not exists` and the seed uses
 * `on conflict do nothing`. Pre-flight checks that auth.users has the
 * broker so the seed won't silently no-op.
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

  // Pre-flight: confirm the broker exists in auth.users so the seed
  // gets a workspace_member row. If the broker isn't there, the seed
  // silently no-ops and the workspace exists without admins — bad.
  const u = await client.query(
    `SELECT id, email FROM auth.users WHERE lower(email) = lower('zack@crecotx.com')`,
  );
  if (u.rows.length === 0) {
    throw new Error('zack@crecotx.com not found in auth.users — seed would create an admin-less workspace');
  }
  console.log(`✓ broker present in auth.users: ${u.rows[0].email}`);

  const sql = readFileSync(
    resolve(root, 'supabase/migrations/0031_workspaces_foundation.sql'),
    'utf8',
  );

  console.log('→ applying migration 0031 in a transaction…');
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

  // Post-flight: verify the workspace + member rows are seeded.
  const ws = await client.query(
    `SELECT id, slug, name, owner_email, subscription_status FROM public.workspaces WHERE slug = 'creco'`,
  );
  if (ws.rows.length === 0) throw new Error('CRECO workspace missing after migration');
  const wsRow = ws.rows[0];
  console.log(`✓ CRECO workspace: id=${wsRow.id} slug=${wsRow.slug} status=${wsRow.subscription_status}`);

  const mem = await client.query(
    `SELECT email, role FROM public.workspace_members WHERE workspace_id = $1 ORDER BY email`,
    [wsRow.id],
  );
  console.log(`✓ workspace_members (${mem.rows.length}):`);
  for (const m of mem.rows) console.log(`    ${m.email} → ${m.role}`);

  // Smoke test: is_workspace_member returns true for the broker.
  await client.query('BEGIN');
  await client.query(`SET LOCAL ROLE authenticated`);
  await client.query(
    `SET LOCAL request.jwt.claims TO '{"email":"zack@crecotx.com","sub":"${u.rows[0].id}"}'`,
  );
  const fn = await client.query(
    `SELECT public.is_workspace_member($1) AS is_member`,
    [wsRow.id],
  );
  console.log(`✓ is_workspace_member(creco) → ${fn.rows[0].is_member}`);
  const cur = await client.query(`SELECT * FROM public.current_user_workspace()`);
  console.log(`✓ current_user_workspace() → ${cur.rows[0]?.workspace_slug ?? '(none)'}`);
  await client.query('ROLLBACK');

  // PostgREST schema cache reload so the new tables/functions become
  // visible to the API right away.
  await client.query(`NOTIFY pgrst, 'reload schema'`);
  console.log('✓ pgrst schema cache reload notified');

  await client.end();
  console.log('\n✓ done. Next: migration 0032 adds workspace_id to every billing table.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
