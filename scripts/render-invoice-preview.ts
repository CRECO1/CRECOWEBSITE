/** Renders an invoice's email HTML + PDF to files (never sends). Usage: tsx scripts/render-invoice-preview.ts <invoice.json> <outDir> */
import { readFileSync, writeFileSync } from 'fs';
import { buildInvoiceEmailHtml } from '../src/lib/invoice-email-html';
import * as pdf from '../src/lib/invoice-pdf';

async function main() {
  const [file, out] = process.argv.slice(2);
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  // JSON flattened the Date objects to ISO strings; revive them as the pg driver gives them.
  for (const k of ['issue_date', 'due_date']) raw[k] = new Date(raw[k]);
  writeFileSync(out + '/email.html', '<body style="margin:0;padding:20px;background:#fff">' + buildInvoiceEmailHtml({ invoice: raw, message: 'Hi Dr. Baribeau,\n\nPlease find your invoice attached.' }) + '</body>');
  const fn = Object.values(pdf).find((f) => typeof f === 'function') as (i: unknown) => Promise<unknown>;
  const res: any = await fn(raw);
  writeFileSync(out + '/invoice.pdf', Buffer.from(res instanceof ArrayBuffer ? new Uint8Array(res) : (res as any)));
}
main();
