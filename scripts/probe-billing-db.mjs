// Post-migration verification probe.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const url = raw.match(/^DATABASE_URL\s*=\s*(.+)$/m)[1].trim();
const c = new pg.Client({ connectionString: url });
await c.connect();

console.log('=== admin_users rows ===');
const a = await c.query('SELECT email, role, name FROM public.admin_users ORDER BY created_at');
for (const r of a.rows) console.log(` - ${r.email}  ${r.role}  (${r.name})`);

console.log('\n=== old "authenticated *" policies on invoices (should be empty) ===');
const old = await c.query(
  `SELECT policyname FROM pg_policies
     WHERE schemaname='public' AND tablename='invoices'
     AND policyname LIKE 'authenticated %'`,
);
if (old.rows.length === 0) console.log(' (none — clean replacement)');
else for (const r of old.rows) console.log(' STILL PRESENT:', r.policyname);

console.log('\n=== new billing_admin_all_invoices policy ===');
const p = await c.query(
  `SELECT policyname, cmd, qual, with_check FROM pg_policies
     WHERE schemaname='public' AND tablename='invoices'`,
);
for (const r of p.rows) {
  console.log(` ${r.policyname} (${r.cmd})`);
  console.log(`     USING: ${r.qual}`);
  console.log(`     CHECK: ${r.with_check}`);
}

console.log('\n=== sanity: is_billing_admin() exists + is SECURITY DEFINER ===');
const fn = await c.query(
  `SELECT proname, prosecdef, prosrc FROM pg_proc
     WHERE proname='is_billing_admin' AND pronamespace='public'::regnamespace`,
);
for (const r of fn.rows) {
  console.log(` ${r.proname}  SECURITY DEFINER=${r.prosecdef}`);
}

await c.end();
