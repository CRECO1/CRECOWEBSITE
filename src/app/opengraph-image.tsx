import { ImageResponse } from 'next/og';

/**
 * Default Open Graph image — used as the social-share preview when someone
 * pastes a crecotx.com URL into iMessage, Slack, LinkedIn, X, email, etc.
 *
 * Next.js renders this as a 1200×630 PNG at build time and serves it from
 * /opengraph-image. The metadata in layout.tsx automatically picks it up
 * for every page that doesn't override with its own.
 *
 * Brand: black background + gold gradient + Playfair-style serif feel.
 * Layout matches the hero of the homepage so the social preview feels like
 * the real site.
 */

export const runtime = 'edge';
export const alt = 'CRECO – Texas Commercial Real Estate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1A1A1A',
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(201, 169, 98, 0.20) 0%, transparent 55%), radial-gradient(circle at 10% 90%, rgba(201, 169, 98, 0.10) 0%, transparent 50%)',
          padding: 80,
          color: 'white',
          fontFamily: 'serif',
        }}
      >
        {/* Top eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: '#C9A962',
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <span style={{ width: 40, height: 2, backgroundColor: '#C9A962' }} />
          Texas Commercial Real Estate
        </div>

        {/* Main headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            marginBottom: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 110,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: 'white',
            }}
          >
            CRE
            <span
              style={{
                background: 'linear-gradient(135deg, #C9A962 0%, #E8DCC4 50%, #C9A962 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              CO
            </span>
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 36,
              lineHeight: 1.2,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: 900,
            }}
          >
            Retail · Industrial · Office — for tenants, owners, and investors across Texas
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid rgba(201, 169, 98, 0.4)',
            paddingTop: 24,
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#C9A962', fontWeight: 600 }}>crecotx.com</span>
            <span style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.55)' }}>San Antonio · Austin · Houston · DFW</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 600 }}>(210) 817-3443</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
