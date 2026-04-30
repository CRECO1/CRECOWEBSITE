'use client';

/**
 * Listing photo gallery with click-to-zoom lightbox.
 *
 * - Static grid: 1 hero image + 2 thumbnails (matches the legacy crecotx.com layout)
 * - If more than 3 photos, the third tile shows "+N" overlay and a "View all X photos" button appears below
 * - Click any image → fullscreen lightbox
 * - Lightbox supports: keyboard arrows, ESC to close, swipe on mobile,
 *   thumbnail strip, photo counter, prev/next buttons
 * - Body scroll locked while lightbox is open
 */

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Building2, X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { Container } from '@/components/ui/Container';

interface Props {
  images: string[];
  /** Alt text prefix, e.g. "1222 Chulie Dr – Warehouse in San Antonio, TX". Photo number gets appended. */
  altPrefix: string;
}

export function ListingGallery({ images, altPrefix }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const isOpen = lightboxIdx !== null;
  const total = images.length;

  const close = useCallback(() => setLightboxIdx(null), []);
  const next = useCallback(() => {
    setLightboxIdx(i => (i === null ? null : (i + 1) % total));
  }, [total]);
  const prev = useCallback(() => {
    setLightboxIdx(i => (i === null ? null : (i - 1 + total) % total));
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close, next, prev]);

  // Body scroll lock while open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  function onTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const delta = e.changedTouches[0].clientX - touchStart;
    if (delta > 50) prev();
    else if (delta < -50) next();
    setTouchStart(null);
  }

  // Empty state
  if (total === 0) {
    return (
      <div className="bg-background-warm">
        <Container className="py-6">
          <div className="aspect-[16/9] relative rounded-xl overflow-hidden bg-background-cream flex items-center justify-center text-foreground-subtle">
            <Building2 className="h-20 w-20" />
          </div>
        </Container>
      </div>
    );
  }

  const remaining = Math.max(0, total - 3);

  return (
    <>
      {/* Static 3-up grid */}
      <div className="bg-background-warm">
        <Container className="py-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Hero — first image */}
            <button
              type="button"
              onClick={() => setLightboxIdx(0)}
              className="md:col-span-2 aspect-[4/3] relative rounded-xl overflow-hidden bg-background-cream group"
              aria-label={`Open photo 1 of ${total}`}
            >
              <Image
                src={images[0]}
                alt={`${altPrefix} (photo 1)`}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-caption font-medium text-white">
                <Expand className="h-3.5 w-3.5" /> View
              </div>
            </button>

            {/* Two thumbnails (positions 2 + 3) */}
            <div className="grid grid-rows-2 gap-3">
              {[1, 2].map(i => {
                const hasImg = !!images[i];
                const showPlusOverlay = i === 2 && remaining > 0;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => hasImg && setLightboxIdx(i)}
                    disabled={!hasImg}
                    className="aspect-[4/3] relative rounded-xl overflow-hidden bg-background-cream group disabled:cursor-default"
                    aria-label={hasImg ? `Open photo ${i + 1} of ${total}` : 'No photo'}
                  >
                    {hasImg ? (
                      <>
                        <Image
                          src={images[i]}
                          alt={`${altPrefix} (photo ${i + 1})`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        {showPlusOverlay && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="font-heading text-display-sm font-bold text-white" aria-hidden="true">
                              +{remaining}
                            </span>
                            <span className="sr-only">{remaining} more photos</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-foreground-subtle">
                        <Building2 className="h-10 w-10" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {total > 3 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setLightboxIdx(0)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-body-sm font-semibold text-primary hover:border-gold hover:text-gold-dark transition-colors"
              >
                <Expand className="h-4 w-4" />
                View all {total} photos
              </button>
            </div>
          )}
        </Container>
      </div>

      {/* Lightbox overlay */}
      {isOpen && lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${lightboxIdx + 1} of ${total}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
            aria-label="Close photo gallery"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxIdx + 1} / {total}
          </div>

          {/* Prev arrow (hidden on mobile — swipe instead) */}
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 sm:left-6 z-10 hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Main image */}
          <div
            className="relative w-full max-h-[88vh] flex items-center justify-center px-4 sm:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIdx]}
              alt={`${altPrefix} (photo ${lightboxIdx + 1})`}
              className="max-h-[88vh] max-w-full w-auto h-auto object-contain rounded-lg select-none"
              draggable={false}
            />
          </div>

          {/* Next arrow */}
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 sm:right-6 z-10 hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {/* Mobile-friendly tap zones (left/right halves trigger prev/next) */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-0 top-20 bottom-24 w-1/4 sm:hidden"
                aria-label="Previous photo"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-0 top-20 bottom-24 w-1/4 sm:hidden"
                aria-label="Next photo"
              />
            </>
          )}

          {/* Thumbnail strip */}
          {total > 1 && (
            <div
              className="absolute inset-x-0 bottom-4 flex justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-2 max-w-[92vw] overflow-x-auto px-4 py-2 scrollbar-thin">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                    className={`relative h-14 w-20 shrink-0 rounded overflow-hidden transition-all ${
                      i === lightboxIdx
                        ? 'ring-2 ring-gold ring-offset-2 ring-offset-black'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === lightboxIdx}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
