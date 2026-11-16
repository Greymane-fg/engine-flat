import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useApp } from '../store';

export function FinalCta() {
  const { openModal } = useApp();

  return (
    <section className="section final-cta" id="contact" aria-labelledby="cta-title">
      <div className="shell final-cta__inner reveal">
        <span className="eyebrow">Next step</span>
        <h2 className="h2 final-cta__title" id="cta-title">
          Your next stage <span className="final-cta__em">starts here.</span>
        </h2>
        <p className="lede final-cta__lede">
          One form, one score, one clear next step.
        </p>
        <div className="final-cta__actions">
          <button
            className="btn btn--primary btn--lg"
            onClick={() => openModal({ kind: 'assessment' })}
          >
            Assess my store
            <ArrowRight size={17} className="arrow" />
          </button>
          <a className="btn btn--glass btn--lg" href="#explore">
            See services
            <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}
