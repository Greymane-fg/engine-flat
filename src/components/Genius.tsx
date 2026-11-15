import { ArrowRight, BarChart3, Brain, Compass, Layers, PenTool, Users } from 'lucide-react';
import { useApp } from '../store';

const DIFFERENTIATORS = [
  { icon: Brain, label: 'Store-specific marketing strategies' },
  { icon: Compass, label: 'Competitor and market intelligence' },
  { icon: Layers, label: 'Customer acquisition architecture' },
  { icon: PenTool, label: 'Creative and campaign development' },
  { icon: BarChart3, label: 'Performance optimization' },
  { icon: Users, label: 'Expert-led execution' },
];

export function Genius() {
  const { openModal } = useApp();

  return (
    <section className="section genius" id="genius" aria-labelledby="genius-title">
      <div className="genius__media" aria-hidden="true">
        <img src="/genius.jpg" alt="" loading="lazy" decoding="async" />
        <div className="genius__veil" />
      </div>

      <div className="shell genius__inner">
        <div className="genius__copy">
          <span className="eyebrow reveal">Stage 05 · Genius Marketing</span>
          <h2 className="h2 reveal" id="genius-title" data-delay="1">
            Your Store Deserves<br className="hide-sm" /> More Than{' '}
            <span className="genius__em">Generic Marketing.</span>
          </h2>
          <p className="lede reveal" data-delay="2">
            Generic marketing can help establish whether your products have market
            potential. But sustainable growth requires more than running advertisements
            and hoping for results.
          </p>
          <p className="genius__body reveal" data-delay="2">
            Genius Marketing is our expert-led approach to understanding your business,
            identifying opportunities, developing customized strategies and building
            campaigns designed around your actual growth objectives.
          </p>

          <div className="genius__actions reveal" data-delay="3">
            <button className="btn btn--primary btn--lg" onClick={() => openModal({ kind: 'genius' })}>
              Explore Genius Marketing
              <ArrowRight size={17} className="arrow" />
            </button>
            <button
              className="btn btn--glass"
              onClick={() => openModal({ kind: 'assessment' })}
            >
              Check my readiness
            </button>
          </div>
        </div>

        <div className="genius__panel reveal" data-delay="2">
          <div className="genius__panel-head">
            <span className="chip chip--chartreuse">What makes it different</span>
          </div>
          <ul className="genius__list">
            {DIFFERENTIATORS.map(({ icon: Icon, label }) => (
              <li key={label}>
                <span className="genius__icon">
                  <Icon size={16} />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <div className="genius__panel-foot">
            <strong>From $8,000</strong>
            <span>Advertising spend is separate from the service fee.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
