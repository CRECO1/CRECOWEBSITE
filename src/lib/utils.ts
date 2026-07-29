import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatSqft(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toLocaleString()} SF`;
}

export function formatAcres(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ac`;
}

export function formatLeaseRate(rate: number | null | undefined, basis: string | null | undefined): string {
  if (rate == null) return '—';
  return `$${rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}/SF/yr${basis ? ` ${basis}` : ''}`;
}

/**
 * Compute the monthly base rent from a $/SF/yr rate + total SF.
 * Real-estate industry standard displays rate as $/SF/yr NNN, which is
 * accurate but non-intuitive for local operators (a diner tenant thinks
 * in $/month, not $/SF/yr). Exposing both formats side-by-side lets
 * institutional + owner-operator audiences both find their preferred
 * number without translation math. Returns null if either input is
 * missing so callers can render nothing rather than "$NaN/mo".
 */
export function monthlyLeaseRent(
  rate: number | null | undefined,
  sqft: number | null | undefined,
): number | null {
  if (rate == null || sqft == null || sqft <= 0) return null;
  return (rate * sqft) / 12;
}

/**
 * Formats the monthly equivalent for display. Rounded to whole dollars —
 * cents aren't meaningful at the monthly-rent scale and add visual noise.
 */
export function formatMonthlyRent(
  rate: number | null | undefined,
  sqft: number | null | undefined,
  basis?: string | null,
): string {
  const monthly = monthlyLeaseRent(rate, sqft);
  if (monthly == null) return '';
  return `$${Math.round(monthly).toLocaleString()}/mo${basis ? ` ${basis}` : ''}`;
}

/**
 * Builds a Google Maps "search" URL for an address. Used everywhere we
 * render a visible address — wraps it in a clickable link that opens
 * Maps with the address pre-searched. The `?api=1&query=` form is the
 * documented stable URL pattern (no API key, works on every device).
 */
export function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

export function transactionLabel(t: string | null | undefined): string {
  if (!t) return '';
  const map: Record<string, string> = {
    lease: 'For Lease',
    sale: 'For Sale',
    both: 'Lease or Sale',
  };
  return map[t] ?? titleCaseSlug(t);
}

export function propertyTypeLabel(t: string | null | undefined): string {
  if (!t) return '';
  const map: Record<string, string> = {
    office: 'Office',
    warehouse: 'Warehouse',
    flex: 'Flex',
    retail: 'Retail',
    land: 'Land',
    multifamily: 'Multifamily',
    'mixed-use': 'Mixed-Use',
    industrial: 'Industrial',
  };
  return map[t] ?? titleCaseSlug(t);
}

/** Turn "self-storage" / "data_center" → "Self Storage" / "Data Center" for custom types. */
function titleCaseSlug(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
