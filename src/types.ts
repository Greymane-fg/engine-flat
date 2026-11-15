export type PackageTier = 'Basic' | 'Standard' | 'Premium';

export type ServiceId =
  | 'structural-foundation'
  | 'brand-experience'
  | 'organic-discoverability'
  | 'operational-validation'
  | 'genius-marketing';

/** Price may be a number, or null when it is not yet published ("To be confirmed"). */
export type Pkg = {
  id: string;
  tier: PackageTier;
  name: string;
  /** Fixed service fee in the display currency. `null` = price to be confirmed. */
  price: number | null;
  blurb: string;
  deliverables: string[];
  turnaround: string;
  revisions: string;
  exclusions: string[];
  /** Optional featured flag for the recommended / most popular tier. */
  featured?: boolean;
  /** Optional max advertising budget constraint (Operational Validation only). */
  adBudgetMin?: number;
};

export type Service = {
  id: ServiceId;
  stage: number;
  code: string;
  title: string;
  shortTitle: string;
  purpose: string;
  summary: string;
  areas: string[];
  packages: Pkg[];
  /** True for the premium, expert-led offering. */
  premium?: boolean;
  /** Only Operational Validation has a separate, merchant-chosen ad budget. */
  adBudget?: boolean;
};

export type StageStatus = 'Passed' | 'Needs Attention' | 'Not Ready' | 'Not Validated' | 'Not Yet Eligible';

export type StageResult = {
  serviceId: ServiceId;
  stage: number;
  title: string;
  score: number | null;
  status: StageStatus;
  verified: number;
  total: number;
  /** Checks the system could observe on the public store. */
  passed: string[];
  /** Observable gaps. */
  missing: string[];
  /** Requirements that cannot be verified without access/evidence. */
  unverified: string[];
  summary: string;
};

export type Recommendation = {
  serviceId: ServiceId;
  tier: PackageTier;
  price: number | null;
  reason: string;
  /** Rough cost estimate to reach the next stage. */
  estimatedCost: number | null;
};

import type { StoreSignals } from './lib/assess';

export type ReadinessReport = {
  id: string;
  storeUrl: string;
  normalisedUrl: string;
  createdAt: string;
  overall: number;
  currentStage: {
    number: number;
    title: string;
    label: string;
    /** True when stage 1-4 checks pass but operational validation is unproven. */
    provisional: boolean;
  };
  stages: StageResult[];
  criticalIssues: string[];
  strengths: string[];
  conclusion: string;
  recommendation: Recommendation;
  signals: StoreSignals;
};
