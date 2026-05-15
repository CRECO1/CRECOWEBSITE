/**
 * Server-side client statement PDF renderer.
 *
 * A statement is the periodic recap a service business sends to a client:
 * here's everything I billed you in this period, here's what you paid,
 * here's what's still outstanding. Different from an invoice — no
 * payment ask attached, just a clean activity ledger.
 *
 * Mirrors the styling of `invoice-pdf.ts` so the two read like a matched
 * pair when the client sees both in their inbox.
 */

import type { Invoice } from './invoices';
import { formatMoney, formatDate } from './invoices';
import { getLogoLightDataUri, LOGO_ASPECT } from './pdf-logo';

const CRECO_GOLD: [number, number, number] = [201, 169, 98];
const CRECO_BLACK: [number, number, number] = [26, 26, 26];
const MUTED: [number, number, number] = [120, 120, 120];
const BORDER: [number, number, number] = [232, 229, 224];

export interface StatementClient {
  name: string;
  email: string;
  company: string | null;
  address: string | null;
}

export interface StatementInput {
  client: StatementClient;
  periodStart: string;     // YYYY-MM-DD inclusive
  periodEnd: string;       // YYYY-MM-DD inclusive
  /** Invoices to include — caller pre-filters by client + date range. */
  invoices: Invoice[];
  /** Balance carried forward from before periodStart (sum of unpaid
   *  invoices outstanding at periodStart). Caller computes this so we
   *  don't have to re-query inside the renderer. */
  openingBalance: number;
}

export interface StatementSummary {
  openingBalance: number;
  totalCharged: number;
  totalPaid: number;
  closingBalance: number;
}

/**
 * Walk the invoices to build the running ledger + summary. Sorted
 * oldest-first so the statement reads top-down like a bank statement.
 *
 * Entries are interleaved: each invoice gets a "billed" entry on its
 * issue_date and a "payment" entry on its paid_at if paid in-period.
 * Out-of-period payments are folded into the opening balance.
 */
export interface StatementEntry {
  date: string;
  invoice_number: string;
  description: string;
  charges: number;       // positive when billed
  payments: number;      // positive when paid
  running_balance: number;
}

export function buildStatementLedger(input: StatementInput): {
  entries: StatementEntry[];
  summary: StatementSummary;
} {
  const { invoices, periodStart, periodEnd, openingBalance } = input;
  const entries: StatementEntry[] = [];
  let running = openingBalance;
  let totalCharged = 0;
  let totalPaid = 0;

  // Build a chronologically interleaved list. Issued and paid become
  // separate ledger entries; out-of-period activity is dropped.
  type Event = { date: string; kind: 'billed' | 'paid'; inv: Invoice };
  const events: Event[] = [];
  for (const inv of invoices) {
    if (inv.issue_date >= periodStart && inv.issue_date <= periodEnd) {
      events.push({ date: inv.issue_date, kind: 'billed', inv });
    }
    if (inv.paid_at) {
      const paidIso = inv.paid_at.slice(0, 10);
      if (paidIso >= periodStart && paidIso <= periodEnd) {
        events.push({ date: paidIso, kind: 'paid', inv });
      }
    }
  }
  events.sort((a, b) => (a.date < b.date ? -1 : 1));

  for (const e of events) {
    if (e.kind === 'billed') {
      const amt = Number(e.inv.total);
      running = Math.round((running + amt + Number.EPSILON) * 100) / 100;
      totalCharged += amt;
      entries.push({
        date: e.date,
        invoice_number: e.inv.invoice_number,
        description: `Invoice ${e.inv.invoice_number}${e.inv.property_reference ? ` — ${e.inv.property_reference}` : ''}`,
        charges: amt,
        payments: 0,
        running_balance: running,
      });
    } else {
      const amt = Number(e.inv.paid_amount ?? e.inv.total);
      running = Math.round((running - amt + Number.EPSILON) * 100) / 100;
      totalPaid += amt;
      entries.push({
        date: e.date,
        invoice_number: e.inv.invoice_number,
        description: `Payment received — Invoice ${e.inv.invoice_number}`,
        charges: 0,
        payments: amt,
        running_balance: running,
      });
    }
  }

  return {
    entries,
    summary: {
      openingBalance: Math.round((openingBalance + Number.EPSILON) * 100) / 100,
      totalCharged: Math.round((totalCharged + Number.EPSILON) * 100) / 100,
      totalPaid: Math.round((totalPaid + Number.EPSILON) * 100) / 100,
      closingBalance: Math.round((running + Number.EPSILON) * 100) / 100,
    },
  };
}

