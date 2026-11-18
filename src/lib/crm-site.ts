/**
 * Narrow actions the CRM performs for this site (unsubscribe, owner reports) via its secret-authenticated
 * /api/webhook/site endpoint. This site holds no CRM database key.
 */
const URL_ = (process.env.CRM_LEAD_WEBHOOK_URL ?? 'https://www.fairoaksrealtygroup.com/api/webhook/lead').replace(/\/lead$/, '/site');

export async function crmSite<T = Record<string, unknown>>(payload: Record<string, unknown>): Promise<{ status: number; data: T | null }> {
  const secret = process.env.CRM_LEAD_WEBHOOK_SECRET;
  if (!secret) return { status: 503, data: null };
  try {
    const res = await fetch(URL_, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { status: res.status, data };
  } catch (e) {
    console.error('[crm-site] unreachable:', e instanceof Error ? e.message : e);
    return { status: 503, data: null };
  }
}
