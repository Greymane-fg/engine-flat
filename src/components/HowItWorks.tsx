import { useReveal } from '../hooks';

const STEPS = [
  {
    n: '01',
    title: 'Choose Your Path',
    body: 'Submit your store for an assessment, or pick a service directly.',
  },
  {
    n: '02',
    title: 'Understand Your Requirements',
    body: 'See your readiness level and exactly what is needed to progress.',
  },
  {
    n: '03',
    title: 'Select Your Package',
    body: 'Pick the package that fits. Fixed pricing, defined deliverables.',
  },
  {
    n: '04',
    title: 'Get Matched With an Expert',
    body: 'A specialist reviews your store and confirms the scope with you.',
  },
  {
    n: '05',
    title: 'Move Closer to Growth',
    body: 'Complete the work and move toward validated operations and marketing.',
  },
];

export function HowItWorks() {
  useReveal();

  return (
    <section className="section section--lilac hiw" id="how-it-works">
      <div className="shell">
        <div className="hiw__head reveal">
          <span className="eyebrow">The process</span>
          <h2 className="h2">
            Getting Your Store Ready<br className="hide-sm" /> Is Simple.
          </h2>
          <p className="lede hiw__lede">
            Five steps to a clear plan. No obligation until you approve a package.
          </p>
        </div>

        <ol className="hiw__track">
          {STEPS.map((s, i) => (
            <li key={s.n} className="hiw__step reveal" data-delay={String(i + 1)}>
              <span className="hiw__marker" aria-hidden="true">
                <span className="hiw__dot" />
              </span>
              <div className="hiw__body">
                <span className="hiw__n">{s.n}</span>
                <h3 className="h4">{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