export async function renderStatementPdf(input: StatementInput): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const pageWidth = 216;
  const margin = 18;
  let y = margin;

  // ── Header ────────────────────────────────────────────────────────────
  doc.setFillColor(...CRECO_BLACK);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Logo image (with text fallback in dev when the file is missing).
  const logoDataUri = await getLogoLightDataUri();
  if (logoDataUri) {
    const logoHeight = 14;
    const logoWidth = logoHeight * LOGO_ASPECT;
    const logoY = (26 - logoHeight) / 2;
    doc.addImage(logoDataUri, 'PNG', margin, logoY, logoWidth, logoHeight);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CRECO', margin, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text('Commercial Real Estate Company', margin, 21);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...CRECO_GOLD);
  doc.text('STATEMENT', pageWidth - margin, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(`${formatDate(input.periodStart)} — ${formatDate(input.periodEnd)}`, pageWidth - margin, 21, { align: 'right' });

  y = 38;

  // ── Bill To + From blocks ─────────────────────────────────────────────
  doc.setTextColor(...CRECO_BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('STATEMENT FOR', margin, y);
  doc.text('FROM', pageWidth - margin - 70, y);

  doc.setTextColor(...CRECO_BLACK);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(input.client.name, margin, y + 6);
  doc.text('CRECO – Commercial Real Estate Company', pageWidth - margin - 70, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let leftY = y + 11;
  if (input.client.company) {
    doc.text(input.client.company, margin, leftY); leftY += 4;
  }
  if (input.client.address) {
    for (const line of input.client.address.split('\n')) {
      doc.text(line, margin, leftY); leftY += 4;
    }
  }
  doc.text(input.client.email, margin, leftY);

  let rightY = y + 11;
  doc.text('8000 Fair Oaks Pkwy, Suite 102', pageWidth - margin - 70, rightY); rightY += 4;
  doc.text('Fair Oaks Ranch, TX 78015', pageWidth - margin - 70, rightY); rightY += 4;
  doc.text('TREC #9014367-BB', pageWidth - margin - 70, rightY); rightY += 4;
  doc.text('(210) 817-3443', pageWidth - margin - 70, rightY);

  y = Math.max(leftY, rightY) + 12;

  // ── Ledger table ──────────────────────────────────────────────────────
  const { entries, summary } = buildStatementLedger(input);

  // Header row
  doc.setFillColor(...CRECO_BLACK);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', margin + 2, y + 5);
  doc.text('Description', margin + 28, y + 5);
  doc.text('Charges', pageWidth - margin - 42, y + 5, { align: 'right' });
  doc.text('Payments', pageWidth - margin - 22, y + 5, { align: 'right' });
  doc.text('Balance', pageWidth - margin - 2, y + 5, { align: 'right' });
  y += 7;

  // Opening balance line
  doc.setTextColor(...CRECO_BLACK);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Opening balance', margin + 28, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(formatMoney(summary.openingBalance), pageWidth - margin - 2, y + 5, { align: 'right' });
  y += 7;

  // Entries
  for (const e of entries) {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    doc.setDrawColor(...BORDER);
    doc.line(margin, y, pageWidth - margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...CRECO_BLACK);
    doc.text(formatDate(e.date), margin + 2, y + 5);

    // Description — truncate cleanly if too long
    const descMaxWidth = pageWidth - margin - 48 - 28;
    const desc = doc.splitTextToSize(e.description, descMaxWidth) as string[];
    doc.text(desc[0], margin + 28, y + 5);

    doc.text(e.charges > 0 ? formatMoney(e.charges) : '—', pageWidth - margin - 42, y + 5, { align: 'right' });
    doc.text(e.payments > 0 ? formatMoney(e.payments) : '—', pageWidth - margin - 22, y + 5, { align: 'right' });
    doc.text(formatMoney(e.running_balance), pageWidth - margin - 2, y + 5, { align: 'right' });
    y += 7;
  }

  // Closing balance
  doc.setDrawColor(...CRECO_BLACK);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Closing balance', margin + 28, y + 6);
  doc.setTextColor(...CRECO_GOLD);
  doc.text(formatMoney(summary.closingBalance), pageWidth - margin - 2, y + 6, { align: 'right' });
  y += 14;

  // ── Summary box ───────────────────────────────────────────────────────
  doc.setFillColor(250, 250, 248);
  doc.setDrawColor(...BORDER);
  doc.rect(margin, y, pageWidth - margin * 2, 26, 'FD');

  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PERIOD SUMMARY', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CRECO_BLACK);

  const labels = [
    ['Opening balance',       formatMoney(summary.openingBalance)],
    ['Charges this period',   formatMoney(summary.totalCharged)],
    ['Payments this period',  formatMoney(summary.totalPaid)],
    ['Closing balance',       formatMoney(summary.closingBalance)],
  ];
  let yLabel = y + 11;
  for (let i = 0; i < labels.length; i++) {
    doc.text(labels[i][0], margin + 4, yLabel);
    doc.text(labels[i][1], pageWidth - margin - 4, yLabel, { align: 'right' });
    yLabel += 4;
  }
  y += 30;

  // Footer
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text(
    'This statement is for informational purposes. Outstanding invoices keep their original payment links and due dates.',
    margin,
    280,
  );

  return new Uint8Array(doc.output('arraybuffer'));
}
