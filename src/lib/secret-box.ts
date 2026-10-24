/**
 * App-layer encryption for secrets stored in Postgres (currently Plaid access tokens).
 *
 * AES-256-GCM with a key from SECRET_BOX_KEY (32 bytes, base64 or 64-hex). Ciphertext is stored as
 * `enc:v1:<iv>.<tag>.<data>` (base64url). Backward compatible by design:
 *   - If SECRET_BOX_KEY is unset, `sealSecret` stores the value unchanged (and warns), so deploying this
 *     code before the key exists breaks nothing.
 *   - `openSecret` returns any value without the `enc:v1:` prefix as-is, so rows written before the key
 *     was introduced keep working until they are re-sealed (see scripts/seal-plaid-tokens.mjs).
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const PREFIX = 'enc:v1:';

function key(): Buffer | null {
  const raw = (process.env.SECRET_BOX_KEY ?? '').trim();
  if (!raw) return null;
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('SECRET_BOX_KEY must be 32 bytes (base64 or 64 hex chars)');
  return buf;
}

export function sealSecret(plain: string): string {
  const k = key();
  if (!k) {
    console.warn('[secret-box] SECRET_BOX_KEY not set — storing secret unencrypted');
    return plain;
  }
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', k, iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return `${PREFIX}${iv.toString('base64url')}.${c.getAuthTag().toString('base64url')}.${data.toString('base64url')}`;
}

export function openSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const k = key();
  if (!k) throw new Error('SECRET_BOX_KEY is required to decrypt stored secrets');
  const [iv, tag, data] = stored.slice(PREFIX.length).split('.');
  const d = createDecipheriv('aes-256-gcm', k, Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64url')), d.final()]).toString('utf8');
}
