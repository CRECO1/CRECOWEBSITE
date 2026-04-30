'use client';

/**
 * Modal for cropping an image before upload.
 *
 * - Uses react-easy-crop for the drag + zoom UI
 * - Aspect ratio toggle: 4:3 (default for property photos), 16:9, 1:1, Free
 * - Zoom slider
 * - Returns a JPEG Blob via onConfirm
 * - Used by both single ImageUpload and per-thumbnail in MultiImageUpload
 */

import { useState, useCallback, useEffect } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  /** data: URL or http(s):// URL of the image to crop */
  imageSrc: string;
  /** Default aspect ratio. Pass `undefined` to start in Free mode. */
  initialAspect?: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({ imageSrc, initialAspect = 4 / 3, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(initialAspect);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setPixelCrop(areaPixels);
  }, []);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // ESC closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  async function handleConfirm() {
    if (!pixelCrop) return;
    setWorking(true);
    try {
      const blob = await getCroppedBlob(imageSrc, pixelCrop);
      onConfirm(blob);
    } catch (e) {
      alert('Could not crop image: ' + (e as Error).message);
      setWorking(false);
    }
  }

  const aspectOptions: { label: string; value: number | undefined }[] = [
    { label: '4 : 3', value: 4 / 3 },
    { label: '16 : 9', value: 16 / 9 },
    { label: '1 : 1', value: 1 },
    { label: 'Free', value: undefined },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Crop Image</h3>
          <button type="button" onClick={onCancel} className="rounded-full p-1.5 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative h-[55vh] bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        {/* Controls */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* Aspect ratio chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Aspect:</span>
            {aspectOptions.map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setAspect(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  aspect === opt.value
                    ? 'bg-yellow-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              4:3 matches the property card display
            </span>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-gray-500" />
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-yellow-600"
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 text-gray-500" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={working || !pixelCrop}
              className="rounded-lg bg-yellow-600 px-5 py-2 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-60"
            >
              {working ? 'Saving…' : 'Save Crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cropping helpers ────────────────────────────────────────────────────────

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null'))),
      'image/jpeg',
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image (possible CORS issue)'));
    img.src = src;
  });
}

/** Read a File as a data URL for use in the cropper. */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
