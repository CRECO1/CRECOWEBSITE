import { NextRequest, NextResponse } from 'next/server';
import { sendLeadToCrm } from '@/lib/crm-lead';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { escapeHtml, clampString, isValidEmail, safePhone, MAX_LEN } from '@/lib/sanitize';
import { checkFormTiming } from '@/lib/form-timing';
import { buildSignupContext } from '@/lib/signup-context';
import { checkEmailQuality } from '@/lib/email-quality';
import { pushToCrm } from '@/lib/crm';
import { enforceRateLimit } from '@/lib/rate-limit';
import { buildLeadNotificationEmail, leadNotificationSubject, type LeadAnswer } from '@/lib/lead-notification-email';
import { buildInquiryAutoreplyEmail, INQUIRY_AUTOREPLY_SUBJECT } from '@/lib/inquiry-autoreply-email';

/**
 * Unified inquiry endpoint — handles all 5 paths from /get-started:
 *   tenant   — looking for space to lease/buy
 *   buyer    — investor/owner-user acquisition
 *   seller   — wants to sell or list a property
 *   pm       — needs property management
 *   exploring — generic interest
 *
 * Saves to public.leads with `source = '<path>-inquiry'`, then sends a
 * formatted notification email with a path-specific subject so the broker
 * can triage at a glance.
 *
 * All user-controlled values are escaped before being interpolated into
 * HTML email bodies; email is validated strictly to block header injection.
 */

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

/**
 * `subject` doubles as the email's H1, so it reads as a sentence fragment a
 * human would write ("New Tenant Inquiry"), not a log tag ("Tenant Inquiry").
 */
const PATH_LABELS: Record<string, { subject: string; source: string; humanLabel: string }> = {
  tenant:    { subject: 'New Tenant Inquiry',              source: 'tenant-needs',      humanLabel: 'Looking for space' },
  buyer:     { subject: 'New Buyer / Investment Inquiry',  source: 'buyer-inquiry',     humanLabel: 'Looking to buy' },
  seller:    { subject: 'New Seller / Listing Inquiry',    source: 'owner-inquiry',     humanLabel: 'Want to sell or list' },
  pm:        { subject: 'New Property Management Inquiry', source: 'pm-inquiry',        humanLabel: 'Needs property management' },
  exploring: { subject: 'New Inquiry — Exploring',         source: 'exploring',         humanLabel: 'Just exploring' },
  agent:     { subject: 'New Agent Application',           source: 'agent-application', humanLabel: 'Wants to join CRECO as an agent' },
};

const FIELD_LABELS: Record<string, string> = {
  // shared
  property_types: 'Property type(s)',
  property_type: 'Property type',
  timeline: 'Timeline',
  notes: 'Notes',
  // tenant
  space_type: 'Space type(s)',
  transaction_type: 'Lease or buy',
  size: 'Size needed',
  budget: 'Monthly budget',
  submarket: 'Preferred area / zip codes',
  must_haves: 'Must-have features',
  // buyer
  acquisition_type: 'Acquisition type',
  exchange_1031: '1031 exchange?',
  submarkets: 'Preferred submarkets',
  priorities: 'Priorities',
  // seller
  value: 'Property value',
  address: 'Property address',
  goal: 'Sale priority',
  occupancy: 'Current occupancy',
  // pm
  portfolio_size: 'Portfolio size',
  current_pm: 'Current management',
  pain_point: 'Reason for change',
  portfolio_value: 'Portfolio value',
  service_area: 'Service area',
  // exploring
  interest: 'Area of interest',
  // agent application
  license_status: 'License status',
  license_number: 'TREC license #',
  years_experience: 'Years of experience',
  current_brokerage: 'Current brokerage',
  specialties: 'Specialties',
  primary_market: 'Primary market',
  why_creco: 'Why CRECO',
  linkedin: 'LinkedIn URL',
};

