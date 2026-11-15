/**
 * ---------------------------------------------------------------------------
 * EMAIL ROUTING (EmailJS)
 * ---------------------------------------------------------------------------
 * Every form submission goes out through exactly TWO templates:
 *
 *   1. `admin`  → to you (the team inbox). Full internal detail.
 *   2. `user`   → to the merchant. Warm confirmation + their reference number.
 *
 * The same two templates are used for readiness assessments and for package
 * applications, so you only ever maintain two template IDs. What changes
 * between them is the set of variables passed in — the templates handle both
 * cases with conditional blocks.
 *
 * Setup
 * -----
 * 1. Create an account at https://dashboard.emailjs.com and add an email
 *    service (Gmail, Outlook, custom SMTP…). Copy its Service ID.
 * 2. Create two templates and copy their IDs.
 * 3. Put the three IDs plus your public key in `.env` (see `.env.example`).
 * 4. Paste the variable list from `TEMPLATE_VARIABLES` below into each
 *    template's body. Optional sections use the {{#if}} blocks shown.
 *
 * Without configuration the app still works — submissions are stored locally
 * and the UI tells the merchant to expect a manual follow-up rather than
 * silently pretending an email was sent.
 */

import emailjs from '@emailjs/browser';
import type { Application } from '../store';
import type { ReadinessReport } from '../types';
import { SITE } from '../config';
import { formatDateTime, money } from '../lib/utils';

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

export type EmailConfig = {
  serviceId: string;
  publicKey: string;
  adminTemplateId: string;
  userTemplateId: string;
  /** Overrides the template's To field for internal notifications. */
  adminEmail: string;
};

const env = import.meta.env;

/**
 * Shipped defaults for this deployment.
 *
 * Only the PUBLIC key belongs here — it is designed to be visible in the
 * browser bundle. Never place a private key or SMTP credential in this file or
 * in any `VITE_` variable: everything prefixed `VITE_` is compiled into public
 * JavaScript.
 *
 * Any `.env` value overrides the corresponding default, so the credentials can
 * be rotated without touching code.
 */
const DEFAULTS = {
  serviceId: 'service_engine',
  publicKey: 'QW0apJtjNMp6E4PP9',
  /** To YOU — internal notification. */
  adminTemplateId: 'template_2awtneq',
  /** To THE MERCHANT — confirmation. */
  userTemplateId: 'template_mrb3g7f',
} as const;

const pick = (envValue: unknown, fallback: string): string =>
  typeof envValue === 'string' && envValue.trim() ? envValue.trim() : fallback;

export const EMAIL_CONFIG: EmailConfig = {
  serviceId: pick(env.VITE_EMAILJS_SERVICE_ID, DEFAULTS.serviceId),
  publicKey: pick(env.VITE_EMAILJS_PUBLIC_KEY, DEFAULTS.publicKey),
  // Keep the admin/merchant mapping explicit: these two are easy to swap.
  adminTemplateId: pick(env.VITE_EMAILJS_ADMIN_TEMPLATE_ID, DEFAULTS.adminTemplateId),
  userTemplateId: pick(env.VITE_EMAILJS_USER_TEMPLATE_ID, DEFAULTS.userTemplateId),
  adminEmail: pick(env.VITE_EMAILJS_ADMIN_EMAIL, SITE.email),
};

/** True when both templates and the service are wired up. */
export function isEmailConfigured(config: EmailConfig = EMAIL_CONFIG): boolean {
  return Boolean(
    config.serviceId && config.publicKey && config.adminTemplateId && config.userTemplateId,
  );
}

let initialised = false;
function ensureInit(config: EmailConfig) {
  if (initialised) return;
  emailjs.init({ publicKey: config.publicKey });
  initialised = true;
}

/* ------------------------------------------------------------------ */
/* Delivery state                                                      */
/* ------------------------------------------------------------------ */

export type DeliveryChannel = 'admin' | 'user';

export type DeliveryState = {
  /** Nothing attempted yet (e.g. email not configured). */
  skipped: DeliveryChannel[];
  sent: DeliveryChannel[];
  failed: { channel: DeliveryChannel; reason: string }[];
  /** True when both required emails actually went out. */
  complete: boolean;
};

export const EMPTY_DELIVERY: DeliveryState = {
  skipped: [],
  sent: [],
  failed: [],
  complete: false,
};

