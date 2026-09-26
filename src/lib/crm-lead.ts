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
  type?: 'Buyer' | 'Seller' | 'Tenant' | 'Landlord/Investor' | 'Agent' | 'Broker';
  tags?: string[];

  /**
   * Attribution. The CRM webhook reads every one of these as a top-level field
   * and derives `channel` from them — but this interface never declared them,
   * so the call sites had nothing to pass and every crecotx lead arrived with
   * no source while Fair Oaks and Elkhorn arrived complete. The values were
   * being captured into this site's own `leads` table the whole time; they
   * just never crossed. All optional: a path that genuinely has no attribution
   * (a direct visit with no referrer) sends nothing rather than empty strings.
   */
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  /** Path of the page the form was submitted from. */
  page_path?: string | null;
  /** Placement id within that page, where the form reports one. */
  surface?: string | null;
  /** Coarse city/region from the edge. Never an IP. */
  geo?: string | null;
  device?: string | null;
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
        // Set here rather than at each call site: it is constant for this site,
        // and a caller cannot forget it. The CRM uses it to separate crecotx
        // leads from the Fair Oaks and Elkhorn feeds.
        lead_site: 'crecotx.com',
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
