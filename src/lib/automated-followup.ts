/**
 * One switch for every automated marketing follow-up email this site sends
 * to a prospect on its own schedule: the T+24hr lead nudge, the tour-request
 * sequence, and the Day-3 valuation follow-up.
 *
 * Off unless AUTOMATED_FOLLOWUP_EMAILS is exactly "on". The broker follows up
 * with his leads himself and decides when automated nurture starts; until he
 * sets the variable, no cron mails a client.
 *
 * Lead capture is unaffected — leads are still stored and still raise the
 * internal alert. And a disabled run reads nothing and writes nothing, so no
 * lead is quietly marked "followed up" while the switch is off.
 *
 * Deliberately NOT applied to the billing crons (invoice reminders, late
 * fees, recurring invoices): those are transactional notices about money
 * owed, not marketing, and silencing them would break rent collection.
 */
export function automatedFollowupEnabled(): boolean {
  return process.env.AUTOMATED_FOLLOWUP_EMAILS === 'on';
}

/** Body returned by a follow-up cron that is switched off. */
export function followupDisabledBody(job: string) {
  return {
    ok: true,
    job,
    skipped: 'disabled',
    reason: 'AUTOMATED_FOLLOWUP_EMAILS is not "on" — automated client follow-up email is off',
    followups_sent: 0,
  };
}
