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

export function transactionLabel(t: string | null | undefined): string {
  if (!t) return '';
  if (t === 'lease') return 'For Lease';
  if (t === 'sale') return 'For Sale';
  if (t === 'both') return 'Lease or Sale';
  return t;
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
  return map[t] ?? t;
}
