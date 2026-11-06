import { enforceRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { AGENT_API_VERSION, AGENT_CONTACT, CACHE, CORS, listingsMarkdown, parseListQuery, publicListing, queryListings } from '@/lib/agent-api';
import { SITE_URL } from '@/lib/schema';

export const revalidate = 300;

/** GET /api/v1/listings: CRECO's available commercial listings. Filters and fields are documented at /api/openapi.json. */
export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit(req, { namespace: 'listings-api', max: 120, windowMs: 60_000 });
  if (limited) return limited;
  const sp = new URL(req.url).searchParams;
  const q = parseListQuery(sp);
  const { total, rows } = await queryListings(q).catch(() => ({ total: 0, rows: [] }));
  if (sp.get('format') === 'markdown') {
    return new NextResponse(listingsMarkdown(rows, total), { headers: { ...CORS, 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': CACHE } });
  }
  return NextResponse.json({
    data: rows.map(publicListing),
    meta: {
      api_version: AGENT_API_VERSION, total, count: rows.length, limit: q.limit, offset: q.offset,
      generated_at: new Date().toISOString(), docs: `${SITE_URL}/api/openapi.json`,
      terms: 'Public listing data, refreshed about every 5 minutes. Please attribute CRECO and link to the listing url. Confirm availability and terms with CRECO before relying on them.',
      contact: AGENT_CONTACT,
    },
  }, { headers: { ...CORS, 'Cache-Control': CACHE } });
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }
