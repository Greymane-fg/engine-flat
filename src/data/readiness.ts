import type { ServiceId } from '../types';

/**
 * READINESS FRAMEWORK
 * ---------------------------------------------------------------------------
 * Every check maps to a real, observable (or explicitly unverifiable) signal.
 *
 *  kind: 'auto'       → assessable from a public store (url, sitemap, checkout…)
 *        'evidence'   → requires merchant-supplied evidence or authorised access
 *
 * The scoring engine never claims to have verified an 'evidence' check. It marks
 * those as "Not Validated" instead of failed, so merchants are never told their
 * payment gateway is broken when we simply cannot see it.
 */

export type CheckKind = 'auto' | 'evidence';

export type ReadinessCheck = {
  id: string;
  label: string;
  kind: CheckKind;
  /** Weight inside its stage. */
  weight: number;
  /** 1 = blocking; a failing critical check caps progression to that stage. */
  critical?: boolean;
  /** Only applies to certain business categories (e.g. packaged goods → returns policy). */
  categories?: string[];
  hint: string;
};

export type StageDefinition = {
  stage: number;
  serviceId: ServiceId;
  title: string;
  checks: ReadinessCheck[];
};

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    stage: 1,
    serviceId: 'structural-foundation',
    title: 'Structural Foundation',
    checks: [
      {
        id: 'account',
        label: 'Shopify storefront live and reachable',
        kind: 'auto',
        weight: 3,
        critical: true,
        hint: 'The storefront responds over HTTPS and serves a rendered store page.',
      },
      {
        id: 'ssl',
        label: 'Domain security and SSL',
        kind: 'auto',
        weight: 2,
        critical: true,
        hint: 'HTTPS with a valid certificate and no mixed-content downgrade.',
      },
      {
        id: 'domain',
        label: 'Custom domain connected',
        kind: 'auto',
        weight: 2,
        hint: 'A verified custom domain rather than only a *.myshopify.com address.',
      },
      {
        id: 'payments-setup',
        label: 'Payment gateway configured',
        kind: 'auto',
        weight: 2,
        critical: true,
        hint: 'Checkout exposes at least one live payment method (card, wallet or transfer).',
      },
      {
        id: 'payments-live',
        label: 'Payment processing verified',
        kind: 'evidence',
        weight: 2,
        critical: true,
        hint: 'Requires an authorised test transaction — not visible from a public storefront.',
      },
      {
        id: 'currency',
        label: 'Store currency and regional settings',
        kind: 'auto',
        weight: 1,
        hint: 'Currency is explicit, consistent and appropriate to the target market.',
      },
      {
        id: 'shipping',
        label: 'Shipping zones and rates configured',
        kind: 'auto',
        weight: 2,
        critical: true,
        hint: 'Delivery options and rates are presented before checkout.',
      },
      {
        id: 'fulfilment',
        label: 'Fulfilment structure configured',
        kind: 'evidence',
        weight: 2,
        hint: 'Warehouse, 3PL, dropship or local-delivery workflow. Requires owner access.',
      },
      {
        id: 'policy-privacy',
        label: 'Privacy policy published',
        kind: 'auto',
        weight: 2,
        hint: 'A dedicated, linked privacy policy page.',
      },
      {
        id: 'policy-refund',
        label: 'Refund and returns policy published',
        kind: 'auto',
        weight: 2,
        critical: true,
        hint: 'Linked refund/returns policy with a stated window.',
      },
      {
        id: 'policy-terms',
        label: 'Terms of service published',
        kind: 'auto',
        weight: 1,
        hint: 'Linked terms of service page.',
      },
      {
        id: 'policy-shipping',
        label: 'Shipping policy published',
        kind: 'auto',
        weight: 1,
        hint: 'Linked shipping and delivery policy page.',
      },
      {
        id: 'policy-contact',
        label: 'Contact and business information',
        kind: 'auto',
        weight: 2,
        hint: 'A contact route and a real business presence (address, email or phone).',
      },
      {
        id: 'policy-pages',
        label: 'Legal pages linked from the storefront',
        kind: 'auto',
        weight: 2,
        hint: 'Policy pages are reachable from the footer, not orphaned.',
      },
      {
        id: 'navigation',
        label: 'Navigation structure',
        kind: 'auto',
        weight: 2,
        hint: 'A usable primary menu linking into the catalogue and key pages.',
      },
      {
        id: 'architecture',
        label: 'Product and collection architecture',
        kind: 'auto',
        weight: 2,
        hint: 'Products are organised into collections that can be browsed.',
      },
      {
        id: 'integrations',
        label: 'Essential integrations connected',
        kind: 'evidence',
        weight: 1,
        hint: 'Analytics, email, reviews and fulfilment apps. Requires admin access.',
      },
    ],
  },
  {
    stage: 2,
    serviceId: 'brand-experience',
    title: 'Brand Identity & Store Experience',
    checks: [
      {
        id: 'logo',
        label: 'Logo present and legible',
        kind: 'auto',
        weight: 2,
        critical: true,
        hint: 'A brand mark in the header rather than the default theme wordmark.',
      },
      {
        id: 'colour',
        label: 'Coherent colour system',
        kind: 'auto',
        weight: 2,
        hint: 'A restrained, consistent palette rather than default theme colours.',
      },
      {
        id: 'typography',
        label: 'Typography hierarchy',
        kind: 'auto',
        weight: 2,
        hint: 'Distinct heading and body styles with comfortable measure and line height.',
      },
      {
        id: 'hero',
        label: 'Hero and value proposition',
        kind: 'auto',
        weight: 3,
        critical: true,
        hint: 'The first screen states what is sold, to whom, and why it matters.',
      },
      {
        id: 'homepage',
        label: 'Homepage merchandising',
        kind: 'auto',
        weight: 2,
        hint: 'Featured products, promotions or brand content below the fold.',
      },
      {
        id: 'product-images',
        label: 'Product imagery quality',
        kind: 'auto',
        weight: 2,
        critical: true,
        hint: 'Multiple crisp images per product, consistent aspect ratio and backgrounds.',
      },
      {
        id: 'product-copy',
        label: 'Product descriptions',
        kind: 'auto',
        weight: 3,
        critical: true,
        hint: 'Benefit-led copy with specifications, variants and objection handling.',
      },
      {
        id: 'product-variants',
        label: 'Variants and pricing presentation',
        kind: 'auto',
        weight: 2,
        hint: 'Options (size, colour) are selectable and prices are unambiguous.',
      },
      {
        id: 'reviews',
        label: 'Product reviews or social proof',
        kind: 'auto',
        weight: 2,
        hint: 'Visible reviews, ratings, press or testimonials near the purchase decision.',
      },
      {
        id: 'trust',
        label: 'Trust signals',
        kind: 'auto',
        weight: 2,
        hint: 'Secure checkout, guarantees, shipping clarity or recognizable assurances.',
      },
      {
        id: 'collections',
        label: 'Collection page experience',
        kind: 'auto',
        weight: 2,
        hint: 'Browsable collection pages with filters, sorting and clear card hierarchy.',
      },
      {
        id: 'search',
        label: 'Storefront search',
        kind: 'auto',
        weight: 1,
        hint: 'A visible search entry point with meaningful results.',
      },
      {
        id: 'cart',
        label: 'Cart experience',
        kind: 'auto',
        weight: 2,
        hint: 'A cart with inertia, upsell or clear continuation to checkout.',
      },
      {
        id: 'mobile',
        label: 'Mobile responsiveness',
        kind: 'auto',
        weight: 3,
        critical: true,
        hint: 'Layout, tap targets and typography hold up at mobile widths.',
      },
      {
        id: 'checkout-experience',
        label: 'Checkout experience quality',
        kind: 'evidence',
        weight: 2,
        hint: 'Requires walking the checkout — cannot be fully judged from the storefront.',
      },
      {
        id: 'accessibility',
        label: 'Accessibility basics',
        kind: 'auto',
        weight: 1,
        hint: 'Alt text, contrast, focus states and semantic headings.',
      },
    ],
  },
  {
    stage: 3,
    serviceId: 'organic-discoverability',
    title: 'Organic Discoverability',
    checks: [
      {
        id: 'meta-title',
        label: 'Page titles and meta descriptions',
        kind: 'auto',
        weight: 2,
        critical: true,
        hint: 'Unique, descriptive titles and descriptions on key pages.',
      },
      {
        id: 'headings',
        label: 'Heading hierarchy',
        kind: 'auto',
        weight: 2,
        hint: 'A single H1 per page with a logical H2/H3 structure.',
      },
      {
        id: 'alt-text',
        label: 'Image alt text',
        kind: 'auto',
        weight: 1,
        hint: 'Descriptive alt text on product and editorial imagery.',
      },
      {
        id: 'urls',
        label: 'URL structure',
        kind: 'auto',
        weight: 1,
        hint: 'Readable, stable collection and product URLs.',
      },
      {
        id: 'internal-links',
        label: 'Internal linking',
        kind: 'auto',
        weight: 1,
        hint: 'Collections, products and content interlink meaningfully.',
      },
      {
        id: 'schema',
        label: 'Structured data and schema markup',
        kind: 'auto',
        weight: 2,
        hint: 'Product, organization and breadcrumb schema on relevant pages.',
      },
      {
        id: 'sitemap',
        label: 'Sitemap and indexability',
        kind: 'auto',
        weight: 2,
        critical: true,
        hint: 'sitemap.xml resolves and pages are not blocked from indexing.',
      },
      {
        id: 'tech-seo',
        label: 'Technical SEO health',
        kind: 'auto',
        weight: 3,
        critical: true,
        hint: 'Canonicals, robots directives, duplicate content and page speed signals.',
      },
      {
        id: 'gsc',
        label: 'Search Console verification',
        kind: 'evidence',
        weight: 1,
        hint: 'Requires owner verification — not inferable from the public site.',
      },
      {
        id: 'merchant-center',
        label: 'Google Merchant Center & product feed',
        kind: 'evidence',
        weight: 2,
        hint: 'Feed eligibility and product data quality require account access.',
      },
      {
        id: 'aeo-faq',
        label: 'AEO: question-led content and FAQs',
        kind: 'auto',
        weight: 2,
        hint: 'Content answers real customer questions in extractable form.',
      },
      {
        id: 'aeo-structure',
        label: 'AEO: clear, extractable answers',
        kind: 'auto',
        weight: 1,
        hint: 'Short direct answers, scannable lists and supporting schema.',
      },
      {
        id: 'geo-entity',
        label: 'GEO: brand and entity consistency',
        kind: 'auto',
        weight: 2,
        hint: 'Consistent brand name, description and contact data across the site.',
      },
      {
        id: 'geo-authority',
        label: 'GEO: authoritative content depth',
        kind: 'auto',
        weight: 1,
        hint: 'Substantive, citable content rather than thin product pages only.',
      },
      {
        id: 'social',
        label: 'Organic social presence',
        kind: 'auto',
        weight: 1,
        hint: 'Optimised, linked social profiles with an active content presence.',
      },
      {
        id: 'content-strategy',
        label: 'Organic content strategy',
        kind: 'evidence',
        weight: 1,
        hint: 'Requires strategic review of cadence, themes and distribution.',
      },
    ],
  },
  {
    stage: 4,
    serviceId: 'operational-validation',
    title: 'Operational Validation',
    checks: [
      {
        id: 'test-purchase',
        label: 'Test purchase completed',
        kind: 'evidence',
        weight: 4,
        critical: true,
        hint: 'An authorised test order is the only proof the purchase path works.',
      },
      {
        id: 'checkout-fn',
        label: 'Checkout functionality',
        kind: 'evidence',
        weight: 3,
        critical: true,
        hint: 'Customer information, shipping and payment steps all complete.',
      },
      {
        id: 'payment-fn',
        label: 'Payment processing',
        kind: 'evidence',
        weight: 3,
        critical: true,
        hint: 'A real transaction authorises and captures correctly.',
      },
      {
        id: 'shipping-calc',
        label: 'Shipping calculations',
        kind: 'auto',
        weight: 2,
        hint: 'Rates calculate correctly by destination and basket value.',
      },
      {
        id: 'notifications',
        label: 'Order notifications',
        kind: 'evidence',
        weight: 2,
        hint: 'Confirmation and fulfilment emails actually arrive.',
      },
      {
        id: 'inventory',
        label: 'Inventory synchronization',
        kind: 'evidence',
        weight: 2,
        hint: 'Stock levels hold across variations and channels during sale.',
      },
      {
        id: 'fulfilment-flow',
        label: 'Fulfilment workflow',
        kind: 'evidence',
        weight: 3,
        critical: true,
        hint: 'Orders can be picked, packed, shipped and tracked.',
      },
      {
        id: 'tracking',
        label: 'Conversion tracking installed',
        kind: 'auto',
        weight: 3,
        critical: true,
        hint: 'Analytics and ad-platform pixels present on key pages.',
      },
      {
        id: 'pixels-events',
        label: 'Event tracking quality',
        kind: 'evidence',
        weight: 2,
        hint: 'View, add-to-cart and purchase events fire without duplication.',
      },
      {
        id: 'viability',
        label: 'Product viability indicators',
        kind: 'auto',
        weight: 2,
        hint: 'Bestsellers, sold-out signals, bundles and offer clarity.',
      },
      {
        id: 'pricing',
        label: 'Pricing and offer competitiveness',
        kind: 'evidence',
        weight: 2,
        hint: 'Requires competitive and margin analysis.',
      },
      {
        id: 'baseline-marketing',
        label: 'Baseline marketing exercise',
        kind: 'evidence',
        weight: 4,
        critical: true,
        hint: 'A controlled paid test is the only way to establish market response.',
      },
      {
        id: 'performance-data',
        label: 'Measured performance data',
        kind: 'evidence',
        weight: 3,
        hint: 'Traffic, ATC, conversion rate, CPA and spend recorded over a test window.',
      },
    ],
  },
  {
    stage: 5,
    serviceId: 'genius-marketing',
    title: 'Genius Marketing Readiness',
    checks: [
      {
        id: 'data-foundation',
        label: 'Reliable performance data',
        kind: 'evidence',
        weight: 3,
        critical: true,
        hint: 'Historical conversion and acquisition data to strategise against.',
      },
      {
        id: 'audience-data',
        label: 'Audience and customer data',
        kind: 'evidence',
        weight: 2,
        hint: 'Repeat-purchase behaviour, segments and customer value.',
      },
      {
        id: 'offer-clarity',
        label: 'Clear offer and positioning',
        kind: 'auto',
        weight: 2,
        hint: 'A differentiated promise visible on the storefront.',
      },
      {
        id: 'creative-assets',
        label: 'Creative asset base',
        kind: 'auto',
        weight: 1,
        hint: 'Usable imagery and video for advertising.',
      },
      {
        id: 'margin',
        label: 'Margin headroom for acquisition',
        kind: 'evidence',
        weight: 3,
        critical: true,
        hint: 'Unit economics that can absorb paid acquisition costs.',
      },
      {
        id: 'catalogue-depth',
        label: 'Catalogue depth and cross-sell',
        kind: 'auto',
        weight: 1,
        hint: 'Enough range to support AOV, bundles and retention.',
      },
      {
        id: 'previous-spend',
        label: 'Previous paid media history',
        kind: 'evidence',
        weight: 2,
        hint: 'Prior spend and results inform channel and budget strategy.',
      },
      {
        id: 'capacity',
        label: 'Operational capacity to scale',
        kind: 'evidence',
        weight: 2,
        hint: 'Stock and fulfilment can support increased order volume.',
      },
    ],
  },
];

export const ALL_CHECK_IDS = STAGE_DEFINITIONS.flatMap((s) => s.checks.map((c) => c.id));

export const CHECK_COUNTS = STAGE_DEFINITIONS.reduce(
  (acc, stage) => {
    acc.total += stage.checks.length;
    acc.auto += stage.checks.filter((c) => c.kind === 'auto').length;
    acc.evidence += stage.checks.filter((c) => c.kind === 'evidence').length;
    return acc;
  },
  { total: 0, auto: 0, evidence: 0 },
);
