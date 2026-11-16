import { ArrowRight, ArrowUpRight, Compass, Gauge, Layers, ShieldCheck } from 'lucide-react';
import { useApp } from '../store';

export function Introduction() {
  const { openModal } = useApp();

  return (
    <section className="section section--light intro" id="introduction">
      <div className="shell">
        <div className="intro__head">
          <div className="reveal">
            <span className="eyebrow">The readiness principle</span>
            <h2 className="h2 intro__title">
              Not Every Store Is<br />
              <span className="intro__title-em">Ready for Marketing.</span>
            </h2>
          </div>
          <div className="intro__copy reveal" data-delay="1">
            <p className="lede">
              A beautiful storefront doesn't automatically translate into sales.
            </p>
            <p className="intro__body">
              Before investing in customer acquisition, your Shopify store needs the
              right technical foundation, a convincing brand experience, organic
              discoverability and a functioning purchasing journey.
            </p>
            <p className="intro__body">
              Our readiness framework helps you understand exactly where your store
              stands and what needs to happen next.
            </p>
            <div className="intro__facts">
              <div>
                <strong>05</strong>
                <span>Readiness stages</span>
              </div>
              <div>
                <strong>15</strong>
                <span>Fixed packages</span>
              </div>
              <div>
                <strong>01</strong>
                <span>Clear path forward</span>
              </div>
            </div>
          </div>
        </div>

        <div className="paths">
          <article className="path-card path-card--assess reveal" data-delay="1">
            <div className="path-card__glow" aria-hidden="true" />
            <div className="path-card__top">
              <span className="path-card__icon">
                <Gauge size={20} />
              </span>
              <span className="chip chip--dark">Path A</span>
            </div>
            <h3 className="h3 path-card__title">Assess My Store</h3>
            <p className="path-card__text">
              Submit your store URL and get a scored readiness report — current stage,
              critical issues and the recommended next step.
            </p>
            <ul className="path-card__list">
              <li>
                <ShieldCheck size={15} /> Overall readiness score, 0–100%
              </li>
              <li>
                <Layers size={15} /> Stage-by-stage breakdown
              </li>
              <li>
                <Compass size={15} /> Recommended package and cost
              </li>
            </ul>
            <button
              className="btn btn--primary btn--block"
              onClick={() => openModal({ kind: 'assessment' })}
            >
              Start Assessment
              <ArrowRight size={16} className="arrow" />
            </button>
          </article>

          <article className="path-card path-card--services reveal" data-delay="2">
            <div className="path-card__top">
              <span className="path-card__icon path-card__icon--light">
                <Layers size={20} />
              </span>
              <span className="chip">Path B</span>
            </div>
            <h3 className="h3 path-card__title">I Know What I Need</h3>
            <p className="path-card__text path-card__text--dark">
              Skip the assessment and go straight to the catalogue. Fixed-price packages
              across setup, branding, discovery, validation and Genius Marketing.
            </p>
            <ul className="path-card__list path-card__list--dark">
              <li>
                <ShieldCheck size={15} /> Three fixed packages per service
              </li>
              <li>
                <Layers size={15} /> Clear deliverables and exclusions
              </li>
              <li>
                <Compass size={15} /> Matched with a specialist after applying
              </li>
            </ul>
            <a className="btn btn--outline btn--block" href="#services">
              Explore Services
              <ArrowUpRight size={16} />
            </a>
            <p className="path-card__note">
              The assessment recommends — it never restricts what you can buy.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
