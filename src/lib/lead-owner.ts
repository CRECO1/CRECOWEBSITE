import { getLeadBackup, type Broker } from './broker';

/**
 * Where the internal "new lead" alert goes.
 *
 * It used to go only to LEAD_NOTIFICATION_EMAIL (the shared info@ inbox), so
 * the person who has to call the lead back learned about it second-hand, if
 * at all. Every alert now also goes straight to the lead's owner and their
 * backup — see getLeadOwner() / getLeadBackup() in lib/broker.ts (Zack owns
 * his listings, Brian the rest, and each is secondary on the other's).
 */
export function leadAlertRecipients(owner: Broker): string[] {
  const inbox = (process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com').trim();
  const emails = [inbox, owner.alert_email, getLeadBackup(owner).alert_email];
  return Array.from(new Set(emails.filter(Boolean).map(e => e.trim().toLowerCase())));
}

/** The owner + backup CRM logins, as the CRM webhook / pushToCrm expect them. */
export function leadCrmOwners(owner: Broker): { owner_email: string; backup_email: string } {
  return { owner_email: owner.crm_profile_email, backup_email: getLeadBackup(owner).crm_profile_email };
}
