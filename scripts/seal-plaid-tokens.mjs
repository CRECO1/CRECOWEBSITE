// One-off: encrypt existing plaintext bank_accounts.plaid_access_token values in place.
// Usage (after setting SECRET_BOX_KEY, in the SAME value as production):
//   DATABASE_URL=... SECRET_BOX_KEY=... node scripts/seal-plaid-tokens.mjs [--apply]
// Dry-run by default. Idempotent: rows already starting with `enc:v1:` are skipped.
import pg from 'pg';
import { createCipheriv, randomBytes } from 'crypto';

const raw = (process.env.SECRET_BOX_KEY ?? '').trim();
const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
if (key.length !== 32) { console.error('SECRET_BOX_KEY must be 32 bytes'); process.exit(1); }
const apply = process.argv.includes('--apply');

const seal = (plain) => {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return `enc:v1:${iv.toString('base64url')}.${c.getAuthTag().toString('base64url')}.${data.toString('base64url')}`;
};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows } = await client.query(`select id, plaid_access_token from public.bank_accounts where plaid_access_token not like 'enc:v1:%'`);
console.log(`${rows.length} plaintext token(s) found${apply ? '' : ' (dry run; pass --apply to encrypt)'}`);
if (apply) {
  await client.query('begin');
  for (const r of rows) await client.query('update public.bank_accounts set plaid_access_token = $1 where id = $2', [seal(r.plaid_access_token), r.id]);
  await client.query('commit');
  console.log('done');
}
await client.end();
