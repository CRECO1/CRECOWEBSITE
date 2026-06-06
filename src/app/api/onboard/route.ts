/**
 * POST /api/onboard
 *
 * Single endpoint that turns "I want to try VultStack" into a working
 * workspace in one HTTP call. The flow:
 *
 *   1. Validate the form payload (brokerage name, admin email, password).
 *   2. Create the Supabase auth user (Supabase emails a verification link).
 *   3. Generate a URL-safe slug from the brokerage name; resolve collisions.
 *   4. Create the workspaces row.
 *   5. Add the admin user to workspace_members.
 *   6. Seed the workspace's invoice_settings row (defaults — operator
 *      customizes via /billing/invoices/settings).
 *
 * If any step after the auth-user creation fails, we attempt cleanup so
 * we don't end up with a half-onboarded state (auth user with no
 * workspace, or workspace with no admin). Auth users can't be deleted
 * from a public-facing endpoint without service-role privileges, so the
 * compensating logic uses the same service-role client.
 *
 * Returns 200 with { workspace_slug } on success — the client redirects
 * to /onboard/welcome which surfaces the verify-your-email reminder.
 *
 * Auth: public. Throttled by the existing per-IP rate limiter so
 * automated abuse can't spin up a hundred workspaces per minute. The
 * actual long-term protection is reCAPTCHA / Cloudflare Turnstile in
 * front of the signup form, which we'll add when we see traffic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clampString, isValidEmail, MAX_LEN } from '@/lib/sanitize';
import { enforceRateLimit } from '@/lib/rate-limit';
import { FALLBACK_TEMPLATE } from '@/lib/invoice-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OnboardBody {
  brokerage_name?: string;
  admin_email?: string;
  admin_password?: string;
  /** Honeypot — bots fill it, humans don't (CSS-hidden). Silent accept. */
  website?: string;
}

const PASSWORD_MIN = 10;
const PASSWORD_MAX = 128;

/**
 * Slug derivation: lowercase, ASCII-only, hyphen-separated. Handles the
 * common cases (spaces → hyphens, & → and, punctuation stripped) and
 * caps length so the URL doesn't get absurd.
 */
function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    || 'workspace';
}

/**
 * Resolve a slug collision by appending a numeric suffix. Tries the bare
 * slug first, then -2, -3, ... up to -50 before giving up. 50 is plenty
 * even for a popular brokerage name; if we hit it we have a bigger SEO
 * problem.
 */
async function pickUniqueSlug(supabase: SupabaseClient, base: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  throw new Error('Could not find an available slug after 50 tries');
}

