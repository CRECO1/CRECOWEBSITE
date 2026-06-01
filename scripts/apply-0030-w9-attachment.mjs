#!/usr/bin/env node
/**
 * Apply migration 0030_w9_attachment.sql AND upload the broker's W-9
 * PDF to the tax-documents bucket, stamping the path on
 * invoice_settings so the auto-attach is wired up end-to-end.
 *
 * Two steps in one script because they're tightly coupled: the
 * migration creates the bucket, and immediately afterward we want a
 * file in it. Doing both here means the operator gets a single
 * `node scripts/apply-0030-w9-attachment.mjs` and is done.
 *
 * Uploads use the SUPABASE_SERVICE_ROLE_KEY (it bypasses RLS — the
 * policies the migration creates require is_billing_admin(), which
 * doesn't apply to service-role anyway). Without the service role we'd
 * need to log in as an admin in this script.
 *
 * Idempotent:
 *   - Migration uses `if not exists` everywhere
 *   - Re-running this script uploads a NEW path (random UUID), updates
 *     invoice_settings to point at the new file, and best-effort
 *     deletes the previous blob to keep the bucket clean
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const W9_LOCAL_PATH = '/Users/zacharya.stovall/Downloads/CRECO_W9 (1).pdf';

function readEnv() {
  const raw = readFileSync(resolve(root, '.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function main() {
  const env = readEnv();
  const databaseUrl = env.DATABASE_URL;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!databaseUrl) throw new Error('DATABASE_URL missing from .env.local');
  // The upload step needs the service-role key (RLS would deny the
  // anon role for an unauth'd script). If it's not in .env.local, we
  // still apply the SQL migration — the operator can upload the W-9
  // via the settings UI once the deploy lands. Better than blocking
  // the whole migration on a key only Vercel has.
  const canUpload = Boolean(supabaseUrl && serviceKey);

  // ── Step 1: apply the SQL migration ────────────────────────────────────
  const pgClient = new pg.Client({ connectionString: databaseUrl });
  await pgClient.connect();
  console.log('✓ connected to', databaseUrl.replace(/:[^:@]+@/, ':***@'));

  const sql = readFileSync(
    resolve(root, 'supabase/migrations/0030_w9_attachment.sql'),
    'utf8',
  );

  console.log('→ applying migration 0030 in a transaction…');
  await pgClient.query('BEGIN');
  try {
    await pgClient.query(sql);
    await pgClient.query('COMMIT');
    console.log('✓ migration applied');
  } catch (err) {
    await pgClient.query('ROLLBACK');
    console.error('✗ migration failed, rolled back:', err.message);
    process.exit(1);
  }

  // Verify the new columns + bucket exist
  const cols = await pgClient.query(
    `SELECT column_name FROM information_schema.columns
       WHERE table_schema='public' AND table_name='invoice_settings'
         AND column_name IN ('w9_storage_path','w9_filename','w9_uploaded_at')`,
  );
  console.log(`✓ invoice_settings has W-9 columns: ${cols.rows.map(r => r.column_name).join(', ')}`);

  const buckets = await pgClient.query(
    `SELECT id, public FROM storage.buckets WHERE id='tax-documents'`,
  );
  if (buckets.rows.length === 0) throw new Error('tax-documents bucket missing after migration');
  console.log(`✓ tax-documents bucket present (public=${buckets.rows[0].public})`);

  // Capture the previously-stored path so we can delete the orphan blob
  // if this run replaces an existing W-9.
  const prev = await pgClient.query(
    `SELECT w9_storage_path FROM public.invoice_settings WHERE id=1`,
  );
  const previousPath = prev.rows[0]?.w9_storage_path ?? null;

  if (!canUpload) {
    console.log('');
    console.log('⚠  SUPABASE_SERVICE_ROLE_KEY not in .env.local — skipping the upload step.');
    console.log('   Upload your W-9 from /billing/invoices/settings after the next deploy,');
    console.log('   or add SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run this script.');
    await pgClient.end();
    return;
  }

  // ── Step 2: upload the W-9 file ────────────────────────────────────────
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const fileBytes = readFileSync(W9_LOCAL_PATH);
  const friendlyFilename = 'W-9 — CRECO LLC.pdf';
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const storagePath = `${yyyy}/${mm}/${randomUUID()}.pdf`;

  console.log(`→ uploading ${W9_LOCAL_PATH} → tax-documents/${storagePath} (${fileBytes.length} bytes)…`);
  const up = await supabase.storage
    .from('tax-documents')
    .upload(storagePath, fileBytes, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    });
  if (up.error) throw new Error(`upload failed: ${up.error.message}`);
  console.log('✓ uploaded to tax-documents/' + storagePath);

  // Stamp the path on invoice_settings
  const nowIso = new Date().toISOString();
  await pgClient.query(
    `UPDATE public.invoice_settings
        SET w9_storage_path=$1, w9_filename=$2, w9_uploaded_at=$3
      WHERE id=1`,
    [storagePath, friendlyFilename, nowIso],
  );
  console.log(`✓ invoice_settings.w9_storage_path = ${storagePath}`);
  console.log(`✓ invoice_settings.w9_filename     = ${friendlyFilename}`);

  // Best-effort cleanup of any prior file
  if (previousPath && previousPath !== storagePath) {
    const del = await supabase.storage.from('tax-documents').remove([previousPath]);
    if (del.error) {
      console.warn(`! could not delete previous file ${previousPath}: ${del.error.message}`);
    } else {
      console.log(`✓ removed previous W-9 file ${previousPath}`);
    }
  }

  await pgClient.end();
  console.log('\n✓ done. Future invoice emails + the client portal will surface the W-9 automatically.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
