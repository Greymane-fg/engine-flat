import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  FileText,
  Mail,
  Minus,
  Sparkles,
} from 'lucide-react';
import { Modal } from './Modal';
import { Field, SelectField, TextAreaField } from './ui';
import { useApp, makeApplication } from '../store';
import { sendApplicationEmails, summariseDelivery, type DeliveryState, EMPTY_DELIVERY } from '../lib/email';
import { money, currencyCode, whatsappLink } from '../lib/utils';
import { BUSINESS_CATEGORIES } from '../lib/assess';
import { SITE } from '../config';
import type { PackageTier, Service, ServiceId } from '../types';

type Step = 'compare' | 'apply' | 'review' | 'done';

type FormValues = {
  fullName: string;
  email: string;
  whatsapp: string;
  storeUrl: string;
  category: string;
  requirements: string;
  notes: string;
  adBudget: string;
  consent: boolean;
};

const EMPTY_FORM: FormValues = {
  fullName: '',
  email: '',
  whatsapp: '',
  storeUrl: '',
  category: '',
  requirements: '',
  notes: '',
  adBudget: '500',
  consent: false,
};

export function ServiceModal({
  serviceId,
  tier,
  apply,
  onClose,
}: {
  serviceId: ServiceId;
  tier?: PackageTier;
  apply?: boolean;
  onClose: () => void;
}) {
  // Note: paused services remain openable so merchants can read what is included;
  // the pause state is surfaced and the apply action is disabled instead.
  const { services, settings } = useApp();
  const service = services.find((s) => s.id === serviceId);
  const paused = settings.pausedServices.includes(serviceId);

  const [step, setStep] = useState<Step>(tier && apply ? 'apply' : 'compare');
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (!service) return '';
    if (tier) return service.packages.find((p) => p.tier === tier)?.id ?? '';
    return service.packages.find((p) => p.featured)?.id ?? service.packages[0].id;
  });
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryState>(EMPTY_DELIVERY);
  const [sending, setSending] = useState(false);

  if (!service) return null;
  const pkg = service.packages.find((p) => p.id === selectedId) ?? service.packages[0];
  const budget = Math.max(0, Number(values.adBudget.replace(/[^\d.]/g, '')) || 0);
  const fee = pkg.price ?? 0;
  const total = fee + (service.adBudget ? budget : 0);

  const set = (k: keyof FormValues) => (v: string | boolean) =>
    setValues((s) => ({ ...s, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (values.fullName.trim().length < 2) e.fullName = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email))
      e.email = 'Enter a valid email address.';
    if (values.whatsapp.replace(/\D/g, '').length < 7)
      e.whatsapp = 'Enter a valid WhatsApp number.';
    if (!/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}/i.test(values.storeUrl.trim()))
      e.storeUrl = 'Enter your Shopify store URL.';
    if (!values.consent) e.consent = 'Please accept the service terms to continue.';
    setErrors(e);
    if (Object.keys(e).length) {
      setStep('apply');
      return false;
    }
    return true;
  }

  const { addApplication, notify, applications } = useApp();

  async function submit() {
    if (!validate() || sending) return;
    const app = makeApplication({
      type: 'service',
      serviceId: service!.id,
      packageId: pkg.id,
      packageTier: pkg.tier,
      serviceFee: pkg.price,
      adBudget: service!.adBudget ? budget : undefined,
      total,
      contact: {
        fullName: values.fullName,
        email: values.email,
        whatsapp: values.whatsapp,
        storeUrl: values.storeUrl,
        category: values.category,
        requirements: values.requirements,
        notes: values.notes,
        consentGiven: true,
      },
    }, applications);

    // Route to the team inbox and to the merchant before confirming anything.
    setSending(true);
    const outcome = await sendApplicationEmails(app);
    setSending(false);

    const delivered = { ...app, delivery: outcome };
    addApplication(delivered);
    setReference(app.reference);
    setDelivery(outcome);

    const summary = summariseDelivery(outcome);
    notify(
      summary.tone === 'success'
        ? 'Application submitted — a specialist will review it shortly.'
        : 'Application saved. See the confirmation screen for delivery details.',
    );
    setStep('done');
  }

  const stepIdx = { compare: 0, apply: 1, review: 1, done: 2 }[step];

  return (
    <Modal onClose={onClose} label={`${service.title} packages`} size="full">
      <div className="modal__glow" aria-hidden="true" />

      <div className="modal__head">
        <div className="steps" aria-hidden="true">
          {['Compare packages', 'Apply', 'Confirmed'].map((s, i) => (
            <span key={s} style={{ display: 'contents' }}>
              {i > 0 && <span className="steps__sep" />}
              <span
                className={`steps__item ${
                  i < stepIdx ? 'steps__item--done' : i === stepIdx ? 'steps__item--active' : ''
                }`}
              >
                <i>{i < stepIdx ? <Check size={10} strokeWidth={3.6} /> : i + 1}</i>
                {s}
              </span>
            </span>
          ))}
        </div>

        <div className="svc-modal__head">
          <div className="svc-modal__intro">
            <span className={`chip ${service.premium ? 'chip--chartreuse' : 'chip--dark'}`}>
              Stage {service.code}
              {service.premium ? ' · Premium offering' : ''}
            </span>
            <h2 className="modal__title" style={{ marginTop: 12 }}>
              {service.title}
            </h2>
            <p className="modal__sub" style={{ marginTop: 10 }}>
              {service.summary}
            </p>
          </div>
          <ul className="svc-modal__areas">
            {service.areas.map((a) => (
              <li key={a}>
                <Check size={12} />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {step === 'compare' && (
        <>
          <div className="modal__body">
            {paused && (
              <div className="adbudget-note" style={{ marginTop: 0, marginBottom: 18, borderColor: 'rgba(214,152,0,0.35)', background: 'rgba(214,152,0,0.1)' }}>
                <AlertTriangle size={15} />
                <span>
                  <strong>This service is temporarily paused.</strong> You can still
                  review the packages below — new applications for this service are on
                  hold. Contact us and we will let you know when it reopens.
                </span>
              </div>
            )}
            <div className="pkg-grid">
              {service.packages.map((p) => {
                const isSel = p.id === selectedId;
                return (
                  <article
                    key={p.id}
                    className={`pkg ${isSel ? 'pkg--selected' : ''} ${
                      p.featured ? 'pkg--featured' : ''
                    } ${service.premium ? 'pkg--premium' : ''}`}
                  >
                    {p.featured && (
                      <span className="pkg__flag">
                        <Sparkles size={11} /> Recommended
                      </span>
                    )}
                    <header className="pkg__head">
                      <span className="pkg__tier">{p.tier}</span>
                      <h3 className="pkg__name">{p.name}</h3>
                      <div className="pkg__price">
                        {p.price === null ? (
                          <em>To be confirmed</em>
                        ) : (
                          <>
                            <strong>{money(p.price)}</strong>
                            <span>
                              {currencyCode()}
                              {service.adBudget ? ' · service fee' : ''}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="pkg__blurb">{p.blurb}</p>
                    </header>

                    <div className="pkg__meta">
                      <span>
                        <Clock size={12} />
                        {p.turnaround}
                      </span>
                      <span>
                        <FileText size={12} />
                        {p.revisions}
                      </span>
                    </div>

                    <div className="pkg__section">
                      <h4>Deliverables</h4>
                      <ul className="pkg__list">
                        {p.deliverables.map((d) => (
                          <li key={d}>
                            <Check size={12} strokeWidth={2.8} />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pkg__section pkg__section--excl">
                      <h4>Exclusions</h4>
                      <ul className="pkg__list pkg__list--excl">
                        {p.exclusions.map((d) => (
                          <li key={d}>
                            <Minus size={12} />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      className={`btn ${
                        isSel ? 'btn--primary' : p.featured ? 'btn--violet' : 'btn--glass'
                      } btn--block pkg__cta`}
                      disabled={paused}
                      onClick={() => {
                        setSelectedId(p.id);
                        setStep('apply');
                      }}
                    >
                      {paused ? 'Applications paused' : isSel ? 'Select Package' : `Choose ${p.tier}`}
                      {!paused && <ArrowRight size={15} className="arrow" />}
                    </button>
                  </article>
                );
              })}
            </div>

            {service.adBudget ? (
              <div className="adbudget-note">
                <AlertTriangle size={15} />
                <span>
                  <strong>Advertising budget is separate from the service fee.</strong>{' '}
                  Operational Validation has two cost components: the fee paid to the
                  platform for conducting the validation, and the budget allocated to the
                  marketing exercise. You choose the budget in the next step.
                </span>
              </div>
            ) : service.premium ? (
              <div className="adbudget-note">
                <AlertTriangle size={15} />
                <span>
                  <strong>Advertising expenditure is separate.</strong> Genius Marketing
                  fees cover strategy, creative and management. Media spend is billed
                  separately unless a package expressly includes it in writing.
                </span>
              </div>
            ) : null}
          </div>
          <div className="modal__foot">
            <span className="muted" style={{ fontSize: 12 }}>
              Prices in {currencyCode()} · fixed per package · no hidden add-ons
            </span>
            <button className="btn btn--glass btn--sm" onClick={onClose}>
              Keep browsing
            </button>
          </div>
        </>
      )}

      {step === 'apply' && (
        <>
          <div className="modal__body">
            <div className="apply-layout">
              <div className="apply-layout__form">
                <h3 className="h3" style={{ marginBottom: 6 }}>
                  Apply for {pkg.tier}
                </h3>
                <p className="modal__sub" style={{ marginBottom: 22 }}>
                  Tell us who you are and what the store needs. Your application goes
                  directly to the appropriate specialist for review.
                </p>

                <div className="form-grid">
                  <Field
                    label="Full name"
                    name="a-name"
                    value={values.fullName}
                    onChange={set('fullName')}
                    required
                    error={errors.fullName}
                    autoComplete="name"
                  />
                  <Field
                    label="Email address"
                    name="a-email"
                    type="email"
                    value={values.email}
                    onChange={set('email')}
                    required
                    error={errors.email}
                    autoComplete="email"
                  />
                  <Field
                    label="WhatsApp number"
                    name="a-whats"
                    value={values.whatsapp}
                    onChange={set('whatsapp')}
                    placeholder="+234 801 000 0000"
                    required
                    error={errors.whatsapp}
                    autoComplete="tel"
                  />
                  <Field
                    label="Shopify store URL"
                    name="a-store"
                    value={values.storeUrl}
                    onChange={set('storeUrl')}
                    placeholder="yourstore.com"
                    required
                    error={errors.storeUrl}
                  />
                  <div className="span-2">
                    <SelectField
                      label="Business category"
                      name="a-cat"
                      value={values.category}
                      onChange={set('category')}
                      options={BUSINESS_CATEGORIES}
                    />
                  </div>
                  <div className="span-2">
                    <TextAreaField
                      label="Brief description of requirements"
                      name="a-req"
                      value={values.requirements}
                      onChange={set('requirements')}
                      placeholder="What needs to change, and what outcome are you expecting?"
                    />
                  </div>
                  <div className="span-2">
                    <TextAreaField
                      label="Additional information"
                      name="a-notes"
                      value={values.notes}
                      onChange={set('notes')}
                      rows={3}
                      placeholder="Access notes, timelines, existing providers, anything relevant."
                    />
                  </div>
                </div>

                {service.adBudget && (
                  <div className="adbudget">
                    <div className="adbudget__head">
                      <div>
                        <h4>Advertising budget</h4>
                        <p>
                          Choose how much you allocate to the controlled marketing
                          exercise. It is added to the service fee and used for
                          advertising — the platform earns only the service fee.
                        </p>
                      </div>
                      <div className="adbudget__input">
                        <span>{currencyCode()}</span>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={values.adBudget}
                          onChange={(e) => set('adBudget')(e.target.value)}
                          aria-label="Advertising budget"
                        />
                      </div>
                    </div>
                    <div className="adbudget__presets">
                      {[0, 300, 500, 1000, 2000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          className={`adbudget__preset ${budget === v ? 'is-active' : ''}`}
                          onClick={() => set('adBudget')(String(v))}
                        >
                          {v === 0 ? 'No ad budget' : money(v)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="assess-consent" style={{ marginTop: 20 }}>
                  <input
                    type="checkbox"
                    checked={values.consent}
                    onChange={(e) => set('consent')(e.target.checked)}
                  />
                  <span>
                    I understand the deliverables, exclusions and turnaround stated for
                    this package, and that outcomes depend on product demand, pricing,
                    competition and advertising budget.
                  </span>
                </label>
                {errors.consent && <span className="field__error">{errors.consent}</span>}
              </div>

              <aside className="apply-layout__summary">
                <div className="summary-card">
                  <span className="summary-card__label">Application summary</span>
                  <div className="summary-card__title">{service.title}</div>
                  <div className="summary-card__sub">{pkg.name}</div>

                  <dl className="summary-card__lines">
                    <div>
                      <dt>
                        {service.adBudget ? 'Operational Validation' : 'Service fee'} —{' '}
                        {pkg.tier}
                      </dt>
                      <dd>{pkg.price === null ? 'TBC' : money(pkg.price)}</dd>
                    </div>
                    {service.adBudget && (
                      <div>
                        <dt>Advertising budget</dt>
                        <dd>{money(budget)}</dd>
                      </div>
                    )}
                    <div className="summary-card__total">
                      <dt>Total expected payment</dt>
                      <dd>{money(total)}</dd>
                    </div>
                  </dl>

                  {service.adBudget && (
                    <p className="summary-card__note">
                      {money(fee)} is the service fee. {money(budget)} is allocated to
                      advertising.
                    </p>
                  )}

                  <ul className="summary-card__facts">
                    <li>
                      <Clock size={12} /> {pkg.turnaround}
                    </li>
                    <li>
                      <FileText size={12} /> {pkg.revisions}
                    </li>
                  </ul>

                  <button
                    className="btn btn--primary btn--block"
                    onClick={() => void submit()}
                    disabled={sending}
                  >
                    {sending ? 'Submitting…' : 'Submit Application'}
                    {!sending && <ArrowRight size={15} className="arrow" />}
                  </button>
                  <p className="summary-card__fine">
                    Applications are reviewed before any payment is taken. A specialist
                    will confirm scope and payment terms with you.
                  </p>
                </div>
              </aside>
            </div>
          </div>
          <div className="modal__foot">
            <button className="btn btn--glass btn--sm" onClick={() => setStep('compare')}>
              <ArrowLeft size={14} />
              Back to packages
            </button>
            <button className="btn btn--glass btn--sm" onClick={() => setStep('review')}>
              Review before submitting
            </button>
          </div>
        </>
      )}

      {step === 'review' && (
        <>
          <div className="modal__body">
            <h3 className="h3" style={{ marginBottom: 8 }}>
              Review &amp; submit
            </h3>
            <p className="modal__sub" style={{ marginBottom: 22 }}>
              Confirm the service, package, amounts and your contact details. Nothing is
              charged now — payment terms are confirmed after specialist review.
            </p>

            <div className="review">
              <dl className="review__lines">
                <div>
                  <dt>Selected service</dt>
                  <dd>{service.title}</dd>
                </div>
                <div>
                  <dt>Selected package</dt>
                  <dd>
                    {pkg.tier} — {pkg.name}
                  </dd>
                </div>
                <div>
                  <dt>Service fee</dt>
                  <dd>{pkg.price === null ? 'To be confirmed' : money(pkg.price)}</dd>
                </div>
                {service.adBudget && (
                  <div>
                    <dt>Advertising budget</dt>
                    <dd>{money(budget)}</dd>
                  </div>
                )}
                <div className="review__total">
                  <dt>Total expected payment</dt>
                  <dd>{money(total)}</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {values.fullName || '—'}
                    <br />
                    <span className="review__muted">
                      {values.email || '—'} · {values.whatsapp || '—'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Store</dt>
                  <dd>{values.storeUrl || '—'}</dd>
                </div>
                <div>
                  <dt>Deliverables</dt>
                  <dd>
                    {pkg.deliverables.length} items · {pkg.turnaround}
                  </dd>
                </div>
              </dl>
              <p className="summary-card__fine">
                After submission your application moves to <strong>Submitted →
                Awaiting Review</strong>. A specialist reviews it within one business day
                and contacts you on the details provided.
              </p>
            </div>
          </div>
          <div className="modal__foot">
            <button className="btn btn--glass btn--sm" onClick={() => setStep('apply')}>
              <ArrowLeft size={14} />
              Edit details
            </button>
            <button className="btn btn--primary" onClick={() => void submit()} disabled={sending}>
              {sending ? 'Submitting…' : 'Submit Application'}
              {!sending && <ArrowRight size={15} className="arrow" />}
            </button>
          </div>
        </>
      )}

      {step === 'done' && (
        <div className="modal__body">
          <div className="success">
            <div className={`success__mark ${delivery.failed.some((f) => f.channel === 'admin') ? 'success__mark--warn' : ''}`}>
              <Check size={30} strokeWidth={3} />
            </div>
            <h2 className="h1-lg">{summariseDelivery(delivery).title}</h2>
            <p className="modal__sub" style={{ textAlign: 'center' }}>
              {summariseDelivery(delivery).message}
            </p>

            {delivery.failed.length > 0 && (
              <div className="delivery-note delivery-note--warn">
                <AlertTriangle size={14} />
                <span>
                  Delivery issue: {delivery.failed.map((f) => f.reason).join('; ')}. You can
                  still reach us on{' '}
                  <a href={whatsappLink(`Application ${reference ?? ''}`)} target="_blank" rel="noreferrer noopener">
                    WhatsApp
                  </a>{' '}
                  or at {SITE.email}.
                </span>
              </div>
            )}

            {delivery.sent.includes('user') && (
              <div className="delivery-note">
                <Mail size={14} />
                <span>
                  A confirmation has been sent to <strong>{values.email}</strong>. Check
                  spam if it does not arrive within a few minutes.
                </span>
              </div>
            )}

            <div className="success__card">
              <div>
                <span>Reference</span>
                <strong>{reference ?? 'ENG-PENDING'}</strong>
              </div>
              <div>
                <span>Service</span>
                <strong>{service.shortTitle}</strong>
              </div>
              <div>
                <span>Package</span>
                <strong>
                  {pkg.tier} — {pkg.name}
                </strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Submitted</strong>
              </div>
            </div>

            <div className="success__actions">
              <TrackButton />
              <button className="btn btn--glass" onClick={onClose}>
                Back to the store
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function TrackButton() {
  const { openModal } = useApp();
  return (
    <button className="btn btn--primary" onClick={() => openModal({ kind: 'track' })}>
      Track this application
    </button>
  );
}

export type { Service as _Service };
