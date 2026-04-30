import { NextRequest, NextResponse } from 'next/server';
import { getListings } from '@/lib/supabase';

const VALID_STATUS = ['active', 'pending', 'sold', 'leased', 'all'] as const;
type Status = typeof VALID_STATUS[number];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('status') ?? 'active';
  const status: Status = (VALID_STATUS as readonly string[]).includes(raw) ? (raw as Status) : 'active';

  try {
    const listings = await getListings(status);
    return NextResponse.json({ listings });
  } catch {
    return NextResponse.json({ listings: [] });
  }
}
