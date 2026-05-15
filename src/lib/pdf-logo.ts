/**
 * Shared CRECO logo loader for server-side PDF generation.
 *
 * Reads /public/images/creco-logo-light.png from the filesystem at first
 * invocation, converts it to a base64 data URI, and caches it for the
 * lifetime of the process. Used by invoice-pdf.ts and statement-pdf.ts
 * so they share one source of branding.
 *
 * Why light: PDF headers paint a black background bar (CRECO_BLACK) and
 * the logo sits inside it — we need the white-on-transparent variant.
 *
 * Returns null if the file can't be read (e.g. dev environment with
 * the file missing). Callers fall back to the previous text-based
 * header in that case.
 */

import { readFile } from 'fs/promises';
import path from 'path';

let cachedDataUri: string | null | undefined;

export async function getLogoLightDataUri(): Promise<string | null> {
  if (cachedDataUri !== undefined) return cachedDataUri;
  try {
    // process.cwd() is the project root in both `next dev` and Vercel
    // runtime. /public assets ship to the server filesystem unchanged.
    const filePath = path.join(process.cwd(), 'public', 'images', 'creco-logo-light.png');
    const bytes = await readFile(filePath);
    cachedDataUri = `data:image/png;base64,${bytes.toString('base64')}`;
    return cachedDataUri;
  } catch (err) {
    console.warn('[pdf-logo] could not read creco-logo-light.png:', err);
    cachedDataUri = null;
    return null;
  }
}

/**
 * Native PNG dimensions of creco-logo-light.png. Used to preserve the
 * aspect ratio when we pick a header height for the PDF without round-
 * tripping through Sharp on every render.
 *
 * Source dimensions: 1251 × 430 → aspect ratio ≈ 2.91.
 */
export const LOGO_ASPECT = 1251 / 430;
