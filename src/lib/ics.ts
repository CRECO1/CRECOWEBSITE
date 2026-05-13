/**
 * Minimal RFC 5545 ICS calendar invite generator. Used to attach a
 * .ics file to tour-confirmation emails so the prospect can click
 * once and have the tour land on their calendar.
 *
 * We don't import a full ICS library — the spec is small and our
 * use case is narrow (single event, no recurrence, no attendees
 * negotiation). Hand-rolling keeps the bundle tiny and the output
 * predictable.
 */

export interface IcsEvent {
  /** Unique stable ID across the event's lifetime — use the lead/tour-request ID. */
  uid: string;
  /** "Tour: 1234 Main St, San Antonio" — what appears in the calendar. */
  title: string;
  /** Multi-line description: address, broker contact, notes. */
  description: string;
  /** Property address (or where to meet). */
  location: string;
  /** Start time in ISO 8601 with offset (e.g., "2026-05-15T10:00:00-05:00"). */
  startIso: string;
  /** Duration in minutes. */
  durationMinutes: number;
  /** Organizer email (CRECO broker). */
  organizerEmail?: string;
  organizerName?: string;
}

/** Format a Date as ICS UTC timestamp: 20260515T150000Z */
function icsTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/** Escape ICS special characters per RFC 5545 §3.3.11 */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Build the full ICS file content. Returns a string suitable for either
 * file-download (`text/calendar`) or Resend attachment (UTF-8 buffer).
 */
export function buildIcs(event: IcsEvent): string {
  const start = new Date(event.startIso);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRECO//Tour Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscape(event.uid)}@crecotx.com`,
    `DTSTAMP:${icsTimestamp(now)}`,
    `DTSTART:${icsTimestamp(start)}`,
    `DTEND:${icsTimestamp(end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
    `LOCATION:${icsEscape(event.location)}`,
    event.organizerEmail
      ? `ORGANIZER;CN=${icsEscape(event.organizerName ?? 'CRECO')}:mailto:${event.organizerEmail}`
      : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  // ICS lines must end with CRLF per spec
  return lines.join('\r\n') + '\r\n';
}
