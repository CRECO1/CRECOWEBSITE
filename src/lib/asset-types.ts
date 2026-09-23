/**
 * The asset types an alert subscriber can ask for.
 *
 * One list, used by the inline card, the full /property-alerts form, the
 * notification email and the CRM tags, so a type selected on a pill is the
 * same string that reaches the CRM. Values match `listings.property_type`
 * ('warehouse' is the stored value for industrial) so a saved preference can
 * be matched against real inventory without a translation step.
 */
export interface AssetTypeOption {
  value: string;
  /** What the visitor taps. */
  label: string;
  /** What Zack reads in the notification and what lands as a CRM tag. */
  tag: string;
}

export const ALERT_ASSET_TYPES: AssetTypeOption[] = [
  { value: 'office',    label: 'Office',     tag: 'Office' },
  { value: 'warehouse', label: 'Industrial', tag: 'Industrial' },
  { value: 'retail',    label: 'Retail',     tag: 'Retail' },
  { value: 'flex',      label: 'Flex',       tag: 'Flex' },
  { value: 'land',      label: 'Land',       tag: 'Land' },
];

const BY_VALUE = new Map(ALERT_ASSET_TYPES.map(t => [t.value, t]));

/** Extra values the full form offers that the pills don't. */
const EXTRA_LABELS: Record<string, string> = { 'mixed-use': 'Mixed-Use', 'medical office': 'Medical Office' };

/** "warehouse" -> "Industrial". Unknown values are title-cased, never dropped. */
export function assetTypeLabel(value: string): string {
  const known = BY_VALUE.get(value);
  if (known) return known.tag;
  if (EXTRA_LABELS[value]) return EXTRA_LABELS[value];
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * "Industrial, Land" for the email and the CRM. An empty selection means the
 * subscriber wants everything, which is a real answer and says so.
 */
export function assetTypesSummary(values: unknown): string | null {
  if (!Array.isArray(values)) return null;
  const labels = values.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map(assetTypeLabel);
  if (labels.length === 0) return null;
  if (labels.length >= ALERT_ASSET_TYPES.length) return 'All types';
  return labels.join(', ');
}

/** The asset-type tags to put on the CRM contact. */
export function assetTypeTags(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(
    values.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map(assetTypeLabel),
  ));
}
