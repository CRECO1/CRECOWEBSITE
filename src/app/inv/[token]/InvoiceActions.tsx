'use client';

import { useEffect } from 'react';

/**
 * Runs in the visitor's browser. A mail scanner that only fetches the page's HTML never executes this, so
 * "view" means a real browser rendered the invoice. Clicks on the buttons are logged the same way (a
 * server-side GET would be triggered by link prefetchers).
 */
function log(token: string, kind: 'view' | 'pdf' | 'pay_click') {
  try {
    const body = JSON.stringify({ kind });
    if (navigator.sendBeacon) navigator.sendBeacon(`/api/inv/${token}/seen`, new Blob([body], { type: 'text/plain' }));
    else fetch(`/api/inv/${token}/seen`, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch { /* tracking must never break the page */ }
}

export default function InvoiceActions({ token, payUrl, showPay }: { token: string; payUrl: string | null; showPay: boolean }) {
  useEffect(() => { log(token, 'view'); }, [token]);
  const btn: React.CSSProperties = { display: 'inline-block', padding: '12px 22px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none', marginRight: 10, marginBottom: 10 };
  return (
    <div style={{ margin: '24px 0 8px' }}>
      {showPay && payUrl && (
        <a href={payUrl} onClick={() => log(token, 'pay_click')} style={{ ...btn, background: '#1A1A1A', color: '#C9A962' }}>Pay online</a>
      )}
      <a href={`/api/inv/${token}/pdf`} target="_blank" rel="noopener" onClick={() => log(token, 'pdf')} style={{ ...btn, background: '#fff', color: '#1A1A1A', border: '1px solid #1A1A1A' }}>Download PDF</a>
    </div>
  );
}
