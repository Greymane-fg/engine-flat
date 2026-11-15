/**
 * ---------------------------------------------------------------------------
 * PLATFORM CONFIGURATION
 * ---------------------------------------------------------------------------
 * Brand, currency, contact details and feature defaults live here so that the
 * business can change them in one place. Service packages, prices and policy
 * copy are NOT hardcoded into components — they live in the data layer
 * (`src/data/*`) and are additionally editable at runtime through the
 * administrative interface (persisted locally).
 */

export const SITE = {
  /** Display name used in the wordmark. */
  name: 'Engine',
  /** Legal entity shown in the footer / policy modals. */
  legalName: 'Engine Commerce Studio',
  tagline:
    "You don't just need marketing. You need a store that's ready for it.",
  description:
    'A Shopify readiness and growth platform that identifies what your store needs, connects you with the right experts and provides a clear path from foundational setup to strategic marketing and sustainable growth.',
  email: 'readiness@engine.studio',
  whatsapp: '+234 801 000 0000',
  /** Digits only, international format — used to build wa.me links. */
  whatsappDigits: '2348010000000',
  phone: '+234 801 000 0000',
  address: 'Lagos, Nigeria',
  hours: 'Mon – Fri · 09:00 – 18:00 WAT',
  social: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'X / Twitter', href: 'https://x.com' },
    { label: 'TikTok', href: 'https://tiktok.com' },
  ],
  /** NOTE: displayed consistently in the checkout / pricing UI. */
  currency: {
    code: 'USD',
    symbol: '$',
    /** Set to false to render the code prefix (e.g. "USD 500"). */
    symbolFirst: true,
    locale: 'en-US',
  },
} as const;

export const TOTALS = {
  readinessStages: 5,
  services: 5,
  packagesPerService: 3,
} as const;

/** Assessment scoring weights per stage, out of 100. */
export const STAGE_WEIGHTS = [22, 20, 18, 18, 22] as const;

/** Application status pipeline (shared by admin + merchant tracking). */
export const APPLICATION_STAGES = [
  'Submitted',
  'Awaiting Review',
  'Assessment in Progress',
  'Assessment Completed',
  'Awaiting Merchant Approval',
  'Payment Pending',
  'Assigned to Expert',
  'In Progress',
  'Completed',
] as const;