/**
 * Turn the raw answers object into labeled label/value pairs. Each value is
 * clamped to a sane length so a malicious submitter can't dump a megabyte of
 * input into a single field.
 *
 * The email renders these as table rows; `summarizeAnswers` flattens the same
 * pairs to the plain-text form stored on the lead row and pushed to the CRM.
 */
function answerEntries(answers: Record<string, unknown> | undefined | null): LeadAnswer[] {
  if (!answers) return [];
  return Object.entries(answers).map(([k, v]) => ({
    label: FIELD_LABELS[k] ?? k,
    value: Array.isArray(v)
      ? (v as unknown[]).map(x => clampString(x, MAX_LEN.shortField)).filter(Boolean).join(', ')
      : clampString(v, MAX_LEN.message),
  }));
}

/** Plain-text summary for storage + CRM (unchanged format). */
function summarizeAnswers(entries: LeadAnswer[]): string {
  return entries.map(({ label, value }) => `${label}: ${value}`).join('\n');
}

export async function POST(req: NextRequest) {
  // Per-IP rate limit before any parsing — bots hammering this endpoint
  // are the realistic threat. 8/min per IP is generous for a human
  // filling out a form (typical inquiry takes ~2-5 minutes) and tight
  // enough to throttle a scripted abuse loop. Layered on top of the
  // existing reCAPTCHA + honeypot — defense in depth.
  const limited = enforceRateLimit(req, {
    namespace: 'inquiry',
    max: 8,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await req.json();
    const ctx = buildSignupContext(req, body);
    const {
      path, name: rawName, company: rawCompany, email: rawEmail,
      phone: rawPhone, answers, recaptchaToken, website,
          utm_source: rawUtmSource, utm_medium: rawUtmMedium,
      utm_campaign: rawUtmCampaign, utm_term: rawUtmTerm,
      utm_content: rawUtmContent, referrer: rawReferrer,
      landing_page: rawLandingPage,
    } = body;

    // Honeypot — silent accept on bot
    if (typeof website === 'string' && website.length > 0) {
      return NextResponse.json({ success: true });
    }

    if (!path || typeof path !== 'string' || !PATH_LABELS[path]) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Timing — a post faster than a person can fill the form. Answered like
    // the honeypot above: success to the caller, nothing recorded.
    const timing = checkFormTiming((body as Record<string, unknown>).form_rendered_at);
    if (!timing.ok) {
      console.warn('[inquiry] rejected on timing', { reason: timing.reason, elapsedMs: timing.elapsedMs });
      return NextResponse.json({ success: true });
    }

    // Disposable domains and addresses whose domain cannot receive mail. This
    // one answers honestly — a real person who mistyped needs to know.
    const quality = await checkEmailQuality(rawEmail, { checkMx: true });
    if (!quality.ok) {
      console.warn('[inquiry] rejected on email quality', { reason: quality.reason, domain: quality.domain });
      return NextResponse.json({
        error: quality.reason === 'disposable'
          ? 'Please use a permanent email address.'
          : quality.reason === 'no-mx'
            ? "That email domain can't receive mail — check the spelling?"
            : 'Valid email is required',
      }, { status: 400 });
    }

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const name = clampString(rawName, MAX_LEN.name);
    const phone = safePhone(rawPhone);
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const company = clampString(rawCompany, MAX_LEN.company);

    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Spam check failed', reason: captcha.reason }, { status: 400 });
    }

    const meta = PATH_LABELS[path];
    // Recruiting is handled differently from a client inquiry at two points:
    // where the contact lands in the CRM, and whether we auto-reply at all.
    const isAgentApplication = path === 'agent';
    const entries = answerEntries(answers);
    const answerSummary = summarizeAnswers(entries);

    // Save lead
    let leadId: string | null = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Server-side write: use the service-role key. The publishable key is the
    // browser's anon key, and the anon role no longer has INSERT on this table
    // (see supabase/rls-anon-write-lockdown.sql). Falling back to it would log a
    // row-level-security error and silently drop the submission.
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) console.error('[inquiry] SUPABASE_SERVICE_ROLE_KEY is not set — the submission cannot be stored.');
    // Attribution. Visitor-controllable (anyone can hand-craft a utm_*), so
    // clamped like every other untrusted string — same treatment /api/leads
    // gives them. This route wrote to `leads` without ever reading these,
    // which is why get-started and career applications had no source.
    const utm_source   = clampString(rawUtmSource,   MAX_LEN.shortField) || null;
    const utm_medium   = clampString(rawUtmMedium,   MAX_LEN.shortField) || null;
    const utm_campaign = clampString(rawUtmCampaign, MAX_LEN.shortField) || null;
    const utm_term     = clampString(rawUtmTerm,     MAX_LEN.shortField) || null;
    const utm_content  = clampString(rawUtmContent,  MAX_LEN.shortField) || null;
    const referrer     = clampString(rawReferrer,    MAX_LEN.shortField) || null;
    const landing_page = clampString(rawLandingPage, MAX_LEN.shortField) || null;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('leads').insert([{
        name,
        email,
        phone,
        company: company || null,
        source: meta.source,
        status: 'new',
        intake_data: { path, ...answers },
        message: `${meta.humanLabel}\n\n${answerSummary}`,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        referrer, landing_page,
        // The same page/geo/device capture a subscriber gets — buildSignupContext
        // reads it off this request and the body, so a lead is no poorer than
        // a newsletter signup.
        context: {
          page_path: ctx.pagePath,
          page_url: ctx.pageUrl,
          page_title: ctx.pageTitle,
          referrer: ctx.referrer,
          geo: ctx.geo,
          device: ctx.device,
        },
      }]).select('id').single();

      // Also create the contact in the CRM (owner: the broker). Non-blocking.
      // Agent applications are people we may hire, not clients: they land in
      // the recruiting funnel (tagged Recruiting + Recruiting: Prospect) so
      // they never mix into the client pipeline.
      await sendLeadToCrm({
        name, email, phone, company,
        message: typeof meta?.subject === 'string' ? meta.subject : null,
        source: isAgentApplication
          ? 'Agent application — crecotx.com/careers'
          : `website — crecotx.com (${typeof path === 'string' ? path : 'inquiry'})`,
        type: isAgentApplication ? 'Agent' : 'Tenant',
        // The webhook already tags commercial contacts CRECO — don't duplicate it.
        tags: isAgentApplication ? ['Recruiting', 'Recruiting: Prospect'] : undefined,
      });
      if (error) console.error('[inquiry] DB insert failed:', error.message);
      else leadId = data?.id ?? null;
    }

    // Mirror to external CRM (noop if CRM_WEBHOOK_URL unset)
    await pushToCrm({
      event: 'inquiry.received',
      lead_id: leadId,
      source: meta.source,
      name,
      email,
      phone,
      company: company || null,
      message: `${meta.humanLabel}\n\n${answerSummary}`,
      metadata: { path, answers },
    });

    // Notification email — every interpolated value is escaped inside the
    // renderer to block any HTML injection in the broker's inbox.
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: getFromEmail(),
        to: NOTIFICATION_EMAIL,
        // Hitting reply in the broker's inbox goes straight to the lead
        // instead of to the no-reply sender.
        replyTo: email,
        subject: leadNotificationSubject({ heading: meta.subject, name, company }),
        html: buildLeadNotificationEmail({
          heading: meta.subject,
          pathLabel: meta.humanLabel,
          name,
          company,
          email,
          phone,
          answers: entries,
        }),
      });

      // Auto-reply to the prospect — same brand chrome as the internal copy.
      // Not for agent applicants: recruiting conversations start with a real
      // message from Zack, never an automated acknowledgement.
      if (!isAgentApplication) {
        await resend.emails.send({
          from: getFromEmail(),
          to: email,
          replyTo: NOTIFICATION_EMAIL,
          subject: INQUIRY_AUTOREPLY_SUBJECT,
          html: buildInquiryAutoreplyEmail({ name, pathLabel: meta.humanLabel }),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Inquiry submission error:', err);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