export async function POST(req: NextRequest) {
  // Throttle abuse before we touch the DB or auth provider. 5 signups
  // per IP per minute is generous for legit traffic (a single broker
  // signing themselves up + retrying once or twice) and tight enough
  // to make scripted creation pointless.
  const limited = enforceRateLimit(req, {
    namespace: 'onboard',
    max: 5,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let body: OnboardBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Honeypot — silent accept so the bot thinks it succeeded.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ ok: true, brokerage_slug: 'spam-honeypot' });
  }

  // Validate inputs. We're explicit about each failure so the UI can
  // highlight the offending field rather than show a generic "try again".
  const brokerageName = clampString(body.brokerage_name, MAX_LEN.company);
  if (!brokerageName || brokerageName.length < 2) {
    return NextResponse.json({ error: 'Brokerage name is required (2+ characters)' }, { status: 400 });
  }
  if (!isValidEmail(body.admin_email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  const adminEmail = (body.admin_email as string).trim().toLowerCase();
  const password = typeof body.admin_password === 'string' ? body.admin_password : '';
  if (password.length < PASSWORD_MIN) {
    return NextResponse.json({ error: `Password must be at least ${PASSWORD_MIN} characters` }, { status: 400 });
  }
  if (password.length > PASSWORD_MAX) {
    return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
  }

  // Service-role client. Required for:
  //   - Creating an auth user with email_confirm:false (we let Supabase
  //     send the verification email; the user can't sign in until they
  //     verify, but their workspace exists and waits for them).
  //   - Inserting into workspaces + workspace_members where RLS blocks
  //     un-authenticated public writes.
  //   - Compensating cleanup if a later step fails.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('[onboard] SUPABASE_SERVICE_ROLE_KEY not configured');
    return NextResponse.json({ error: 'Onboarding is not configured' }, { status: 503 });
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Step 1 — auth user. `email_confirm: false` means Supabase emails the
  // verification link as part of createUser. The user can't sign in
  // until they click it.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: false,
    user_metadata: { brokerage_name: brokerageName },
  });
  if (createErr || !created.user) {
    // Most common cause: email already exists. Surface a specific
    // message so the UI can link to /manage/login.
    const msg = createErr?.message ?? 'Could not create account';
    const isDuplicate = /already (registered|exists)/i.test(msg);
    return NextResponse.json(
      {
        error: isDuplicate
          ? 'An account with this email already exists. Sign in instead.'
          : msg,
        duplicate: isDuplicate,
      },
      { status: isDuplicate ? 409 : 500 },
    );
  }
  const userId = created.user.id;

  // From here, any failure should attempt cleanup of the auth user we
  // just created. Otherwise the operator gets a "this email already
  // exists" on their next attempt and can't proceed.
  async function cleanupAuthUser() {
    try { await admin.auth.admin.deleteUser(userId); }
    catch (e) {
      console.error('[onboard] cleanup auth user failed:', (e as Error).message);
    }
  }

  // Step 2 — pick a unique slug.
  let slug: string;
  try {
    slug = await pickUniqueSlug(admin, deriveSlug(brokerageName));
  } catch (e) {
    await cleanupAuthUser();
    console.error('[onboard] slug resolution failed:', (e as Error).message);
    return NextResponse.json({ error: 'Could not create workspace (slug)' }, { status: 500 });
  }

  // Step 3 — create the workspace row. 14-day trial by default.
  const trialEndsAt = new Date();
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 14);
  const { data: workspace, error: wsErr } = await admin
    .from('workspaces')
    .insert([{
      slug,
      name: brokerageName,
      owner_email: adminEmail,
      subscription_status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
    }])
    .select('id, slug')
    .single();
  if (wsErr || !workspace) {
    await cleanupAuthUser();
    console.error('[onboard] workspaces insert failed:', wsErr?.message);
    return NextResponse.json({ error: 'Could not create workspace' }, { status: 500 });
  }

  // Step 4 — add the admin to workspace_members.
  const { error: memErr } = await admin
    .from('workspace_members')
    .insert([{
      workspace_id: workspace.id,
      user_id: userId,
      email: adminEmail,
      role: 'admin',
    }]);
  if (memErr) {
    // Compensate: delete the workspace too so we leave nothing orphaned.
    await admin.from('workspaces').delete().eq('id', workspace.id);
    await cleanupAuthUser();
    console.error('[onboard] workspace_members insert failed:', memErr.message);
    return NextResponse.json({ error: 'Could not seat admin in workspace' }, { status: 500 });
  }

  // Step 5 — seed invoice_settings with defaults. Operator customizes
  // these on /billing/invoices/settings; the seed just guarantees the
  // upsert(onConflict='workspace_id') in the settings page hits an
  // existing row rather than racing the first save.
  const { error: settingsErr } = await admin
    .from('invoice_settings')
    .insert([{
      workspace_id: workspace.id,
      default_subject: FALLBACK_TEMPLATE.default_subject,
      default_message: FALLBACK_TEMPLATE.default_message,
      late_fee_enabled: false,
    }]);
  if (settingsErr) {
    // Non-fatal: the settings page upsert handles missing rows. Log
    // for visibility but don't roll back the workspace.
    console.warn('[onboard] invoice_settings seed failed (non-fatal):', settingsErr.message);
  }

  return NextResponse.json({
    ok: true,
    workspace_slug: workspace.slug,
    email_verification_required: true,
  });
}