export function summariseDelivery(state: DeliveryState): {
  tone: 'success' | 'partial' | 'manual';
  title: string;
  message: string;
} {
  if (state.complete) {
    return {
      tone: 'success',
      title: 'Your Request Has Been Received!',
      message:
        'Your submission has been sent to our team for review, and a confirmation copy is on its way to your inbox. An appropriate specialist will contact you using the details provided.',
    };
  }
  if (state.sent.includes('admin') && !state.sent.includes('user')) {
    return {
      tone: 'partial',
      title: 'Your Request Has Been Received!',
      message:
        'Your application reached our team — but the confirmation email could not be delivered. Your reference number below is your record; keep it in case you need to follow up.',
    };
  }
  if (state.failed.some((f) => f.channel === 'admin')) {
    return {
      tone: 'manual',
      title: 'Almost there — one step to confirm',
      message:
        'We could not reach our mail service just now, so your application has been saved on this device but not yet delivered. Your reference number is below — please send it to us by WhatsApp or email and we will pick it up immediately.',
    };
  }
  if (state.skipped.length > 0) {
    return {
      tone: 'manual',
      title: 'Your Request Has Been Received!',
      message:
        'Your submission has been saved on this device with the reference below. Please send that reference to us by WhatsApp or email so we can pick it up straight away — automatic email delivery is not active yet.',
    };
  }
  return {
    tone: 'manual',
    title: 'Your Request Has Been Received!',
    message:
      'Your submission has been saved and will be sent to our team for review. An appropriate specialist will contact you using the details provided. Keep your reference number below.',
  };
}

/* ------------------------------------------------------------------ */
/* Template variables                                                  */
/* ------------------------------------------------------------------ */

type VariableMap = Record<string, string>;

function formatReportBlock(report: ReadinessReport): string {
  const stages = report.stages
    .map(
      (s) =>
        `  • Stage ${String(s.stage).padStart(2, '0')} ${s.title}: ${
          s.score === null ? 'n/a' : `${s.score}%`
        } — ${s.status}`,
    )
    .join('\n');
  return [
    `Overall readiness: ${report.overall}%`,
    `Current stage: ${report.currentStage.label}`,
    'Stage breakdown:',
    stages,
    '',
    'Critical issues:',
    ...report.criticalIssues.map((i) => `  • ${i}`),
    '',
    `Conclusion: ${report.conclusion}`,
    `Recommended: ${report.recommendation.serviceId} — ${report.recommendation.tier} (${money(
      report.recommendation.price,
    )})`,
    `Report reference: ${report.id.slice(0, 10).toUpperCase()}`,
  ].join('\n');
}

/**
 * One flat variable set. Both templates read from it; each ignores what it
 * does not use. Keep this list in sync with `TEMPLATE_VARIABLES`.
 */
export function buildVariables(
  app: Application,
  report?: ReadinessReport,
): VariableMap {
  const isAssessment = app.type === 'assessment';
  const { contact } = app;

  const kind = isAssessment ? 'Store Readiness Assessment' : 'Service Application';
  const packageLabel = app.packageTier ? `${app.packageTier} package` : '';
  const serviceLabel = app.serviceId
    ? app.serviceId
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '';

  const adBudgetLine =
    typeof app.adBudget === 'number' && app.adBudget > 0
      ? `${money(app.adBudget)} allocated to advertising (held separately from the service fee)`
      : '';

  return {
    /* Routing ------------------------------------------------------- */
    // `to_email` is only meaningful for the merchant template. The admin
    // template can either hardcode your address as its To field, or use this.
    to_email: contact.email,
    to_name: contact.fullName,
    reply_to: contact.email,
    admin_email: EMAIL_CONFIG.adminEmail,

    /* Identity ------------------------------------------------------ */
    reference: app.reference,
    submission_type: kind,
    submitted_at: formatDateTime(app.createdAt),

    /* Merchant ------------------------------------------------------ */
    customer_name: contact.fullName,
    customer_email: contact.email,
    customer_whatsapp: contact.whatsapp,
    store_url: contact.storeUrl,
    business_category: contact.category || 'Not provided',
    objective: contact.objective || 'Not provided',

    /* Commercial ---------------------------------------------------- */
    service: serviceLabel || '—',
    package_name: packageLabel || '—',
    service_fee: app.serviceFee === null ? '—' : money(app.serviceFee),
    advertising_budget: typeof app.adBudget === 'number' ? money(app.adBudget) : '—',
    total_payment: money(app.total),
    // Ready-made sentence so templates stay simple.
    ad_budget_line: adBudgetLine,

    /* Free text ----------------------------------------------------- */
    requirements: contact.requirements || 'Not provided',
    additional_info: contact.notes || 'Not provided',
    attachments: contact.attachments.length
      ? contact.attachments.map((a) => `${a.name} (${Math.round(a.size / 1024)} KB)`).join(', ')
      : 'None',

    /* Report (assessments only) ------------------------------------- */
    has_report: report ? 'true' : '',
    readiness_score: report ? `${report.overall}%` : '',
    current_stage: report ? report.currentStage.label : '',
    report_summary: report ? formatReportBlock(report) : '',

    /* Presentation helpers ------------------------------------------ */
    brand_name: SITE.name,
    brand_email: SITE.email,
    brand_whatsapp: SITE.whatsapp,
    support_hours: SITE.hours,
    year: String(new Date().getFullYear()),
  };
}

