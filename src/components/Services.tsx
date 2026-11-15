import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import { useApp } from '../store';
import { money } from '../lib/utils';
import type { Service } from '../types';

function fromPrice(service: Service): string {
  const prices = service.packages
    .map((p) => p.price)
    .filter((p): p is number => typeof p === 'number');
  if (!prices.length) return 'Pricing on application';
  return `from ${money(Math.min(...prices))}`;
}

export function Services() {
  const { services, openModal, settings } = useApp();

  return (
    <section className="section section--light services" id="services">
      <div className="shell">
        <div className="section-head section-head--row">
          <div className="reveal">
            <span className="eyebrow">Service catalogue</span>
            <h2 className="h2">
              Find Exactly What<br className="hide-sm" /> Your Store Needs.
            </h2>
          </div>
          <p className="lede reveal services__lede" data-delay="1">
            Five services, each mapped to a readiness stage. Every service has three
            fixed-price packages with defined deliverables, exclusions and turnaround
            times. All prices are shown in {settings.currencyCode}.
          </p>
        </div>

        <div className="services__list">
          {services.map((service, i) => {
            const paused = settings.pausedServices.includes(service.id);
            return (
              <article
                key={service.id}
                className={`svc-row reveal ${service.premium ? 'svc-row--premium' : ''} ${paused ? 'svc-row--paused' : ''}`}
                data-delay={String(Math.min(i + 1, 5))}
              >
                <span className="svc-row__code">{service.code}</span>

                <div className="svc-row__main">
                  <div className="svc-row__title-line">
                    <h3 className="h3">{service.title}</h3>
                    {service.premium && (
                      <span className="chip chip--chartreuse">
                        <Sparkles size={12} /> Premium
                      </span>
                    )}
                    {paused && <span className="chip">Paused</span>}
                  </div>
                  <p className="svc-row__purpose">{service.purpose}</p>
                  <ul className="svc-row__areas">
                    {service.areas.slice(0, 3).map((a) => (
                      <li key={a}>
                        <Check size={13} />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="svc-row__side">
                  <div className="svc-row__price">
                    <strong>{fromPrice(service)}</strong>
                    <span>3 packages · fixed pricing</span>
                  </div>
                  <button
                    className={`btn ${service.premium ? 'btn--primary' : 'btn--outline'} btn--sm`}
                    onClick={() =>
                      service.premium
                        ? openModal({ kind: 'genius' })
                        : openModal({ kind: 'service', serviceId: service.id })
                    }
                  >
                    View Packages
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <p className="services__note reveal">
          Not sure which applies to you?{' '}
          <button
            className="link-arrow"
            style={{ display: 'inline-flex', fontSize: 'inherit', verticalAlign: 'baseline' }}
            onClick={() => openModal({ kind: 'assessment' })}
          >
            Run the readiness assessment
          </button>{' '}
          and we will recommend a starting point.
        </p>
      </div>
    </section>
  );
}
