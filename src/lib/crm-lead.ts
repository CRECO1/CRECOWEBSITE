/**
 * Hand a crecotx.com web lead to the Fair Oaks CRM so it becomes a real contact.
 *
 * Website leads used to live only in this site's `leads` table plus an email to
 * the team: no CRM contact, no owner, no follow-up history. The CRM exposes a
 * secret-authenticated webhook (/api/webhook/lead) that de-duplicates on email
 * and creates the contact; this posts to it.
 *
 * Never blocks or fails a submission: the visitor's confirmation and the team
 * notification happen regardless, and a failure here is logged only.
 */
const CRM_LEAD_WEBHOOK_URL = process.env.CRM_LEAD_WEBHOOK_URL ?? 'https://www.fairoaksrealtygroup.com/api/webhook/lead';
const CRM_LEAD_WEBHOOK_SECRET = process.env.CRM_LEAD_WEBHOOK_SECRET;

export interface CrmLeadPayload {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  /** Where it came from, e.g. "website — crecotx.com (tour request)". */
  source: string;
  /** CRM contact type; the webhook falls back to Buyer for anything else. */
  type?: 'Buyer' | 'Seller' | 'Tenant' | 'Landlord/Investor';
  tags?: string[];
}

export async function sendLeadToCrm(lead: CrmLeadPayload): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!CRM_LEAD_WEBHOOK_SECRET) {
    console.warn('[crm-lead] CRM_LEAD_WEBHOOK_SECRET not set — lead not handed to the CRM');
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch(CRM_LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CRM_LEAD_WEBHOOK_SECRET}` },
      body: JSON.stringify({
        ...lead,
        business_unit: 'commercial',
        // The forms already email the team; one lead should not alert twice.
        notify: false,
        tags: ['Website', ...(lead.tags ?? [])],
        submitted_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[crm-lead] CRM webhook rejected the lead:', res.status, (await res.text()).slice(0, 200));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[crm-lead] CRM webhook unreachable:', err instanceof Error ? err.message : err);
    return { ok: false };
  }
}
