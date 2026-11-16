import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Sparkles } from 'lucide-react';
import { STAGE_DEFINITIONS } from '../data/readiness';
import { useApp } from '../store';
import { money } from '../lib/utils';

/** One line per stage, drawn from the framework rather than restated. */
const STAGE_LINE: Record<number, string> = {
  1: 'The technical machinery: domain, payments, shipping, policies.',
  2: 'The storefront people trust and buy from.',
  3: 'Being found in search, social and AI answers.',
  4: 'Proving the store works before spending on it.',
  5: 'An expert-led growth engagement built around your business.',
};

/**
 * One compartment instead of four scroll sections.
 *
 * The page used to stack Introduction, Stages, How It Works, the catalogue,
 * Genius and About. Each was defensible on its own, but together a visitor had
 * to read ~1,000 words before they could decide anything. Those four sections
 * all answer the same question — "what is this and what does it cost" — so
 * they live here behind four tabs, one visible at a time.
 *
 * Tabs are real buttons with aria-pressed rather than a tablist, because the
 * panels are not focus-managed: every panel stays mounted so the content is
 * still crawlable and findable with in-page search.
 */

type TabId = 'stages' | 'services' | 'process' | 'about';

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: 'stages', label: 'The five stages', hint: 'What readiness means' },
  { id: 'services', label: 'Services & pricing', hint: 'What you can buy' },
  { id: 'process', label: 'How it works', hint: 'What happens after you apply' },
  { id: 'about', label: 'About', hint: 'Who runs this' },
];

export function Explore() {
  const [tab, setTab] = useState<TabId>('stages');

  return (
    <section className="section section--light explore" id="explore">
      <div className="shell">
        <div className="explore__head reveal">
          <span className="eyebrow">Explore</span>
          <h2 className="h2">Everything, one layer at a time.</h2>
        </div>

        <div className="explore__nav reveal" role="group" aria-label="Explore the platform">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              className={`explore__tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="explore__tab-label">{t.label}</span>
              <span className="explore__tab-hint">{t.hint}</span>
            </button>
          ))}
        </div>

        {/* Only the active panel is shown; all stay in the DOM. */}
        <div className="explore__body">
          <Panel active={tab === 'stages'}>
            <StagesPanel />
          </Panel>
          <Panel active={tab === 'services'}>
            <ServicesPanel />
          </Panel>
          <Panel active={tab === 'process'}>
            <ProcessPanel />
          </Panel>
          <Panel active={tab === 'about'}>
            <AboutPanel />
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Panel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="explore__panel" hidden={!active}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Stages */

function StagesPanel() {
  const { openModal } = useApp();

  return (
    <div className="panel-stack">
      <p className="lede panel-stack__lede">
        Five stages, in order. Each one has to hold before the next is worth
        spending on.
      </p>

      <ol className="stages-mini">
        {STAGE_DEFINITIONS.map((s) => {
          const premium = s.stage === 5;
          return (
            <li key={s.stage} className={`stages-mini__row ${premium ? 'is-premium' : ''}`}>
              <span className="stages-mini__num">{String(s.stage).padStart(2, '0')}</span>
              <div className="stages-mini__body">
                <h3 className="stages-mini__title">
                  {s.title}
                  {premium && (
                    <span className="chip chip--chartreuse">
                      <Sparkles size={11} /> Premium
                    </span>
                  )}
                </h3>
                <p className="stages-mini__text">{STAGE_LINE[s.stage]}</p>
              </div>
              <button
                className="stages-mini__link"
                onClick={() =>
                  premium
                    ? openModal({ kind: 'genius' })
                    : openModal({ kind: 'service', serviceId: s.serviceId })
                }
              >
                View
                <ArrowUpRight size={14} />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="panel-note">
        <p>
          Progress is sequential — a later win cannot mask an earlier failure.
        </p>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => openModal({ kind: 'assessment' })}
        >
          Check my stage
          <ArrowRight size={15} className="arrow" />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Services */

function ServicesPanel() {
  const { services, openModal } = useApp();

  const from = (prices: (number | null)[]) => {
    const known = prices.filter((p): p is number => typeof p === 'number');
    return known.length ? `from ${money(Math.min(...known))}` : 'Pricing on application';
  };

  return (
    <div className="panel-stack">
      <p className="lede panel-stack__lede">
        Five services, three fixed packages each. Every price, deliverable and
        exclusion is stated up front.
      </p>

      <ul className="svc-mini">
        {services.map((s) => (
          <li key={s.id} className={`svc-mini__row ${s.premium ? 'is-premium' : ''}`}>
            <span className="svc-mini__code">{s.code}</span>
            <div className="svc-mini__body">
              <h3 className="svc-mini__title">
                {s.title}
                {s.premium && (
                  <span className="chip chip--chartreuse">
                    <Sparkles size={11} /> Premium
                  </span>
                )}
              </h3>
              <p className="svc-mini__meta">
                {s.packages.length} packages · {from(s.packages.map((p) => p.price))}
              </p>
            </div>
            <button
              className={`btn ${s.premium ? 'btn--primary' : 'btn--outline'} btn--sm`}
              onClick={() =>
                s.premium
                  ? openModal({ kind: 'genius' })
                  : openModal({ kind: 'service', serviceId: s.id })
              }
            >
              Packages
              <ArrowUpRight size={14} />
            </button>
          </li>
        ))}
      </ul>

      <p className="panel-note panel-note--plain">
        Not sure which applies?{' '}
        <button className="link-inline" onClick={() => openModal({ kind: 'assessment' })}>
          Run the free assessment
        </button>{' '}
        and we will name a starting point.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- Process */

const STEPS = [
  {
    title: 'Assess or apply',
    body: 'Run the readiness assessment, or go straight to a package if you already know what you need.',
  },
  {
    title: 'We review',
    body: 'A specialist reads your submission within one business day and confirms scope.',
  },
  {
    title: 'Quote and terms',
    body: 'You receive a fixed quote and payment terms. Nothing is charged automatically.',
  },
  {
    title: 'Work begins',
    body: 'Delivery starts on the agreed scope, with progress visible against the same five stages.',
  },
  {
    title: 'Handover',
    body: 'You get the deliverables, the documentation and a clear view of what comes next.',
  },
];

function ProcessPanel() {
  const { openModal } = useApp();

  return (
    <div className="panel-stack">
      <p className="lede panel-stack__lede">
        Five steps from first click to delivered work.
      </p>
      <ol className="steps-mini">
        {STEPS.map((s, i) => (
          <li key={s.title} className="steps-mini__row">
            <span className="steps-mini__num">{i + 1}</span>
            <div>
              <h3 className="steps-mini__title">{s.title}</h3>
              <p className="steps-mini__text">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="panel-note">
        <p>Applications reach us by email and are answered by a person, not a bot.</p>
        <button className="btn btn--outline btn--sm" onClick={() => openModal({ kind: 'track' })}>
          Track an application
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- About */

function AboutPanel() {
  return (
    <div className="panel-stack about-mini">
      <h3 className="about-mini__title">A readiness-first growth studio.</h3>
      <p>
        Most store owners are sold advertising before the store can convert it.
        We work the other way round: fix the foundations, prove the store works,
        and only then spend money on acquisition.
      </p>
      <ul className="about-mini__list">
        <li>
          <Check size={14} /> Fixed prices, published up front
        </li>
        <li>
          <Check size={14} /> Deliverables and exclusions named before you pay
        </li>
        <li>
          <Check size={14} /> No claim of a result we have not verified
        </li>
      </ul>
    </div>
  );
}
