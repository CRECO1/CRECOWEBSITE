/**
 * Invoice email template + variable substitution.
 *
 * The Compose modal pulls defaults from the `invoice_settings` table (one
 * row, id=1), substitutes the {{variables}} against the current invoice,
 * and renders the result into the subject + message inputs the admin can
 * then edit before sending.
 *
 * If the table is empty (migration 0011 not yet run), we fall back to
 * the hard-coded defaults below so the UI keeps working — the admin sees
 * the same wording, they just can't edit it globally yet.
 */

import { formatMoney, formatDate, type Invoice } from './invoices';

export interface InvoiceEmailTemplate {
  default_subject: string;
  default_message: string;
}

export const FALLBACK_TEMPLATE: InvoiceEmailTemplate = {
  default_subject: 'Invoice {{invoice_number}} from CRECO — {{total}}',
  default_message: `Hi {{first_name}},

Please find your invoice attached. Let me know if you have any questions or want to walk through any of the line items.

Thanks for working with us.`,
};

/**
 * Variables the admin can drop into the subject or message. Listed here
 * (and in this order) so the settings page can render a helper chip-row.
 */
export const TEMPLATE_VARIABLES = [
  { token: '{{first_name}}',     description: "Greeting name: first word of the client name, or \"Dr. Smith\" style when the name starts with a title" },
  { token: '{{client_name}}',    description: "Client's full name" },
  { token: '{{company}}',        description: 'Client company (blank if not set)' },
  { token: '{{invoice_number}}', description: 'Invoice number (e.g. INV-2026-1001)' },
  { token: '{{total}}',          description: 'Total due, formatted (e.g. $5,000.00)' },
  { token: '{{due_date}}',       description: 'Due date, formatted (e.g. Apr 15, 2026)' },
  { token: '{{issue_date}}',     description: 'Issue date, formatted' },
  { token: '{{property}}',       description: 'Property reference (blank if not set)' },
  { token: '{{payment_terms}}',  description: 'Payment terms (e.g. Net 30)' },
] as const;

const HONORIFICS = new Set(['dr', 'mr', 'mrs', 'ms', 'mx', 'miss', 'prof', 'rev', 'hon', 'judge', 'sir']);
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'md', 'dds', 'dmd', 'od', 'phd', 'esq', 'cpa']);

/**
 * What an email should call the client: "Hi {{first_name}},". Normally the first
 * word ("Jane Smith" → "Jane"). When the name starts with a title, the first word
 * alone ("Dr.") makes a bad greeting, so the title is kept with the surname:
 * "Dr. Alan Baribeau" → "Dr. Baribeau". A name that is only a title is returned
 * as-is rather than guessed at.
 */
export function greetingName(fullName: string | null | undefined): string {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const norm = (w: string) => w.replace(/[.,]/g, '').toLowerCase();
  if (!HONORIFICS.has(norm(parts[0])) || parts.length === 1) return parts[0];
  const rest = parts.slice(1).filter(w => !NAME_SUFFIXES.has(norm(w)));
  const surname = rest[rest.length - 1];
  return surname ? `${parts[0]} ${surname}` : parts[0];
}

/**
 * Replace {{tokens}} in a template string against an invoice. Unknown tokens
 * pass through untouched so the admin sees what they typed if they make a
 * typo — better than silently disappearing.
 */
export function substituteTemplate(template: string, invoice: Invoice): string {
  if (!template) return '';
  const firstName = greetingName(invoice.client_name);
  const replacements: Record<string, string> = {
    '{{first_name}}':     firstName,
    '{{client_name}}':    invoice.client_name || '',
    '{{company}}':        invoice.client_company || '',
    '{{invoice_number}}': invoice.invoice_number || '',
    '{{total}}':          formatMoney(invoice.total),
    '{{due_date}}':       formatDate(invoice.due_date),
    '{{issue_date}}':     formatDate(invoice.issue_date),
    '{{property}}':       invoice.property_reference || '',
    '{{payment_terms}}':  invoice.payment_terms || 'Net 30',
  };
  let out = template;
  for (const [token, value] of Object.entries(replacements)) {
    // Escape the literal braces in the token for the regex
    const re = new RegExp(token.replace(/[{}]/g, '\\$&'), 'g');
    out = out.replace(re, value);
  }
  return out;
}
