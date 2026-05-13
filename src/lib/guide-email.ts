/**
 * Render a guide / market report as a styled HTML email body so prospects
 * who unlock it via /guides/<slug> keep a fully-formed copy in their inbox.
 *
 * We deliberately don't render to PDF — for these long-form text reports a
 * branded HTML email is more useful (forwardable, searchable, can be
 * printed to PDF by the reader). The email becomes the artifact.
 *
 * All user-controlled values (just the name) are escaped at the call site
 * before being passed in.
 */

import type { Guide } from '@/lib/guides';
import { escapeHtml } from '@/lib/sanitize';

const BRAND = {
  navy: '#1A1A1A',
  gold: '#C9A962',
  cream: '#FAFAF8',
  muted: '#525252',
  border: '#E8E5E0',
};

export function renderGuideEmailHtml(opts: { guide: Guide; recipientName: string }): string {
  const { guide, recipientName } = opts;
  const safeName = escapeHtml(recipientName || 'there');
  const safeTitle = escapeHtml(guide.title);

  const sectionsHtml = guide.sections.map(s => {
    const paragraphs = s.paragraphs.map(p => `<p style="margin:0 0 14px;line-height:1.65;color:#3B3B3B">${escapeHtml(p)}</p>`).join('');
    const bullets = s.bullets && s.bullets.length > 0
      ? `<ul style="margin:8px 0 16px;padding-left:22px;color:#3B3B3B;line-height:1.7">${s.bullets.map(b => `<li style="margin-bottom:6px">${escapeHtml(b)}</li>`).join('')}</ul>`
      : '';
    return `
      <h2 style="margin:28px 0 10px;color:${BRAND.navy};font-size:18px;line-height:1.35;font-family:Georgia,serif">${escapeHtml(s.heading)}</h2>
      ${paragraphs}
      ${bullets}
    `;
  }).join('');

  const conclusionHtml = guide.conclusion.map(p =>
    `<p style="margin:0 0 14px;line-height:1.65;color:#3B3B3B">${escapeHtml(p)}</p>`,
  ).join('');

  return `
<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:680px;margin:0 auto;padding:24px 18px;color:${BRAND.navy}">
    <!-- Header -->
    <div style="padding:0 0 20px;border-bottom:2px solid ${BRAND.gold};margin-bottom:24px">
      <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
        <img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0" />
      </a>
    </div>

    <!-- Intro -->
    <p style="color:${BRAND.muted};font-size:13px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1.5px">For ${escapeHtml(guide.audience)}s · ${guide.pageCount} pages · ${guide.readingMinutes} min read</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-family:Georgia,serif;color:${BRAND.navy}">${safeTitle}</h1>
    <p style="line-height:1.6;color:${BRAND.muted};margin:0 0 24px">${escapeHtml(guide.excerpt)}</p>

    <p style="line-height:1.6;color:${BRAND.muted};margin:0 0 8px">Hi ${safeName},</p>
    <p style="line-height:1.6;color:${BRAND.muted};margin:0 0 24px">Thanks for downloading from CRECO. Your full report is below — save it, search it, forward it to your team. We've also kept a copy on the site at <a href="https://www.crecotx.com/guides/${escapeHtml(guide.slug)}" style="color:${BRAND.gold}">crecotx.com/guides/${escapeHtml(guide.slug)}</a> in case you'd rather read it there.</p>

    <hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0" />

    <!-- The full report -->
    ${sectionsHtml}

    <hr style="border:none;border-top:1px solid ${BRAND.border};margin:28px 0 24px" />

    <h2 style="margin:0 0 10px;color:${BRAND.navy};font-size:18px;font-family:Georgia,serif">Closing thoughts</h2>
    ${conclusionHtml}

    <!-- CTA -->
    <div style="margin:32px 0 16px;padding:22px 24px;background:${BRAND.navy};border-radius:10px;text-align:center">
      <p style="color:#FFFFFF;font-size:15px;margin:0 0 14px;line-height:1.5">Have a specific Texas commercial real estate question this report didn't cover?</p>
      <a href="https://www.crecotx.com/get-started" style="display:inline-block;padding:11px 22px;background:${BRAND.gold};color:${BRAND.navy};text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
        Talk to a CRECO broker →
      </a>
      <p style="color:#999;font-size:12px;margin:14px 0 0">Or call <a href="tel:+12108173443" style="color:${BRAND.gold}">(210) 817-3443</a></p>
    </div>

    <p style="color:${BRAND.muted};font-size:12px;margin:24px 0 0;line-height:1.55">
      CRECO – Commercial Real Estate Company · TREC #9014367-BB<br/>
      8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015<br/>
      <a href="https://www.crecotx.com" style="color:${BRAND.gold}">crecotx.com</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
