import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useApp } from '../store';

export function FinalCta() {
  const { openModal } = useApp();

  return (
    <section className="section final-cta" aria-labelledby="cta-title">
      <div className="final-cta__bg" aria-hidden="true">
        <span className="final-cta__orb final-cta__orb--1" />
        <span className="final-cta__orb final-cta__orb--2" />
        <span className="final-cta__lines" />
      </div>
      <div className="shell final-cta__inner reveal">
        <span className="eyebrow">Next step</span>
        <h2 className="h2 final-cta__title" id="cta-title">
          Your Next Stage <span className="final-cta__em">Starts Here.</span>
        </h2>
        <p className="lede final-cta__lede">
          Whether you're establishing your Shopify store, improving its shopping
          experience or preparing for advanced marketing, there's a clear next step.
          Let's identify it.
        </p>
        <div className="final-cta__actions">
          <button
            className="btn btn--primary btn--lg"
            onClick={() => openModal({ kind: 'assessment' })}
          >
            Assess My Store
            <ArrowRight size={17} className="arrow" />
          </button>
          <a className="btn btn--glass btn--lg" href="#services">
            Explore All Services
            <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}