/**
 * The contract between this app and your two EmailJS templates.
 * Paste these (as {{variable}}) into each template body.
 */
export const TEMPLATE_VARIABLES = {
  identity: ['reference', 'submission_type', 'submitted_at', 'year'],
  merchant: ['customer_name', 'customer_email', 'customer_whatsapp', 'store_url', 'business_category', 'objective'],
  commercial: ['service', 'package_name', 'service_fee', 'advertising_budget', 'total_payment', 'ad_budget_line'],
  freeText: ['requirements', 'additional_info', 'attachments'],
  report: ['has_report', 'readiness_score', 'current_stage', 'report_summary'],
  brand: ['brand_name', 'brand_email', 'brand_whatsapp', 'support_hours', 'admin_email', 'to_email', 'to_name', 'reply_to'],
} as const;

/* ------------------------------------------------------------------ */
/* Sending                                                             */
/* ------------------------------------------------------------------ */

/** The one thing we need from the SDK — swappable for tests and dry runs. */
export type EmailTransport = (
  config: EmailConfig,
  templateId: string,
  variables: VariableMap,
) => Promise<void>;

export const emailjsTransport: EmailTransport = async (config, templateId, variables) => {
  if (!templateId) throw new Error('No template ID configured');
  await emailjs.send(config.serviceId, templateId, variables, {
    publicKey: config.publicKey,
  });
};

/**
 * Fires both templates. Runs them in parallel: a failure on one must not
 * prevent the other from going out (the merchant's confirmation failing
 * should not stop the team from hearing about the application).
 */
export async function sendApplicationEmails(
  app: Application,
  report?: ReadinessReport,
  config: EmailConfig = EMAIL_CONFIG,
  transport: EmailTransport = emailjsTransport,
): Promise<DeliveryState> {
  if (!isEmailConfigured(config)) {
    return { ...EMPTY_DELIVERY, skipped: ['admin', 'user'] };
  }

  ensureInit(config);
  const variables = buildVariables(app, report);

  const [admin, user] = await Promise.allSettled([
    transport(config, config.adminTemplateId, variables),
    transport(config, config.userTemplateId, variables),
  ]);

  const state: DeliveryState = { skipped: [], sent: [], failed: [], complete: false };
  const collect = (channel: DeliveryChannel) => (result: PromiseSettledResult<void>) => {
    if (result.status === 'fulfilled') {
      state.sent.push(channel);
    } else {
      const reason =
        result.reason instanceof Error ? result.reason.message : String(result.reason ?? 'Unknown error');
      state.failed.push({ channel, reason });
    }
  };
  collect('admin')(admin);
  collect('user')(user);
  state.complete = state.sent.length === 2;
  return state;
}

/* ------------------------------------------------------------------ */
/* Diagnostics (admin console)                                         */
/* ------------------------------------------------------------------ */

export type EmailDiagnostics = {
  configured: boolean;
  missing: string[];
  /** Non-fatal problems worth showing in the console. */
  warnings: string[];
  serviceId: string;
  adminTemplateId: string;
  userTemplateId: string;
  adminEmail: string;
};

export function emailDiagnostics(config: EmailConfig = EMAIL_CONFIG): EmailDiagnostics {
  const missing: string[] = [];
  if (!config.serviceId) missing.push('VITE_EMAILJS_SERVICE_ID');
  if (!config.publicKey) missing.push('VITE_EMAILJS_PUBLIC_KEY');
  if (!config.adminTemplateId) missing.push('VITE_EMAILJS_ADMIN_TEMPLATE_ID');
  if (!config.userTemplateId) missing.push('VITE_EMAILJS_USER_TEMPLATE_ID');
  const warnings: string[] = [];
  if (
    config.adminTemplateId &&
    config.userTemplateId &&
    config.adminTemplateId === config.userTemplateId
  ) {
    // Both sides would receive the same rendering, addressed to the same person.
    warnings.push(
      'Both template IDs are identical — the merchant and the team would receive the same email.',
    );
  }

  return {
    configured: missing.length === 0,
    missing,
    warnings,
    serviceId: config.serviceId,
    adminTemplateId: config.adminTemplateId,
    userTemplateId: config.userTemplateId,
    adminEmail: config.adminEmail,
  };
}
