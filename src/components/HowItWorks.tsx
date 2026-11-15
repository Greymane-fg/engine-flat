import { useReveal } from '../hooks';

const STEPS = [
  {
    n: '01',
    title: 'Choose Your Path',
    body: 'Submit your store for an assessment or select a service directly. Neither route is locked — the assessment recommends, it does not restrict.',
  },
  {
    n: '02',
    title: 'Understand Your Requirements',
    body: "Identify your store's current readiness level and the specific improvements required to reach the next stage.",
  },
  {
    n: '03',
    title: 'Select Your Package',
    body: 'Choose the service and package that best addresses your needs. Every package has fixed pricing and defined deliverables.',
  },
  {
    n: '04',
    title: 'Get Matched With an Expert',
    body: 'Your application is forwarded to an appropriate specialist, who reviews your store and confirms the scope with you.',
  },
  {
    n: '05',
    title: 'Move Closer to Growth',
    body: 'Complete the required improvements and progress towards validated operations and strategic marketing.',
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
            Five steps from uncertainty to a clear, expert-backed plan. No obligations
            until you approve a package.
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
