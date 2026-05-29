'use client';

/**
 * Receipt-photo capture for the expense form. Optimized for the
 * operator's primary use case: snap a receipt with the rear camera
 * right after lunch / a vendor visit, from their phone.
 *
 * On mobile (iOS Safari / Chrome Android):
 *   - "Take photo" button hits a hidden <input type="file"
 *     accept="image/*" capture="environment"> which opens the rear
 *     camera directly — no Photos picker, no extra taps.
 *   - "Choose file" is offered as a second button for cases where the
 *     receipt is already in Photos / Files.
 *
 * On desktop:
 *   - The `capture` attribute is silently ignored; both buttons act as
 *     a regular file picker. We rename the primary CTA to "Upload
 *     receipt" so the desktop label matches the desktop behavior.
 *
 * Once a file is chosen:
 *   - We render an immediate thumbnail via `URL.createObjectURL(file)`
 *     so the operator sees the photo before the upload completes.
 *   - The file uploads to the private `receipts` bucket via the
 *     helper in lib/receipts. The parent receives the resulting
 *     storage path through `onChange` and stores it in
 *     expenses.receipt_url.
 *   - "Retake" deletes the just-uploaded file from storage and
 *     reopens the camera so the operator can re-shoot a blurry one
 *     without leaving an orphaned blob behind.
 *
 * The component is controlled — the parent owns the receipt_url state.
 * `value` is the current storage path or external URL; `onChange`
 * fires with the new value (or '' when cleared).
 */

import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, RotateCcw, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadReceiptFile, deleteReceiptFile, getReceiptDisplayUrl, isStoragePath } from '@/lib/receipts';

interface Props {
  /** Storage path (receipts/...) or external URL, or '' when no receipt is attached. */
  value: string;
  onChange: (next: string) => void;
}

export function ReceiptCapture({ value, onChange }: Props) {
  // Hidden inputs. We keep two — one with the `capture` attribute (rear
  // camera shortcut) and one without (file picker fallback for both
  // mobile and desktop).
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Local preview source. Three states:
  //   - localPreview: blob URL of a just-captured file (shown instantly
  //     before upload completes)
  //   - resolvedUrl: signed URL resolved from the storage path (shown
  //     when value is set and there's no local preview)
  //   - null: no receipt
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  // Two-stage status. `processing` covers HEIC→JPEG conversion +
  // downscale, which can take 1-3s on a fresh iPhone shot. `uploading`
  // covers the network round trip. We surface both distinctly so the
  // operator doesn't think the page froze during the pre-process stage.
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Whenever the parent-stored value changes (e.g. clone-form prefill,
  // initial mount with an existing receipt), resolve it to a displayable
  // URL. External URLs pass through; storage paths get a signed URL.
  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!value) { setResolvedUrl(null); return; }
    // If there's a local preview pending, prefer it — the resolved URL
    // is for already-persisted receipts.
    if (localPreview) return;
    (async () => {
      const url = await getReceiptDisplayUrl(value);
      if (!cancelled) setResolvedUrl(url);
    })();
    return () => { cancelled = true; };
  }, [value, localPreview]);

  // Clean up the blob URL when the component unmounts or a new preview
  // takes its place — otherwise the browser leaks memory for the
  // lifetime of the page.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    // Immediate preview — operator sees the shot before processing or
    // upload finishes. The pre-process pipeline (HEIC convert + resize)
    // works on the file in the background; we keep showing the original
    // capture in the preview so it doesn't visibly change mid-flow.
    const preview = URL.createObjectURL(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(preview);

    const result = await uploadReceiptFile(file, (stage) => {
      if (stage === 'processing') {
        setProcessing(true);
        setUploading(false);
      } else if (stage === 'uploading') {
        setProcessing(false);
        setUploading(true);
      } else {
        setProcessing(false);
        setUploading(false);
      }
    });
    setProcessing(false);
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      // Keep the preview visible so the operator can see what failed
      // and try Retake.
      return;
    }
    onChange(result.path);
  }

  async function handleRetake() {
    setError(null);
    // Delete the previously-uploaded file (if any) to keep storage clean.
    // Failure is non-fatal — orphans get cleaned up by a future janitor.
    if (isStoragePath(value)) {
      await deleteReceiptFile(value);
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setResolvedUrl(null);
    onChange('');
    // Immediately reopen the camera for the next shot
    cameraInputRef.current?.click();
  }

  async function handleClear() {
    setError(null);
    if (isStoragePath(value)) {
      await deleteReceiptFile(value);
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setResolvedUrl(null);
    onChange('');
  }

  const displayUrl = localPreview ?? resolvedUrl;
  const hasReceipt = !!value || !!localPreview;

  return (
    <div className="space-y-3">
      {/* Hidden file inputs — driven by the buttons below */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        // `capture="environment"` is the magic that tells mobile browsers
        // to launch the rear camera directly instead of the Photos
        // picker. Ignored on desktop. Without this, iOS Safari shows a
        // Photo Library / Take Photo chooser which is one extra tap.
        capture="environment"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0] ?? null)}
      />

      {hasReceipt ? (
        // Captured / uploaded state — preview + actions
        <div className="rounded-xl border border-border bg-background-cream/30 overflow-hidden">
          <div className="relative aspect-[4/3] bg-background-warm flex items-center justify-center">
            {displayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl}
                alt="Receipt preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <Loader2 className="h-8 w-8 text-foreground-muted animate-spin" />
            )}
            {(processing || uploading) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-body-sm font-semibold gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {processing ? 'Processing photo…' : 'Uploading…'}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-t border-border">
            <div className="text-caption text-foreground-muted flex items-center gap-1.5">
              {processing ? (
                <span>Processing photo…</span>
              ) : uploading ? (
                <span>Uploading receipt…</span>
              ) : value ? (
                <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Receipt saved</>
              ) : (
                <span>Pending upload</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                disabled={processing || uploading}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-caption text-primary hover:border-primary disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retake
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={processing || uploading}
                aria-label="Remove receipt"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-foreground-muted hover:text-destructive hover:bg-destructive/5 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Empty state — primary "Take photo" button (mobile-first) plus
        // a "Choose file" secondary for desktop / "already saved" cases
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-4 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            <Camera className="h-5 w-5" />
            Take photo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-border bg-white px-4 py-4 text-body-sm font-semibold text-primary hover:border-gold"
          >
            <Upload className="h-5 w-5" />
            Choose file
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-caption text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
