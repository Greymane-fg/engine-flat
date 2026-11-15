import { ArrowRight, Fingerprint, Radar, Scale, Wrench } from 'lucide-react';
import { useApp } from '../store';

const PRINCIPLES = [
  {
    icon: Wrench,
    title: 'Readiness before reach',
    body: 'No acquisition budget is deployed until the store can hold the traffic it pays for.',
  },
  {
    icon: Scale,
    title: 'Evidence over assumptions',
    body: 'If a requirement cannot be verified, we say so rather than marking it passed.',
  },
  {
    icon: Radar,
    title: 'Sequential, not siloed',
    body: 'Progress follows the five stages. A late-stage win cannot mask an earlier failure.',
  },
  {
    icon: Fingerprint,
    title: 'Fixed scope, fixed price',
    body: 'Every package lists exactly what is included, excluded and how long it takes.',
  },
];

export function About() {
  const { openModal } = useApp();

  return (
    <section className="section section--aubergine about" id="about">
      <div className="shell about__inner">
        <div className="about__copy reveal">
          <span className="eyebrow">About the platform</span>
          <h2 className="h2">
            A Shopify readiness and growth platform — not another agency.
          </h2>
          <p className="lede">
            Most store owners are told to advertise first and fix later. We built the
            opposite sequence. Engine assesses what a store is actually ready for,
            prices the work required to close the gap, and only then connects the
            business with the specialists who execute it.
          </p>
          <p className="about__body">
            The platform operates on three revenue models: readiness services that
            build the foundation, Genius Marketing engagements for stores prepared to
            scale, and continued growth services for ongoing optimisation. Assessment
            is the entry point — the catalogue is the path.
          </p>
          <button
            className="btn btn--primary"
            onClick={() => openModal({ kind: 'assessment' })}
          >
            Start with an assessment
            <ArrowRight size={16} className="arrow" />
          </button>
        </div>

        <ul className="about__grid">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title} className="about__card glass reveal" data-delay={String(i + 1)}>
              <span className="about__icon">
                <p.icon size={18} />
              </span>
              <h3 className="h4">{p.title}</h3>
              <p>{p.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="shell">
        <blockquote className="about__quote reveal">
          <p>
            You don't just need marketing.
            <br />
            <span>You need a store that's ready for it.</span>
          </p>
        </blockquote>
      </div>
    </section>
  );
}
