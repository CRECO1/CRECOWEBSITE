import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';

/**
 * Unified subscribe endpoint — handles all 3 subscription types:
 *   - newsletter      (footer signup, /insights signup)
 *   - property-alerts (filter-driven listing alerts)
 *   - lead-magnet     (gated PDF/guide download)
 *
 * Inserts into public.subscribers, fires a confirmation email to the new
 * subscriber, and (for property-alerts and lead-magnet) notifies the team.
 *
 * Honeypot + reCAPTCHA + email validation all wired in like the leads
 * endpoint. If a subscriber re-submits with the same email + type, the
 * unique index lets the conflict bubble up — we treat it as success
 * (re-confirmation) rather than an error.
 */

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

const VALID_TYPES = ['newsletter', 'property-alerts', 'lead-magnet'] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, name, subscription_type, filters, source, asset_slug,
      recaptchaToken, website,
    } = body;

    // Honeypot — silent accept
    if (typeof website === 'string' && website.length > 0) {
      return NextResponse.json({ success: true });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!subscription_type || !VALID_TYPES.includes(subscription_type)) {
      return NextResponse.json({ error: 'Invalid subscription_type' }, { status: 400 });
    }

    // reCAPTCHA — fail-open if not configured
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Spam check failed' }, { status: 400 });
    }

    // Save to DB
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from('subscribers').insert([{
        email: email.trim().toLowerCase(),
        name: name ?? null,
        subscription_type,
        filters: filters ?? null,
        source: source ?? null,
        asset_slug: asset_slug ?? null,
      }]);
      // Duplicate (re-subscribe) is OK — treat as success
      if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.error('Subscriber insert error:', error.message);
      }
    }

    // Confirmation email to the subscriber
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const subscriberSubjects = {
        'newsletter': 'Welcome to CRECO Insights',
        'property-alerts': "We'll send you matching Texas properties",
        'lead-magnet': 'Your CRECO download is ready',
      };

      const subscriberBodies = {
        'newsletter': `<p>Thanks for subscribing to CRECO Insights. You'll receive market analysis, deal commentary, and Texas commercial real estate strategy roughly once a month — no spam, no fluff.</p>`,
        'property-alerts': `<p>You're set up to receive property alerts. As soon as a Texas commercial property matching your filters hits the CRECO listings, we'll send it your way.</p><p>Filters you set:</p><pre style="background:#FAFAF8;padding:12px;border-radius:4px">${JSON.stringify(filters ?? {}, null, 2)}</pre>`,
        'lead-magnet': `<p>Thanks for downloading from CRECO. Your guide is attached / available at the link you came from.</p><p>If you have a specific Texas commercial real estate situation you'd like to discuss, reply to this email or call (210) 817-3443.</p>`,
      };

      await resend.emails.send({
        from: getFromEmail(),
        to: email,
        subject: subscriberSubjects[subscription_type as keyof typeof subscriberSubjects],
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1A1A1A">Hi ${name ?? 'there'},</h2>
            ${subscriberBodies[subscription_type as keyof typeof subscriberBodies]}
            <br/>
            <p>— The CRECO Team<br/>San Antonio, TX · <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a></p>
          </div>
        `,
      });

      // Notify the team for property-alerts and lead-magnet (not for newsletter — too noisy)
      if (subscription_type !== 'newsletter') {
        await resend.emails.send({
          from: getFromEmail(),
          to: NOTIFICATION_EMAIL,
          subject: `New ${subscription_type} subscriber: ${email}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#1A1A1A">New subscriber — ${subscription_type}</h2>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
              ${source ? `<p><strong>Signed up from:</strong> ${source}</p>` : ''}
              ${asset_slug ? `<p><strong>Asset:</strong> ${asset_slug}</p>` : ''}
              ${filters ? `<p><strong>Filters:</strong></p><pre style="background:#FAFAF8;padding:12px;border-radius:4px">${JSON.stringify(filters, null, 2)}</pre>` : ''}
            </div>
          `,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
