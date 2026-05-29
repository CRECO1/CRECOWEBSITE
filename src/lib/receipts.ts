/**
 * Receipt-storage helpers. Backed by the private `receipts` bucket
 * (created in migration 0026). Photos captured from the expense form
 * land in the bucket; the path is stored as a string in
 * expenses.receipt_url so the schema doesn't need a separate column.
 *
 * The `receipt_url` field on an expense row carries one of three shapes:
 *
 *   1. ""             — no receipt attached
 *   2. "receipts/..." — storage path inside the private bucket; render
 *                       via a signed URL generated at view time
 *   3. "https://..."  — external URL (legacy free-form paste, or a
 *                       link to Drive/Dropbox); render directly
 *
 * `isStoragePath` and `getReceiptDisplayUrl` keep the call sites tiny —
 * the expense detail view just asks for a URL it can throw into an
 * <img>/iframe regardless of which shape was stored.
 *
 * Signed URLs are short-lived (1 hour). If you need a longer window,
 * pass `expiresInSeconds` explicitly. Don't store the signed URL — the
 * signature expires and the link breaks; always regenerate on demand.
 */

import { supabase } from '@/lib/supabase';

const STORAGE_PREFIX = 'receipts/';
const DEFAULT_EXPIRY_SECONDS = 60 * 60; // 1 hour

export function isStoragePath(receiptUrl: string | null | undefined): boolean {
  if (!receiptUrl) return false;
  return receiptUrl.startsWith(STORAGE_PREFIX);
}

/**
 * Resolve a stored receipt_url to a URL the browser can fetch right now.
 *
 * - For storage paths, generates a fresh signed URL.
 * - For external URLs, returns the URL unchanged.
 * - For null/empty, returns null.
 *
 * Returns null on signing failure so the UI can show a fallback ("Photo
 * unavailable") rather than crash.
 */
export async function getReceiptDisplayUrl(
  receiptUrl: string | null | undefined,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS,
): Promise<string | null> {
  if (!receiptUrl) return null;
  if (!isStoragePath(receiptUrl)) return receiptUrl;
  const path = receiptUrl.slice(STORAGE_PREFIX.length);
  const { data, error } = await supabase
    .storage
    .from('receipts')
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    console.warn('[receipts] signed URL failed', { path, msg: error?.message });
    return null;
  }
  return data.signedUrl;
}

/**
 * Upload a captured / chosen receipt file to the private bucket and
 * return the storage path (NOT a URL). Caller stores the path string
 * in `expenses.receipt_url`. View code resolves to a signed URL.
 *
 * File path layout: receipts/YYYY/MM/<random-uuid>.<ext>
 *
 * Year-month foldering keeps the bucket browsable in the Supabase UI
 * during operator support / tax-prep scans. Random UUID per file
 * prevents collisions on rapid-fire captures.
 */
export async function uploadReceiptFile(
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (!file) return { ok: false, error: 'No file selected' };
  // Browsers may report image/heic for iPhone shots — keep them, the
  // server stores the bytes and we'll convert at display time if needed.
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Receipts must be an image (JPEG, PNG, HEIC)' };
  }
  // 10MB cap. iPhone Pro Max raw shots can exceed this; the operator
  // can downscale by tapping "Use small size" in iOS Photos before
  // uploading, or we can add client-side downscale later.
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: 'File too large (max 10MB)' };
  }

  // Random filename — never trust the original. ext from MIME type, not
  // filename, since iOS provides unreliable extensions for camera shots.
  const ext = file.type === 'image/jpeg' ? 'jpg'
    : file.type === 'image/png' ? 'png'
    : file.type === 'image/heic' ? 'heic'
    : file.type === 'image/webp' ? 'webp'
    : 'bin';
  const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const storagePath = `${yyyy}/${mm}/${uuid}.${ext}`;

  const { error } = await supabase
    .storage
    .from('receipts')
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, path: `${STORAGE_PREFIX}${storagePath}` };
}

/**
 * Delete a receipt file from storage. Used when the operator removes
 * an attached photo from an expense, OR replaces it with a retake.
 *
 * No-op for non-storage receipt_urls (external links — we never owned
 * those files in the first place, so deleting would be wrong).
 *
 * Best-effort: a failure here doesn't unhook the expense from the file;
 * caller still proceeds to clear receipt_url on the expense row. The
 * orphaned blob can be cleaned up by a janitor cron later.
 */
export async function deleteReceiptFile(receiptUrl: string | null | undefined): Promise<void> {
  if (!isStoragePath(receiptUrl)) return;
  const path = receiptUrl!.slice(STORAGE_PREFIX.length);
  await supabase.storage.from('receipts').remove([path]).catch(() => { /* swallow */ });
}
