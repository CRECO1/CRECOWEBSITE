/**
 * Server-side PDF rendering for an invoice. Returns a Uint8Array so we can
 * stream it as a download or attach it to an email — same generator used by
 * both /api/invoices/[id]/pdf and /api/invoices/[id]/send.
 *
 * Style is intentionally clean and CRECO-branded (black header bar, gold
 * accent line, generous whitespace). No external fonts — jsPDF's built-in
 * Helvetica is the path that keeps the bundle small and the runtime fast.
 */

import type { Invoice, InvoiceLineItem } from './invoices';
import { formatMoney, formatDate } from './invoices';
import { getLogoLightDataUri, LOGO_ASPECT } from './pdf-logo';

const CRECO_GOLD: [number, number, number] = [201, 169, 98];      // #C9A962
const CRECO_BLACK: [number, number, number] = [26, 26, 26];       // #1A1A1A
const MUTED: [number, number, number] = [120, 120, 120];

export async function renderInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
  // jsPDF is heavy, dynamic-import so the rest of the runtime doesn't pay
  // the load cost when invoices aren't being rendered.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const pageWidth = 216;   // letter, mm
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header — CRECO brand block ────────────────────────────────────────
  doc.setFillColor(...CRECO_BLACK);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Place the actual CRECO logo image (light/white variant) on the
  // black header. Falls back to text if the file can't be loaded.
  const logoDataUri = await getLogoLightDataUri();
  if (logoDataUri) {
    const logoHeight = 14;                            // mm of vertical space
    const logoWidth = logoHeight * LOGO_ASPECT;       // preserve aspect
    const logoY = (26 - logoHeight) / 2;              // vertically centered
    doc.addImage(logoDataUri, 'PNG', margin, logoY, logoWidth, logoHeight);
  } else {
    // Dev-only fallback (file missing). Looks like the old header.
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CRECO', margin, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text('Commercial Real Estate Company', margin, 21);
  }

  // Right side: INVOICE label + number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...CRECO_GOLD);
  doc.text('INVOICE', pageWidth - margin, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 220, 220);
  doc.text(invoice.invoice_number, pageWidth - margin, 21, { align: 'right' });

  // Gold accent line under header
  doc.setDrawColor(...CRECO_GOLD);
  doc.setLineWidth(0.6);
  doc.line(0, 26, pageWidth, 26);

  y = 38;

  // ── From / Bill To columns ────────────────────────────────────────────
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', margin, y);
  doc.text('BILL TO', margin + contentWidth / 2, y);

  doc.setTextColor(...CRECO_BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CRECO – Commercial Real Estate Company', margin, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    [
      '8000 Fair Oaks Pkwy, Suite 102',
      'Fair Oaks Ranch, TX 78015',
      '(210) 817-3443',
      'info@crecotx.com',
      'TREC #9014367-BB',
    ],
    margin,
    y + 11,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.client_name, margin + contentWidth / 2, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const billLines: string[] = [];
  if (invoice.client_company) billLines.push(invoice.client_company);
  if (invoice.client_address) {
    invoice.client_address.split('\n').forEach(line => billLines.push(line));
  }
  billLines.push(invoice.client_email);
  doc.text(billLines, margin + contentWidth / 2, y + 11);

  y += 38;

  // ── Meta block: dates + property reference ────────────────────────────
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(250, 250, 248);
  doc.rect(margin, y, contentWidth, 16, 'FD');

  const metaCols: { label: string; value: string }[] = [
    { label: 'Issue date', value: formatDate(invoice.issue_date) },
    { label: 'Due date', value: formatDate(invoice.due_date) },
    { label: 'Terms', value: invoice.payment_terms ?? 'Net 30' },
  ];
  if (invoice.property_reference) {
    metaCols.push({ label: 'Property', value: invoice.property_reference });
  }

  const colWidth = contentWidth / metaCols.length;
  metaCols.forEach((col, i) => {
    const cx = margin + colWidth * i + 4;
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(col.label.toUpperCase(), cx, y + 5);
    doc.setTextColor(...CRECO_BLACK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(col.value, cx, y + 12);
  });

  y += 24;

  // ── Line items table ──────────────────────────────────────────────────
  // Column layout: Description (flex) | Qty | Rate | Amount
  const colDesc = margin;
  const colQty = margin + contentWidth - 70;
  const colRate = margin + contentWidth - 45;
  const colAmt = margin + contentWidth;

  // Header
  doc.setFillColor(...CRECO_BLACK);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description', colDesc + 2, y + 5.5);
  doc.text('Qty', colQty, y + 5.5, { align: 'right' });
  doc.text('Rate', colRate, y + 5.5, { align: 'right' });
  doc.text('Amount', colAmt - 2, y + 5.5, { align: 'right' });

  y += 8;

  // Body rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...CRECO_BLACK);

  const items = invoice.line_items ?? [];
  items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 248);
      doc.rect(margin, y, contentWidth, 10, 'F');
    }
    const descLines = doc.splitTextToSize(item.description || '', colQty - colDesc - 8);
    const rowHeight = Math.max(10, 5 + descLines.length * 4.5);

    doc.setTextColor(...CRECO_BLACK);
    doc.text(descLines, colDesc + 2, y + 6);
    doc.text(formatQty(item.quantity), colQty, y + 6, { align: 'right' });
    doc.text(formatMoney(item.rate), colRate, y + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(item.amount), colAmt - 2, y + 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += rowHeight;

    // Soft page break — leave room for totals + footer
    if (y > 230) {
      doc.addPage();
      y = margin;
    }
  });

  // ── Totals block ──────────────────────────────────────────────────────
  y += 4;
  const totalsX = margin + contentWidth - 70;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('Subtotal', totalsX, y + 5, { align: 'right' });
  doc.setTextColor(...CRECO_BLACK);
  doc.text(formatMoney(invoice.subtotal), colAmt - 2, y + 5, { align: 'right' });
  y += 6;

  if (invoice.tax_rate > 0) {
    doc.setTextColor(...MUTED);
    doc.text(`Tax (${(invoice.tax_rate * 100).toFixed(2).replace(/\.?0+$/, '')}%)`, totalsX, y + 5, { align: 'right' });
    doc.setTextColor(...CRECO_BLACK);
    doc.text(formatMoney(invoice.tax_amount), colAmt - 2, y + 5, { align: 'right' });
    y += 6;
  }

  // Heavy total line
  doc.setDrawColor(...CRECO_GOLD);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 5, y + 2, colAmt, y + 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...CRECO_BLACK);
  doc.text('TOTAL DUE', totalsX, y + 9, { align: 'right' });
  doc.setTextColor(...CRECO_GOLD);
  doc.text(formatMoney(invoice.total), colAmt - 2, y + 9, { align: 'right' });

  y += 18;

  // ── Payment instructions ──────────────────────────────────────────────
  doc.setFillColor(248, 244, 230);
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...CRECO_BLACK);
  doc.text('Payment', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CRECO_BLACK);

  const payLines: string[] = [];
  if (invoice.stripe_payment_link_url) {
    payLines.push('Pay online (card or ACH): ' + invoice.stripe_payment_link_url);
  }
  payLines.push('Mail check to: 8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015');
  payLines.push('Make checks payable to: CRECO – Commercial Real Estate Company');
  doc.text(payLines, margin + 4, y + 13);

  y += 28;

  // ── Notes ─────────────────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('NOTES', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...CRECO_BLACK);
    const notesLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(notesLines, margin, y + 4);
    y += notesLines.length * 4 + 6;
  }

  // ── Footer ────────────────────────────────────────────────────────────
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(margin, 268, pageWidth - margin, 268);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    'CRECO – Commercial Real Estate Company  ·  TREC #9014367-BB  ·  crecotx.com',
    pageWidth / 2,
    273,
    { align: 'center' },
  );
  doc.text('Questions? (210) 817-3443  ·  info@crecotx.com', pageWidth / 2, 277, { align: 'center' });

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/** "1", "2.5", "10.25" — strips trailing zeros so qty=1 doesn't read "1.0000". */
function formatQty(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(4).replace(/\.?0+$/, '');
}
