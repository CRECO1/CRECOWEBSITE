/**
 * W-9 attachment helpers. Backed by the private `tax-documents` bucket
 * (created in migration 0030). One W-9 per workspace; the storage path
 * is stamped on invoice_settings.w9_storage_path and reused by every
 * outgoing invoice email.
 *
 * Three call sites, three call shapes:
 *
 *   1. Settings UI (browser, authenticated session)
 *        - uploadW9File(file) — picks a fresh path, uploads, returns it
 *        - removeW9File(path) — best-effort delete from storage
 *        - getW9DisplayUrl(path) — signed URL for the "View current" link
 *
 *   2. Send route + cron reminder (server, service-role)
 *        - fetchW9Attachment(supabase, path, filename) — returns the
 *          bytes + filename ready to hand to Resend's attachments array.
 *          Returns null on any failure so a missing W-9 never blocks
 *          the actual invoice from going out.
 *
 *   3. Client portal (server, service-role)
 *        - getW9DisplayUrl works there too (the caller passes the
 *          service-role client when generating the link).
 *
 * Why a dedicated lib (not just inline supabase.storage calls)?
 * - The signed-URL lifetime + bucket name + path prefix are configured
 *   once, here. If we ever rotate the bucket name we change one constant.
 * - Pre-upload validation (PDF only, size cap) lives here so both the
 *   browser uploader + any future API route uploader share the rules.
 * - The fetch-for-attachment path needs careful error handling — a
 *   missing W-9 must not break the email send. Centralized so every
 *   caller gets the same fail-soft behavior.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as browserClient } from '@/lib/supabase';

const BUCKET = 'tax-documents';
const DEFAULT_EXPIRY_SECONDS = 60 * 60; // 1 hour — long enough for a tab read

// W-9s top out around 1-2MB in practice (it's a 6-page PDF tops). 5MB is a
// generous ceiling; anything larger probably means someone uploaded the
// wrong file (a scan of every tax doc they own, say).
const MAX_W9_BYTES = 5 * 1024 * 1024;

export interface W9UploadResult {
  ok: true;
  path: string;
  filename: string;
}
export interface W9UploadError {
  ok: false;
  error: string;
}

/**
 * Upload a PDF to the private bucket from the browser. Caller stamps the
 * returned path on invoice_settings.w9_storage_path. Path layout matches
 * the receipts bucket convention: YYYY/MM/<uuid>.pdf so the Supabase
 * Studio file browser stays navigable during support.
 */
export async function uploadW9File(file: File): Promise<W9UploadResult | W9UploadError> {
  if (!file) return { ok: false, error: 'No file selected' };
  // First-pass MIME + extension check. Catches the obvious mistakes
  // (image dragged in by accident) without a file read. Some browsers
  // omit file.type on drag-and-drop, so we accept extension as fallback.
  const looksLikePdf = file.type === 'application/pdf'
    || /\.pdf$/i.test(file.name);
  if (!looksLikePdf) {
    return { ok: false, error: 'W-9 must be a PDF file' };
  }
  if (file.size > MAX_W9_BYTES) {
    return { ok: false, error: 'File too large (max 5MB — a W-9 should be under 1MB).' };
  }

  // Magic-byte verification: every PDF starts with the literal bytes
  // `%PDF` (0x25 0x50 0x44 0x46). A renamed `payload.exe` would pass
  // the MIME + extension check above but fail this. Without it the
  // bucket can end up holding arbitrary binaries that a client portal
  // or invoice email would later serve as `application/pdf`.
  //
  // We slice just the first 4 bytes — cheap, doesn't require reading
  // the whole file into memory. Skipped if file.slice isn't available
  // (Node-side callers; current path is browser-only).
  if (typeof file.slice === 'function') {
    try {
      const headerBuf = await file.slice(0, 4).arrayBuffer();
      const header = new Uint8Array(headerBuf);
      const isPdf =
        header.length === 4
        && header[0] === 0x25  // %
        && header[1] === 0x50  // P
        && header[2] === 0x44  // D
        && header[3] === 0x46; // F
      if (!isPdf) {
        return {
          ok: false,
          error: "That file isn't a valid PDF (header mismatch). Re-save your W-9 as PDF and try again.",
        };
      }
    } catch {
      // If the slice/read fails for some browser-specific reason we
      // fall through to the upload. The bucket-side scanning + the
      // attachment-time fail-soft on send still protect downstream.
    }
  }

  const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const path = `${yyyy}/${mm}/${uuid}.pdf`;

  const { error } = await browserClient.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path, filename: file.name };
}

/**
 * Best-effort delete. Used when the operator replaces or removes the
 * W-9. Failure here is logged but not surfaced — the orphaned blob can
 * be cleaned up later, and the user-visible state (clearing w9_storage_path
 * on the settings row) already happened in the caller.
 */
export async function removeW9File(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await browserClient.storage.from(BUCKET).remove([path]).catch(() => { /* swallow */ });
}

/**
 * Generate a signed URL for view-time download. Used in three places:
 * the settings preview ("View current"), the client portal ("Download
 * W-9"), and the server-side fetch for attaching to invoice emails.
 *
 * Takes a Supabase client so callers can pass the appropriate one
 * (browser session for the settings UI, service-role for cron / portal
 * SSR). Returns null on failure — caller decides whether to surface
 * "W-9 unavailable" or quietly skip.
 */
export async function getW9DisplayUrl(
  client: SupabaseClient,
  path: string | null | undefined,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    // Dev-only — leaking storage paths or DB errors to a production
    // browser console would be a minor info-disclosure surface. The
    // caller surfaces a generic "unavailable" UI either way.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[w9] signed URL failed', { path, msg: error?.message });
    }
    return null;
  }
  return data.signedUrl;
}

/**
 * Server-side fetch — downloads the W-9 bytes and packages them in the
 * shape Resend's attachments[] expects. Returns null on any failure so
 * the calling send route can attach the invoice PDF + omit the W-9
 * rather than failing the whole email.
 *
 * Pass a service-role Supabase client for cron contexts; pass the
 * session-bound client for manual sends triggered by an authenticated
 * admin (RLS lets that read through too, since admins have full access
 * via is_billing_admin()).
 */
export interface W9Attachment {
  filename: string;
  content: Buffer;
}
export async function fetchW9Attachment(
  client: SupabaseClient,
  path: string | null | undefined,
  preferredFilename: string | null | undefined,
): Promise<W9Attachment | null> {
  if (!path) return null;
  try {
    const { data, error } = await client.storage.from(BUCKET).download(path);
    if (error || !data) {
      // Server-side log — fine to keep at info level; this runs on the
      // server (cron / API route), not in a user's browser.
      console.warn('[w9] download failed', { path, msg: error?.message });
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    const content = Buffer.from(arrayBuffer);
    // Fall back to a generic friendly name if the original is gone.
    // Spaces in filenames are fine for Resend — the recipient sees this
    // verbatim in the email client.
    const filename = preferredFilename?.trim() || 'W-9.pdf';
    return { filename, content };
  } catch (err) {
    console.warn('[w9] fetch threw', { path, msg: (err as Error).message });
    return null;
  }
}
