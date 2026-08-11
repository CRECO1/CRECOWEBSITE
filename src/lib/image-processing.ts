/**
 * Client-side image processing for receipt captures.
 *
 * Two real problems this solves:
 *
 *  1. **iPhone Pro RAW shots can be 20-30MB.** Without downscaling, the
 *     operator gets a "file too large" error and has to manually tap
 *     "Use small size" in iOS Photos before re-uploading. Annoying and
 *     completely automatable.
 *
 *  2. **iOS saves to HEIC by default.** When the operator picks an
 *     existing receipt from their Photos library (vs. snapping fresh),
 *     the file is HEIC. Most modern browsers can display HEIC, but
 *     when the CPA forwards the receipt to TurboTax or Drive, it
 *     breaks. JPEG is the universal lingua franca for receipts.
 *
 * The pipeline runs entirely in the browser before upload:
 *
 *      raw file → [HEIC → JPEG] → [downscale to 1920px max] → JPEG @ 0.85
 *
 * Each stage is a no-op if not needed:
 *   - Non-HEIC files skip the conversion step
 *   - Images already under the dimension cap skip the resize
 *   - Already-small JPEGs go through but re-encode is essentially free
 *
 * heic2any is loaded dynamically (only when an HEIC file is actually
 * detected) so the 500KB library doesn't bloat the initial bundle.
 *
 * Failure mode: if any stage fails (corrupt HEIC, OOM on huge image,
 * etc.) we return the original file unchanged. Better to upload a
 * larger / less-compatible file than to fail the operator at the
 * point of capture.
 */

const MAX_DIMENSION = 1920; // px on the long edge
const JPEG_QUALITY = 0.85;  // sweet spot for legibility vs file size

export interface ProcessOptions {
  /** Max edge in pixels. Default 1920 — receipts stay readable, files
   *  drop from ~10MB to ~500KB typical. */
  maxDimension?: number;
  /** JPEG quality 0-1. Default 0.85. */
  quality?: number;
}

/**
 * Run a captured / chosen file through HEIC conversion + downscale.
 * Always returns a File the browser can display + upload immediately.
 *
 * On failure, returns the original file unchanged with a console
 * warning — never throws, so the operator's flow doesn't break.
 */
export async function processReceiptImage(
  file: File,
  opts: ProcessOptions = {},
): Promise<File> {
  const maxDim = opts.maxDimension ?? MAX_DIMENSION;
  const quality = opts.quality ?? JPEG_QUALITY;

  // Stage 1 — HEIC → JPEG. Detect by MIME first (most reliable) with
  // filename fallback for browsers that drop the MIME on iOS pickers.
  let working: Blob = file;
  let originalName = file.name;
  const isHeic = file.type === 'image/heic'
    || file.type === 'image/heif'
    || /\.(heic|heif)$/i.test(file.name);

  if (isHeic) {
    try {
      // Dynamic import — keeps the 500KB heic2any out of the initial
      // bundle for the 90% of uploads that aren't HEIC.
      const { default: heic2any } = await import('heic2any');
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality,
      });
      working = Array.isArray(converted) ? converted[0] : converted;
      // Swap the visible filename so any downstream code that sniffs
      // the extension sees .jpg, not .heic.
      originalName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    } catch (err) {
      console.warn('[image-processing] HEIC conversion failed, uploading original', err);
      return file; // bail safely — original might still display in some clients
    }
  }

  // Stage 2 — downscale + re-encode as JPEG. Skipped silently for
  // images already under the dimension cap.
  try {
    const resized = await downscaleToJpeg(working, maxDim, quality);
    if (!resized) return new File([working], originalName, { type: working.type });
    return new File([resized], originalName.replace(/\.[^.]+$/, '.jpg'), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('[image-processing] Downscale failed, uploading post-HEIC original', err);
    return new File([working], originalName, { type: working.type });
  }
}

/**
 * Generic alias for the exact same pipeline (HEIC→JPEG + downscale), for any
 * operator-supplied upload — not just receipts. The listing admin uploader
 * (src/app/admin) runs every picked file through this before storing, so
 * iPhone HEIC photos become browser-renderable JPEGs instead of silently-
 * broken files (browsers can't display image/heic). It also downscales the
 * 10–16MB straight-from-camera JPEGs that would otherwise trip the uploader's
 * 10MB size cap. Non-HEIC images already under the cap pass through unchanged.
 */
export const processImageForUpload = processReceiptImage;

/**
 * Decode the blob via Image + draw to canvas at the target size + encode
 * as JPEG. Returns null when the source is already under the cap (caller
 * uses the input unchanged to avoid pointless re-encoding).
 */
async function downscaleToJpeg(
  blob: Blob,
  maxDim: number,
  quality: number,
): Promise<Blob | null> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const { width, height } = img;
    const longEdge = Math.max(width, height);
    if (longEdge <= maxDim) {
      // Already small — but if the source is HEIC-converted, we still
      // want it as JPEG. Caller handles that case via the File() wrap.
      return null;
    }
    const scale = maxDim / longEdge;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    // High-quality downsampling — defaults are usually 'low' on some
    // browsers and the receipt text suffers.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const out = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
    if (!out) throw new Error('canvas.toBlob returned null');
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = src;
  });
}
