import { NextRequest, NextResponse } from 'next/server';
import { CORS } from '@/lib/agent-api';
import { handleAgentInquiryRequest } from '@/lib/agent-inquiry-submit';

export const dynamic = 'force-dynamic';

/** POST /api/v1/inquiries: see handleAgentInquiryRequest for what it requires, guards against and does. */
export async function POST(req: NextRequest) {
  return handleAgentInquiryRequest(req);
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } }); }
