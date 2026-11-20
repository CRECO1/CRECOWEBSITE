/**
 * Per-invoice attachments (e.g. the signed proposal or contract) that go out with the invoice email,
 * alongside the invoice PDF and the workspace W-9.
 *
 * Stored in the same private `tax-documents` bucket as the W-9 (billing-admin-only RLS, PDF only,
 * 5 MB cap), under `invoices/<invoice_id>/<timestamp>__<filename>.pdf`. No table: the folder IS the
 * list, so the send route just lists the invoice's folder.
 *
 *   Browser (invoice detail page): listInvoiceAttachments / uploadInvoiceAttachment / removeInvoiceAttachment / attachmentUrl
 *   Server (send, remind, cron):   fetchInvoiceAttachments(client, invoiceId) → [{ filename, content }] (fail-soft)
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'tax-documents';
const MAX_BYTES = 5 * 1024 * 1024;
const folder = (invoiceId: string) => `invoices/${invoiceId}`;

export interface InvoiceAttachmentInfo {
  path: string;
  /** What the recipient sees, e.g. "Fossil-Creek-Pools-Proposal-signed.pdf". */
  filename: string;
  size: number | null;
  uploadedAt: string | null;
}

/** "1795187503000__Signed Proposal.pdf" → "Signed Proposal.pdf" */
function displayName(objectName: string): string {
  return objectName.replace(/^\d+__/, '');
}

function safeName(name: string): string {
  const base = name.replace(/\.pdf$/i, '').replace(/[^\w.\- ()]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 100) || 'attachment';
  return `${base}.pdf`;
}

export async function listInvoiceAttachments(client: SupabaseClient, invoiceId: string): Promise<InvoiceAttachmentInfo[]> {
  const { data, error } = await client.storage.from(BUCKET).list(folder(invoiceId), { limit: 50, sortBy: { column: 'name', order: 'asc' } });
  if (error || !data) return [];
  return data
    .filter(o => o.name && !o.name.startsWith('.') && o.id)
    .map(o => ({
      path: `${folder(invoiceId)}/${o.name}`,
      filename: displayName(o.name),
      size: (o.metadata as { size?: number } | null)?.size ?? null,
      uploadedAt: o.created_at ?? null,
    }));
}

export async function uploadInvoiceAttachment(client: SupabaseClient, invoiceId: string, file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!file) return { ok: false, error: 'No file selected' };
  if (!(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return { ok: false, error: 'Attachments must be PDF files' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'File too large (max 5 MB)' };
  try {
    const h = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (!(h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46)) return { ok: false, error: "That file isn't a valid PDF" };
  } catch { /* fall through; the bucket only accepts application/pdf anyway */ }
  const path = `${folder(invoiceId)}/${Date.now()}__${safeName(file.name)}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, { contentType: 'application/pdf', upsert: false });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function removeInvoiceAttachment(client: SupabaseClient, path: string): Promise<boolean> {
  const { error } = await client.storage.from(BUCKET).remove([path]);
  return !error;
}

export async function attachmentUrl(client: SupabaseClient, path: string): Promise<string | null> {
  const { data } = await client.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Server: every attachment on the invoice, ready for Resend. A file that fails to download is skipped. */
export async function fetchInvoiceAttachments(client: SupabaseClient, invoiceId: string): Promise<{ filename: string; content: Buffer }[]> {
  const out: { filename: string; content: Buffer }[] = [];
  try {
    for (const a of await listInvoiceAttachments(client, invoiceId)) {
      const { data, error } = await client.storage.from(BUCKET).download(a.path);
      if (error || !data) { console.warn('[invoice-attachments] download failed', a.path, error?.message); continue; }
      out.push({ filename: a.filename, content: Buffer.from(await data.arrayBuffer()) });
    }
  } catch (e) {
    console.warn('[invoice-attachments] list failed', (e as Error).message);
  }
  return out;
}
