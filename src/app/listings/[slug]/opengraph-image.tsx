import { ImageResponse } from 'next/og';
import { getListingBySlug } from '@/lib/supabase';
import { formatPrice, formatSqft, formatLeaseRate, transactionLabel, propertyTypeLabel } from '@/lib/utils';

// Branded social-share card for each listing (Slack/LinkedIn/iMessage/X + AI
// citations). Replaces the raw first-photo OG with a composed card: property
// photo + a dark gradient + title, price, SF, and the CRECO mark.
export const runtime = 'nodejs';
export const alt = 'CRECO commercial real estate listing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GOLD = '#C9A962';
const INK = '#1A1A1A';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);

  const title = listing?.title ?? 'Commercial Real Estate';
  // Raw Supabase URL (guaranteed JPEG/PNG — satori doesn't reliably decode the
  // optimizer's WebP/AVIF output). Falls back to a photo-less branded card when
  // there's no image. The generated card is cached, so the one-time decode of a
  // larger source is acceptable.
  const photo = listing && Array.isArray(listing.images) && listing.images[0] ? listing.images[0] : null;

  const priceDisplay = listing
    ? (listing.transaction_type === 'sale' && listing.sale_price
        ? formatPrice(listing.sale_price)
        : listing.lease_rate
          ? formatLeaseRate(listing.lease_rate, listing.lease_rate_basis)
          : 'Contact for pricing')
    : '';
  const cityLine = listing
    ? [listing.address, listing.city, listing.state].filter(Boolean).join(', ')
    : 'Texas';
  const sf = listing?.sqft ? formatSqft(listing.sqft) : '';
  // Status-aware badge: closed deals (shown on-site as social proof) read
  // LEASED/SOLD rather than the transaction type, so the card isn't misleading.
  const badge = listing
    ? (listing.status === 'leased' ? 'LEASED'
      : listing.status === 'sold' ? 'SOLD'
      : (transactionLabel(listing.transaction_type) || '').toUpperCase())
    : '';
  const ptype = listing ? propertyTypeLabel(listing.property_type) : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          position: 'relative', backgroundColor: INK, fontFamily: 'sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo && (
          <img src={photo} width={1200} height={630}
            style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, objectFit: 'cover' }} />
        )}
        {/* Gradient scrim so the text is legible over any photo */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex',
          backgroundImage: photo
            ? 'linear-gradient(to bottom, rgba(26,26,26,0.10), rgba(26,26,26,0.55) 55%, rgba(26,26,26,0.96))'
            : 'linear-gradient(135deg, #1A1A1A, #2c2c2c)',
        }} />

        {/* Top bar: wordmark + transaction badge */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '44px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 42, fontWeight: 800, letterSpacing: 3, color: '#ffffff' }}>
            CRE<span style={{ color: GOLD }}>CO</span>
          </div>
          {badge && (
            <div style={{ display: 'flex', backgroundColor: GOLD, color: INK, fontSize: 24, fontWeight: 700, padding: '10px 24px', borderRadius: 999, letterSpacing: 1 }}>
              {badge}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex' }} />

        {/* Bottom content block */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '0 56px 56px' }}>
          <div style={{ display: 'flex', fontSize: 62, fontWeight: 800, color: '#ffffff', lineHeight: 1.05, maxWidth: 1040 }}>
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.82)', marginTop: 14 }}>{cityLine}</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 28 }}>
            {priceDisplay && (
              <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: GOLD, marginRight: 26 }}>{priceDisplay}</div>
            )}
            {sf && (
              <div style={{ display: 'flex', fontSize: 26, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.14)', padding: '8px 18px', borderRadius: 10, marginRight: 14 }}>{sf}</div>
            )}
            {ptype && (
              <div style={{ display: 'flex', fontSize: 26, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.14)', padding: '8px 18px', borderRadius: 10 }}>{ptype}</div>
            )}
          </div>
        </div>

        <div style={{ position: 'absolute', right: 56, bottom: 26, display: 'flex', fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>crecotx.com</div>
      </div>
    ),
    { ...size },
  );
}
