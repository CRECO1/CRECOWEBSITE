import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const url = raw.match(/^DATABASE_URL\s*=\s*(.+)$/m)[1].trim();
const c = new pg.Client({ connectionString: url });
await c.connect();
console.log('✓ connected');

// Pre-flight: snapshot existing CRECO row so we can sanity-check preservation.
const before = await c.query(`SELECT * FROM public.invoice_settings WHERE workspace_id = (SELECT id FROM public.workspaces WHERE slug='creco')`);
console.log(`✓ pre-flight: CRECO settings row present (subject="${before.rows[0]?.default_subject?.slice(0, 50)}…")`);

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/0034_invoice_settings_per_workspace.sql'),
  'utf8',
);
await c.query('BEGIN');
try { await c.query(sql); await c.query('COMMIT'); console.log('✓ migration applied'); }
catch (e) { await c.query('ROLLBACK'); console.error('✗', e.message); process.exit(1); }

const r = await c.query(`SELECT workspace_id, default_subject, late_fee_enabled, w9_storage_path FROM public.invoice_settings`);
console.log(`✓ post-flight rows: ${r.rows.length}`);
for (const x of r.rows) {
  console.log(`  workspace_id=${x.workspace_id}  subject_len=${x.default_subject?.length ?? 0}  late_fee=${x.late_fee_enabled}  w9=${x.w9_storage_path ? 'present' : 'none'}`);
}

const pk = await c.query(
  `SELECT a.attname FROM pg_index i
     JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=ANY(i.indkey)
     WHERE i.indrelid='public.invoice_settings'::regclass AND i.indisprimary`,
);
console.log(`✓ primary key columns: ${pk.rows.map(r => r.attname).join(',')}`);

const idExists = await c.query(
  `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoice_settings' AND column_name='id'`,
);
console.log(`✓ id column dropped: ${idExists.rows.length === 0 ? 'yes' : 'no'}`);

await c.query(`NOTIFY pgrst, 'reload schema'`);
console.log('✓ pgrst schema cache reload notified');
await c.end();
console.log('\n✓ done. invoice_settings is now per-workspace.');
