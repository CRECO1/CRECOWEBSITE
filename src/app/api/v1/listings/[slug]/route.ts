import { NextRequest, NextResponse } from 'next/server';
import { AGENT_API_VERSION, AGENT_CONTACT, CACHE, CORS, findListing, publicListing } from '@/lib/agent-api';
import { SITE_URL } from '@/lib/schema';

export const revalidate = 300;

/** GET /api/v1/listings/{slug}: one listing. A closed listing is still returned, with its `status` saying so. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = /^[a-z0-9-]{1,120}$/.test(slug) ? await findListing(slug) : null;
  if (!l) return NextResponse.json({ error: 'not_found', message: 'No listing with that slug. List current listings at /api/v1/listings.' }, { status: 404, headers: CORS });
  return NextResponse.json({
    data: publicListing(l),
    meta: { api_version: AGENT_API_VERSION, generated_at: new Date().toISOString(), docs: `${SITE_URL}/api/openapi.json`, contact: AGENT_CONTACT },
  }, { headers: { ...CORS, 'Cache-Control': CACHE } });
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }
