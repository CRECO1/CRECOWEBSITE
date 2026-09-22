import { ImageResponse } from 'next/og';

// Branded share card for the 8000 Fair Oaks Plaza landing page — same composition
// as the listing cards (photo + scrim + name, address, chips, CRECO mark) so a
// shared link or an AI citation shows the property, not the generic site card.
// The page is hand-built (not a DB listing), so the data is inline.
export const runtime = 'nodejs';
export const alt = '8000 Fair Oaks Plaza — retail bays and executive office suites for lease in Fair Oaks Ranch, TX';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GOLD = '#C9A962';
const INK = '#1A1A1A';
// Absolute URL: satori fetches the photo itself, and reading public/ from disk is not
// reliable on Vercel. Plain JPEG — satori doesn't decode the optimizer's WebP/AVIF.
const PHOTO = 'https://www.crecotx.com/properties/8000-fair-oaks-pkwy/retail-strip-wide.jpg';

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: INK, fontFamily: 'sans-serif' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTO} width={1200} height={630} style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, objectFit: 'cover' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex', backgroundImage: 'linear-gradient(to bottom, rgba(26,26,26,0.10), rgba(26,26,26,0.55) 55%, rgba(26,26,26,0.96))' }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '44px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 42, fontWeight: 800, letterSpacing: 3, color: '#ffffff' }}>
            CRE<span style={{ color: GOLD }}>CO</span>
          </div>
          <div style={{ display: 'flex', backgroundColor: GOLD, color: INK, fontSize: 24, fontWeight: 700, padding: '10px 24px', borderRadius: 999, letterSpacing: 1 }}>FOR LEASE</div>
        </div>

        <div style={{ flex: 1, display: 'flex' }} />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '0 56px 56px' }}>
          <div style={{ display: 'flex', fontSize: 62, fontWeight: 800, color: '#ffffff', lineHeight: 1.05, maxWidth: 1040 }}>8000 Fair Oaks Plaza</div>
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.82)', marginTop: 14 }}>8000 Fair Oaks Pkwy, Fair Oaks Ranch, TX</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 28 }}>
            <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, color: GOLD, marginRight: 26 }}>Retail bays + executive office suites</div>
            <div style={{ display: 'flex', fontSize: 26, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.14)', padding: '8px 18px', borderRadius: 10, marginRight: 14 }}>Retail</div>
            <div style={{ display: 'flex', fontSize: 26, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.14)', padding: '8px 18px', borderRadius: 10 }}>Office</div>
          </div>
        </div>

        <div style={{ position: 'absolute', right: 56, bottom: 26, display: 'flex', fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>crecotx.com</div>
      </div>
    ),
    { ...size },
  );
}
