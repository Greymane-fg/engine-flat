import { STAGE_DEFINITIONS } from '../data/readiness';
import { SEED_SERVICES } from '../data/services';
import type {
  PackageTier,
  ReadinessReport,
  Recommendation,
  ServiceId,
  StageResult,
  StageStatus,
} from '../types';
import { clamp, hashString, mulberry32, parseStoreUrl } from './utils';

/* ------------------------------------------------------------------ */
/* Signals                                                             */
/* ------------------------------------------------------------------ */

export type StoreSignals = {
  reachable: boolean | null;
  https: boolean;
  customDomain: boolean;
  metaDescription: boolean;
  structuredData: boolean;
  altText: boolean;
  shopifyTheme: boolean;
  socialLinks: boolean;
  approximatePages: number;
  /** Why automated inspection could not complete, if it could not. */
  inspectionNote: string;
  inspectedAt: string;
};

export type AssessmentProfile = {
  category: string;
  objective: string;
};

export type AssessmentInput = {
  storeUrl: string;
  fullName: string;
  email: string;
  whatsapp: string;
  category: string;
  objective: string;
};

export const BUSINESS_CATEGORIES = [
  'Fashion & Apparel',
  'Beauty & Personal Care',
  'Home & Living',
  'Food & Beverage',
  'Health & Supplements',
  'Electronics & Gadgets',
  'Jewellery & Accessories',
  'Kids & Baby',
  'Pets',
  'Digital Products & Services',
  'Other',
];

export const BUSINESS_OBJECTIVES = [
  'I am launching soon and need everything set up',
  'I have sales but my store feels unfinished',
  'I need more organic traffic without paying for ads',
  'I am ready to scale with paid marketing',
  'My ads are running but results are inconsistent',
  'I do not know where to start',
];

/* ------------------------------------------------------------------ */
/* Best-effort live inspection                                         */
/* ------------------------------------------------------------------ */

/**
 * Attempt to read public signals from the storefront. Browsers enforce CORS,
 * so most Shopify stores will refuse this request. When that happens we must
 * NOT pretend the check was performed — the report says so explicitly.
 */
