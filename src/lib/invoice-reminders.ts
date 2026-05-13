/**
 * Invoice payment-reminder schedule + templates.
 *
 * Six stages, each sent at most once per invoice. The cron job runs daily
 * and looks for invoices whose `due_date` puts them exactly in one of the
 * trigger offsets below. If a row in invoice_reminders already exists for
 * (invoice_id, stage), the unique index blocks the duplicate.
 *
 * Subject + intro are template strings — `{{variables}}` are substituted
 * against the invoice via substituteTemplate() from invoice-email.ts.
 */

import { substituteTemplate } from './invoice-email';
import type { Invoice } from './invoices';

export type ReminderStage =
  | 'due-soon'      // T-7
  | 'due-today'     // T+0
  | 'overdue-3'     // T+3
  | 'overdue-7'     // T+7
  | 'overdue-14'    // T+14
  | 'overdue-30';   // T+30 (final escalation; nothing after this)

export interface StageDefinition {
  stage: ReminderStage;
  /** Trigger offset in days from due_date. Positive = before, negative = past. */
  triggerDaysFromDue: number;   // 7 = "7 days before", -3 = "3 days past"
  label: string;
  /** Subject template — supports {{variables}}. */
  subject: string;
  /** Personal-message intro — supports {{variables}}. */
  intro: string;
}

export const REMINDER_STAGES: StageDefinition[] = [
  {
    stage: 'due-soon',
    triggerDaysFromDue: 7,
    label: 'Heads-up · 7 days before due',
    subject: 'Reminder: Invoice {{invoice_number}} due in 7 days',
    intro:
      "Hi {{first_name}},\n\nQuick heads-up that invoice {{invoice_number}} for {{total}} is due on {{due_date}}.\n\nNo action needed yet — just putting it on your radar. The original invoice is attached and the payment link is below if you'd like to take care of it early.",
  },
  {
    stage: 'due-today',
    triggerDaysFromDue: 0,
    label: 'Due today',
    subject: 'Invoice {{invoice_number}} is due today',
    intro:
      "Hi {{first_name}},\n\nInvoice {{invoice_number}} for {{total}} is due today. The original invoice is attached and the payment link is below.\n\nLet me know if you need anything to get this wrapped up.",
  },
  {
    stage: 'overdue-3',
    triggerDaysFromDue: -3,
    label: '3 days past due',
    subject: 'Past due: Invoice {{invoice_number}}',
    intro:
      "Hi {{first_name}},\n\nInvoice {{invoice_number}} for {{total}} was due {{due_date}}, and is now 3 days past due.\n\nIf payment is already on its way, disregard this note. Otherwise, the original invoice is attached and the payment link is below.",
  },
  {
    stage: 'overdue-7',
    triggerDaysFromDue: -7,
    label: '1 week past due',
    subject: 'Past due (1 week): Invoice {{invoice_number}}',
    intro:
      "Hi {{first_name}},\n\nInvoice {{invoice_number}} for {{total}} is now one week past due (due {{due_date}}).\n\nCould you confirm when we can expect payment? If there's an issue with the invoice, just reply and we'll sort it out.",
  },
  {
    stage: 'overdue-14',
    triggerDaysFromDue: -14,
    label: '2 weeks past due',
    subject: 'Action needed: Invoice {{invoice_number}} two weeks past due',
    intro:
      "Hi {{first_name}},\n\nInvoice {{invoice_number}} for {{total}} is now two weeks past due (due {{due_date}}).\n\nPlease reach out so we can talk through a path to resolution. Reply here or call (210) 817-3443.",
  },
  {
    stage: 'overdue-30',
    triggerDaysFromDue: -30,
    label: '30 days past due (final escalation)',
    subject: 'Outstanding invoice: {{invoice_number}} — please contact us',
    intro:
      "Hi {{first_name}},\n\nInvoice {{invoice_number}} for {{total}} has now been outstanding for 30 days.\n\nWe want to resolve this. Please reply to this email or call (210) 817-3443 — we can work with you on a payment plan if needed.",
  },
];

/**
 * Given a `due_date` and today's date, return the reminder stage that
 * fires today (if any). Returns null if today doesn't match any trigger
 * offset.
 *
 * Uses calendar-day math at noon UTC to avoid timezone drift around DST.
 */
export function stageForToday(due_date: string, todayIso?: string): ReminderStage | null {
  const today = new Date((todayIso ?? new Date().toISOString().slice(0, 10)) + 'T12:00:00Z');
  const due = new Date(due_date + 'T12:00:00Z');
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysFromDue = Math.round((due.getTime() - today.getTime()) / msPerDay);

  // Find the stage whose triggerDaysFromDue matches today's offset
  const match = REMINDER_STAGES.find(s => s.triggerDaysFromDue === daysFromDue);
  return match?.stage ?? null;
}

/** Render the (subject, message) for a stage against an invoice. */
export function renderReminderContent(
  stage: ReminderStage,
  invoice: Invoice,
): { subject: string; message: string } | null {
  const def = REMINDER_STAGES.find(s => s.stage === stage);
  if (!def) return null;
  return {
    subject: substituteTemplate(def.subject, invoice),
    message: substituteTemplate(def.intro, invoice),
  };
}
