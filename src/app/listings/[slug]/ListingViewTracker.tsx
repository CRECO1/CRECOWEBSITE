'use client';

import { useEffect } from 'react';
import { trackViewItem } from '@/lib/analytics';

/**
 * Fires GA4 `view_item` once per detail-page view. The page itself is a server
 * component (ISR-cached), so the event can't be emitted there — this mounts as
 * a null-rendering client child and reports the property the moment it hydrates.
 * Commercial fields only (no beds/baths); see trackViewItem for the value rule.
 */
export function ListingViewTracker(props: {
  id: string;
  name: string;
  sale_price?: number | null;
  lease_rate?: number | null;
  city?: string | null;
  submarket?: string | null;
  property_type?: string | null;
  transaction_type?: string | null;
  sqft?: number | null;
}) {
  useEffect(() => {
    trackViewItem(props);
    // Fire exactly once for this listing; re-running on prop identity churn
    // would double-count a single view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);
  return null;
}
