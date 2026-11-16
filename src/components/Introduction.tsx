import { ArrowRight, ArrowUpRight, Gauge, Layers } from 'lucide-react';
import { useApp } from '../store';

/**
 * The fork: assess, or buy directly. Two cards, one sentence each.
 * The long-form justification (why readiness matters, stage by stage) now
 * lives in the Explore tabs, so a visitor meets the choice before the theory.
 */
export function Introduction() {
  const { openModal } = useApp();

  return (
    <section className="section section--light intro" id="introduction">
      <div className="shell">
        <div className="intro__head">
          <div className="reveal">
            <span className="eyebrow">Start here</span>
            <h2 className="h2 intro__title">
              Not every store is
              <br />
              <span className="intro__title-em">ready for marketing.</span>
            </h2>
          </div>
          <p className="lede intro__lede reveal" data-delay="1">
            Advertising cannot fix a store that cannot convert. Pick the path that
            matches what you already know.
          </p>
        </div>

        <div className="paths">
          <article className="path-card path-card--assess reveal" data-delay="1">
            <div className="path-card__top">
              <span className="path-card__icon">
                <Gauge size={20} />
              </span>
              <span className="chip chip--dark">Recommended</span>
            </div>
            <h3 className="h3 path-card__title">Assess my store</h3>
            <p className="path-card__text">
              Tell us your store URL. You get a readiness score, your current stage
              and the next step worth paying for.
            </p>
            <button
              className="btn btn--primary btn--block"
              onClick={() => openModal({ kind: 'assessment' })}
            >
              Start assessment
              <ArrowRight size={16} className="arrow" />
            </button>
          </article>

          <article className="path-card path-card--services reveal" data-delay="2">
            <div className="path-card__top">
              <span className="path-card__icon path-card__icon--light">
                <Layers size={20} />
              </span>
              <span className="chip">Skip ahead</span>
            </div>
            <h3 className="h3 path-card__title">I know what I need</h3>
            <p className="path-card__text">
              Go straight to the catalogue. Five services, three fixed-price
              packages each, everything published.
            </p>
            <a className="btn btn--outline btn--block" href="#explore">
              See services
              <ArrowUpRight size={16} />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
