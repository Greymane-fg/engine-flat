import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { STAGE_DEFINITIONS } from '../data/readiness';
import { useApp } from '../store';
import { StageNumber } from './ui';

/** Short, human requirement summaries per stage — drawn from the framework. */
const REQUIREMENT_SUMMARY: Record<number, string[]> = {
  1: [
    'Account, domain and SSL configured',
    'Payment gateways and checkout settings live',
    'Shipping zones, rates and fulfilment structure',
    'Privacy, refund, terms and shipping policies',
    'Navigation, collections and essential integrations',
  ],
  2: [
    'Logo, colour system and typography',
    'Homepage hero, value proposition and trust',
    'Product galleries, descriptions and variants',
    'Collection, search, cart and checkout experience',
    'Mobile responsiveness and conversion design',
  ],
  3: [
    'Technical SEO, metadata and schema markup',
    'Sitemap, indexing and Search Console',
    'Merchant Center eligibility and product feeds',
    'AEO: question-led, extractable content',
    'GEO: entity consistency and AI-answer readiness',
  ],
  4: [
    'Test purchases and checkout verification',
    'Payments, shipping calculations and notifications',
    'Fulfilment workflow and inventory sync',
    'Controlled baseline marketing exercise',
    'Traffic, conversion and CPA measurement',
  ],
  5: [
    'Market and competitor intelligence',
    'Custom acquisition and funnel architecture',
    'Creative strategy, angles and copy',
    'Meta, Google and TikTok campaign execution',
    'CRO, retention and continuous optimisation',
  ],
};

const STAGE_BLURB: Record<number, string> = {
  1: 'The technical and administrative machinery required for the store to function properly — not branding or visual design.',
  2: 'Transform the technical store into a recognisable, professional and conversion-conscious shopping experience.',
  3: 'Be found across search engines, social discovery platforms and AI-powered answer engines — not only paid traffic.',
  4: 'Prove the store works and that its products can generate purchases under real market conditions before scaling spend.',
  5: 'An expert-led growth engagement built around your store, products, audience and commercial objectives.',
};

export function Stages() {
  const { openModal } = useApp();

  return (
    <section className="section section--dark stages" id="stages">
      <div className="stages__ambient" aria-hidden="true" />
      <div className="shell">
        <div className="section-head section-head--row">
          <div className="reveal">
            <span className="eyebrow">The readiness framework</span>
            <h2 className="h2">
              Five Stages. One Clear Path<br className="hide-sm" /> to Growth.
            </h2>
          </div>
          <p className="lede reveal stages__lede" data-delay="1">
            Every stage addresses a different aspect of store preparedness. Identify
            what's complete, understand what's missing and determine what your store
            needs next.
          </p>
        </div>

        <div className="stages__rail reveal" aria-hidden="true">
          <span className="stages__rail-line" />
          {STAGE_DEFINITIONS.map((d) => (
            <span
              key={d.stage}
              className={`stages__rail-node ${d.stage === 5 ? 'stages__rail-node--premium' : ''}`}
            >
              <i />
            </span>
          ))}
        </div>

        <ol className="stages__grid">
          {STAGE_DEFINITIONS.map((def) => {
            const isPremium = def.stage === 5;
            return (
              <li
                key={def.stage}
                className={`stage-card reveal ${isPremium ? 'stage-card--premium' : ''}`}
                data-delay={String(Math.min(def.stage, 5))}
              >
                <div className="stage-card__head">
                  <StageNumber n={def.stage} premium={isPremium} />
                  {isPremium ? (
                    <span className="chip chip--chartreuse">
                      <Sparkles size={12} /> Premium
                    </span>
                  ) : (
                    <span className="stage-card__tier">Stage</span>
                  )}
                </div>

                <h3 className={`stage-card__title ${isPremium ? 'stage-card__title--premium' : ''}`}>
                  {isPremium ? 'Genius Marketing Strategy' : def.title}
                </h3>
                <p className="stage-card__blurb">{STAGE_BLURB[def.stage]}</p>

                <ul className="stage-card__list">
                  {REQUIREMENT_SUMMARY[def.stage].map((r) => (
                    <li key={r}>
                      <span className="stage-card__dot" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>

                <button
                  className={`stage-card__cta ${isPremium ? 'stage-card__cta--premium' : ''}`}
                  onClick={() => openModal({ kind: 'service', serviceId: def.serviceId })}
                >
                  View Service
                  <ArrowRight size={15} className="arrow" />
                </button>
              </li>
            );
          })}
        </ol>

        <div className="stages__foot reveal">
          <p>
            A critical failure in an earlier stage cannot be overridden by a high score
            in a later one. Progress is sequential, and the assessment enforces that.
          </p>
          <button
            className="btn btn--glass"
            onClick={() => openModal({ kind: 'assessment' })}
          >
            Find my stage
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