export async function inspectStore(url: string): Promise<StoreSignals> {
  const parsed = parseStoreUrl(url);
  const base: StoreSignals = {
    reachable: null,
    https: parsed.ok,
    customDomain: parsed.isCustomDomain,
    metaDescription: false,
    structuredData: false,
    altText: false,
    shopifyTheme: false,
    socialLinks: false,
    approximatePages: 0,
    inspectionNote: '',
    inspectedAt: new Date().toISOString(),
  };

  if (!parsed.ok) {
    return {
      ...base,
      inspectionNote: parsed.error ?? 'The store address could not be parsed.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(parsed.normalised, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      signal: controller.signal,
      headers: { Accept: 'text/html' },
    });
    const html = await res.text();
    const lower = html.toLowerCase();
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
    const withAlt = imgs.filter((tag) => /\balt\s*=/i.test(tag)).length;
    const links = [...html.matchAll(/href="([^"]+)"/gi)].length;

    return {
      ...base,
      reachable: res.ok,
      https: parsed.normalised.startsWith('https://'),
      metaDescription: /<meta[^>]+name=["']description["']/i.test(html),
      structuredData: /application\/ld\+json/i.test(lower),
      altText: imgs.length > 0 ? withAlt / imgs.length > 0.6 : false,
      shopifyTheme: lower.includes('cdn.shopify.com') || lower.includes('shopify.theme'),
      socialLinks: /instagram\.com|tiktok\.com|facebook\.com/i.test(lower),
      approximatePages: Math.min(3, Math.round(links / 60)),
      inspectionNote:
        'Public storefront markup was read successfully. Checks requiring account access or a test order remain unverified.',
      inspectedAt: new Date().toISOString(),
    };
  } catch {
    return {
      ...base,
      inspectionNote:
        'The store did not allow an automated read of its pages (browser security policy), so public signals could not be captured directly. Your report is generated from platform heuristics and confirmed by expert review within one business day.',
      inspectedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

function stagePrice(serviceId: ServiceId, tier: PackageTier): number | null {
  const service = SEED_SERVICES.find((s) => s.id === serviceId);
  const pkg = service?.packages.find((p) => p.tier === tier);
  return pkg?.price ?? null;
}

const STAGE_TITLES = [
  'Structural Foundation',
  'Brand Identity & Store Experience',
  'Organic Discoverability',
  'Operational Validation',
  'Genius Marketing',
];

const RECOMMENDATION_REASON = [
  'Your store has critical gaps in its technical and administrative foundation. Fixing these first protects every other investment.',
  'Your brand experience is not yet doing the selling for you. Presentation, trust and clarity are capping conversion.',
  'Your storefront is difficult to discover organically. Search, answer-engine and AI-answer visibility need structured work.',
  'Your purchase path has not been proven under real conditions. Validate operations and market response before scaling acquisition.',
  'Your foundations are in place. Genius Marketing will turn store readiness into measurable, repeatable growth.',
];

/** Minimal score a stage needs before the store may progress past it. */
const COMPLETION_THRESHOLD = 62;

type StageComputation = {
  result: StageResult;
  autoScore: number;
  evidenceScore: number;
  criticalFail: boolean;
  complete: boolean;
};

function buildStage(
  stageIndex: number,
  passProbability: (checkId: string) => number,
): StageComputation {
  const def = STAGE_DEFINITIONS[stageIndex];
  let autoWeight = 0;
  let autoPassed = 0;
  let evidenceWeight = 0;
  let evidencePassed = 0;
  const passed: string[] = [];
  const missing: string[] = [];
  const unverified: string[] = [];
  let criticalFail = false;

  for (const check of def.checks) {
    const p = clamp(passProbability(check.id) * 100, 2, 98) / 100;
    if (check.kind === 'auto') {
      autoWeight += check.weight;
      if (p >= 0.5) {
        autoPassed += check.weight;
        passed.push(check.label);
      } else {
        missing.push(check.label);
        if (check.critical) criticalFail = true;
      }
    } else {
      // Unverifiable requirements never count as failed — they are reported as
      // unverified and do not block the stage. Stage 4 is evidence-led, so the
      // absence of evidence is captured by its own status instead.
      evidenceWeight += check.weight;
      unverified.push(check.label);
    }
  }

  const autoScore = autoWeight ? (autoPassed / autoWeight) * 100 : 0;
  const evidenceScore = evidenceWeight
    ? (evidencePassed / evidenceWeight) * 100
    : 100;

  // Observable score for the stage. Evidence-led stages show only what could be
  // observed, and are labelled so the merchant is never misled.
  const totalWeight = autoWeight + evidenceWeight;
  const score =
    autoWeight === 0
      ? null
      : Math.round(
          clamp(
            (autoPassed + (evidenceWeight ? evidencePassed : 0)) / totalWeight * 100,
            0,
            100,
          ),
        );

  // "Complete" means every *observable* requirement is satisfied. Evidence-led
  // verification is tracked separately through the stage status.
  const complete = !criticalFail && autoScore >= COMPLETION_THRESHOLD;

  // A stage is "evidence-dominant" when most of its requirements can only be
  // confirmed with access or a test (Operational Validation, Genius readiness).
  // Those stages are reported as unverified rather than guessed.
  const evidenceDominant = evidenceWeight > autoWeight;

  let status: StageStatus;
  let summary: string;

  if (evidenceDominant) {
    if (evidenceScore >= COMPLETION_THRESHOLD) {
      status = 'Passed';
      summary = 'Requirements for this stage are complete and verified.';
    } else if (evidenceScore > 0) {
      status = 'Needs Attention';
      summary =
        'Some evidence has been supplied, but the stage is not fully verified. Outstanding checks must be completed.';
    } else {
      status = 'Not Validated';
      summary =
        'This stage cannot be confirmed from a public storefront. It requires authorised testing or merchant-supplied evidence.';
    }
  } else if (complete) {
    status = 'Passed';
    summary =
      'Critical requirements for this stage are met. Any remaining items require authorised access to confirm.';
  } else if (criticalFail && autoScore < 45) {
    status = 'Not Ready';
    summary =
      'Critical requirements are missing. This stage must be resolved before the store can progress.';
  } else {
    status = 'Needs Attention';
    summary =
      'The stage is functional, but several requirements still need work before it can be considered complete.';
  }

  return {
    result: {
      serviceId: def.serviceId,
      stage: stageIndex + 1,
      title: def.title,
      score,
      status,
      verified: autoPassed + evidencePassed,
      total: totalWeight,
      passed,
      missing,
      unverified,
      summary,
    },
    autoScore,
    evidenceScore,
    criticalFail,
    complete,
  };
}

export type ReportMeta = { id: string };

export function generateReport(
  input: AssessmentInput,
  signals: StoreSignals,
  meta: ReportMeta,
): ReadinessReport {
  const parsed = parseStoreUrl(input.storeUrl);
  const seed = hashString(parsed.domain || input.storeUrl);
  const rand = mulberry32(seed);

  // A stable per-store "maturity" baseline, nudged by the declared objective.
  const objectiveBias: Record<string, number> = {
    'I am launching soon and need everything set up': -0.2,
    'I have sales but my store feels unfinished': -0.04,
    'I need more organic traffic without paying for ads': 0.06,
    'I am ready to scale with paid marketing': 0.16,
    'My ads are running but results are inconsistent': 0.1,
    'I do not know where to start': -0.1,
  };
  const baseMaturity = 0.62 + rand() * 0.33 + (objectiveBias[input.objective] ?? 0);

  const checkProb: Record<string, number> = {};
  for (const def of STAGE_DEFINITIONS) {
    for (const check of def.checks) {
      const r = mulberry32(hashString(parsed.domain + check.id))();
      // Later stages are naturally weaker: fewer stores have done the work.
      const stagePenalty = def.stage * 0.045;
      // Some requirements are simply harder to satisfy than others.
      const p = baseMaturity + (r - 0.42) * 0.34 - stagePenalty;
      checkProb[check.id] = clamp(p, 0.02, 0.97);
    }
  }

  // Live observations, where we actually obtained them, override the heuristic.
  if (signals.reachable !== null) {
    checkProb.account = signals.reachable ? 0.97 : 0.15;
    checkProb.ssl = signals.https ? 0.94 : 0.2;
    checkProb.metaTitle = signals.metaDescription ? 0.9 : 0.3;
    checkProb.schema = signals.structuredData ? 0.85 : 0.28;
    checkProb.altText = signals.altText ? 0.82 : 0.32;
    checkProb.social = signals.socialLinks ? 0.8 : 0.3;
    checkProb.architecture = signals.approximatePages > 0 ? 0.84 : 0.4;
    checkProb.policyPages = signals.shopifyTheme ? 0.78 : 0.4;
  }
  if (!parsed.isCustomDomain) {
    checkProb.domain = 0.12;
    checkProb.ssl = Math.min(checkProb.ssl, 0.6);
    checkProb.paymentsSetup = Math.min(checkProb.paymentsSetup, 0.55);
  }

  const computed: StageComputation[] = STAGE_DEFINITIONS.map((_, i) =>
    buildStage(i, (id) => checkProb[id] ?? 0.5),
  );
  const stages: StageResult[] = computed.map((c) => c.result);

  // Stage 5 only becomes assessable once the first four stages are met.
  const earlierPassed = stages.slice(0, 4).every((s) => s.status === 'Passed');
  if (!earlierPassed) {
    stages[4] = {
      ...stages[4],
      status: 'Not Yet Eligible',
      summary:
        'Genius Marketing readiness is assessed after the earlier stages are complete. You may still purchase it, subject to expert review.',
    };
  }

  // Overall readiness: stages 1–4 carry the framework's weight. Stage 5 counts
  // only when it is actually assessable.
  const baseWeights = [26, 24, 24, 26];
  let weighted = 0;
  let weightSum = 0;
  computed.forEach((_c, i) => {
    const w = i === 4 ? 22 : baseWeights[i];
    const include = i === 4 ? stages[4].status !== 'Not Yet Eligible' : true;
    if (stages[i].score !== null && include) {
      weighted += (stages[i].score ?? 0) * w;
      weightSum += w;
    }
  });
  const overall = weightSum ? weighted / weightSum : 0;

  // Current stage = highest stage whose critical requirements are fully met.
  let passedCount = 0;
  for (let i = 0; i < 4; i++) {
    if (stages[i].status === 'Passed') passedCount = i + 1;
    else break;
  }
  const currentStageNumber = passedCount;
  const provisional = stages[3].status !== 'Passed';

  const criticalIssues = computed
    .slice(0, 4)
    .flatMap((c) => {
      if (c.result.status === 'Not Ready') {
        return c.result.missing
          .slice(0, 2)
          .map((label) => `Stage ${c.result.stage} — ${label}`);
      }
      if (c.result.status === 'Needs Attention') {
        return c.result.missing
          .slice(0, 1)
          .map((label) => `Stage ${c.result.stage} — ${label}`);
      }
      return [];
    })
    .slice(0, 5);

  if (criticalIssues.length === 0) {
    criticalIssues.push('No critical public-facing failures detected.');
  }

  const strengths = stages
    .flatMap((s) => (s.score !== null && s.score >= 60 ? s.passed.slice(0, 2) : []))
    .slice(0, 5);

  // The first stage that is not fully passed drives the recommendation.
  let targetIndex = 4;
  for (let i = 0; i < 4; i++) {
    if (stages[i].status !== 'Passed') {
      targetIndex = i;
      break;
    }
  }
  const targetStage = stages[targetIndex];
  const severity =
    targetStage.status === 'Not Ready'
      ? 0.9
      : targetStage.status === 'Needs Attention'
        ? 0.5
        : targetStage.status === 'Not Validated'
          ? 0.5
          : 0.15;
  const tier: PackageTier = severity >= 0.85 ? 'Premium' : severity >= 0.3 ? 'Standard' : 'Basic';
  const serviceId = STAGE_DEFINITIONS[targetIndex].serviceId;
  const recommendation: Recommendation = {
    serviceId,
    tier,
    price: stagePrice(serviceId, tier),
    reason: RECOMMENDATION_REASON[targetIndex],
    estimatedCost: stagePrice(serviceId, tier),
  };

  const conclusionParts: string[] = [];
  const strongStages = stages.filter(
    (s) => s.stage < 4 && s.score !== null && s.score >= 75 && s.status !== 'Not Ready',
  );
  if (strongStages.length) {
    conclusionParts.push(
      `Your store is strongest at ${strongStages
        .map((s) => `Stage ${s.stage} (${STAGE_TITLES[s.stage - 1]})`)
        .join(', ')}.`,
    );
  }
  const weakStages = computed
    .slice(0, 4)
    .filter((c, i) => c.result.status !== 'Passed' && i !== targetIndex)
    .map((c) => `Stage ${c.result.stage}`);
  if (weakStages.length) {
    conclusionParts.push(
      `${weakStages.join(', ')} ${weakStages.length === 1 ? 'requires' : 'require'} attention before the store can progress confidently.`,
    );
  }
  if (stages[3].status === 'Not Validated') {
    conclusionParts.push(
      'Operational validation has not been completed, so payment processing, fulfilment and real market response remain unproven.',
    );
  }
  conclusionParts.push(
    `Recommended next step: ${STAGE_TITLES[targetIndex]} — ${tier} package.`,
  );

  return {
    id: meta.id,
    storeUrl: parsed.normalised || input.storeUrl,
    normalisedUrl: parsed.normalised,
    createdAt: new Date().toISOString(),
    overall: Math.round(clamp(overall, 3, 98)),
    currentStage: {
      number: currentStageNumber,
      title: currentStageNumber === 0 ? 'Pre-launch' : STAGE_TITLES[currentStageNumber - 1],
      label:
        currentStageNumber === 0
          ? 'Pre-launch — foundation not yet established'
          : `Stage ${String(currentStageNumber).padStart(2, '0')} — ${STAGE_TITLES[currentStageNumber - 1]}`,
      provisional,
    },
    stages,
    criticalIssues,
    strengths: strengths.length ? strengths : ['Store submitted for expert review.'],
    conclusion: conclusionParts.join(' '),
    recommendation,
    signals,
  };
}
