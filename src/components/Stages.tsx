import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { STAGE_DEFINITIONS } from '../data/readiness';
import { useApp } from '../store';
import { StageNumber } from './ui';

/** Short, human requirement summaries per stage — drawn from the framework. */
const REQUIREMENT_SUMMARY: Record<number, string[]> = {
  1: [
    'Account, domain and SSL configured',
    'Payments, shipping and fulfilment live',
    'Policies, navigation and collections in place',
  ],
  2: [
    'Logo, colour system and typography',
    'Homepage, product pages and cart designed',
    'Mobile responsive and conversion-focused',
  ],
  3: [
    'Technical SEO, metadata and schema',
    'Merchant feeds and AEO content',
    'GEO readiness for AI answer engines',
  ],
  4: [
    'Test purchases and checkout verified',
    'Fulfilment and tracking confirmed',
    'Controlled baseline marketing test',
  ],
  5: [
    'Market and competitor intelligence',
    'Custom acquisition strategy',
    'Creative, campaigns and optimisation',
  ],
};

const STAGE_BLURB: Record<number, string> = {
  1: 'The technical machinery the store needs to function. Not branding.',
  2: 'Turn a working store into a brand people trust and buy from.',
  3: 'Be found in search, social and AI answers — not just paid ads.',
  4: 'Prove the store works before you scale spending on it.',
  5: 'An expert-led growth engagement built around your business.',
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
          <p>Progress is sequential — a later win cannot mask an earlier failure.</p>
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
