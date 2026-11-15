import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDashed,
  Gauge,
  Lock,
  Mail,
  MessageCircle,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Modal } from './Modal';
import { Field, SelectField } from './ui';
import { useApp, makeApplication, type ApplicationContact } from '../store';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_OBJECTIVES,
  generateReport,
  inspectStore,
  type AssessmentInput,
  type StoreSignals,
} from '../lib/assess';
import { parseStoreUrl, uid, formatDate, whatsappLink } from '../lib/utils';
import { sendApplicationEmails, summariseDelivery, type DeliveryState, EMPTY_DELIVERY } from '../lib/email';
import { ReportView } from './ReportView';
import type { ReadinessReport } from '../types';

type Stage = 'form' | 'scanning' | 'complete';

const SCAN_STEPS = [
  'Resolving the store domain',
  'Reading public storefront signals',
  'Checking policy and navigation coverage',
  'Scoring the five readiness stages',
  'Selecting a recommended package',
];

export function AssessmentModal({
  prefill,
  onClose,
}: {
  prefill?: Partial<ApplicationContact>;
  onClose: () => void;
}) {
  const { addApplication, addReport, settings, openModal, notify, applications } = useApp();
  const [stage, setStage] = useState<Stage>('form');
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryState>(EMPTY_DELIVERY);
  const [values, setValues] = useState({
    storeUrl: prefill?.storeUrl ?? '',
    fullName: prefill?.fullName ?? '',
    email: prefill?.email ?? '',
    whatsapp: prefill?.whatsapp ?? '',
    category: prefill?.category ?? '',
    objective: prefill?.objective ?? '',
    consent: false,
  });

  const parsed = useMemo(() => parseStoreUrl(values.storeUrl), [values.storeUrl]);
  const set = (k: keyof typeof values) => (v: string | boolean) =>
    setValues((s) => ({ ...s, [k]: v }));

  const urlValid = parsed.ok;
  const contactValid =
    values.fullName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email) &&
    values.whatsapp.replace(/[^\d]/g, '').length >= 7;

  async function run() {
    if (!urlValid) {
      setError('Please enter a valid Shopify store address before submitting.');
      return;
    }
    if (!contactValid) {
      setError('Please provide your name, a valid email address and a WhatsApp number.');
      return;
    }
    if (!values.consent) {
      setError('Please accept the assessment disclaimer to continue.');
      return;
    }
    setError(null);
    setStage('scanning');
    setScanStep(0);

    const started = Date.now();
    const signals: StoreSignals = await inspectStore(values.storeUrl);

    // Let each scan line complete so the process is legible, not a fake spinner.
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      const wait = 420 + Math.random() * 260;
      await new Promise((r) => setTimeout(r, wait));
      setScanStep(i + 1);
    }
    const elapsed = Date.now() - started;
    if (elapsed < 3200) await new Promise((r) => setTimeout(r, 3200 - elapsed));

    const input: AssessmentInput = {
      storeUrl: values.storeUrl,
      fullName: values.fullName,
      email: values.email,
      whatsapp: values.whatsapp,
      category: values.category,
      objective: values.objective,
    };
    const generated = generateReport(input, signals, { id: uid('rep') });

    const app = makeApplication(
      {
        type: 'assessment',
        serviceFee: null,
        total: 0,
        reportId: generated.id,
        contact: {
          fullName: values.fullName,
          email: values.email,
          whatsapp: values.whatsapp,
          storeUrl: parsed.normalised,
          category: values.category,
          objective: values.objective,
          consentGiven: true,
        },
      },
      applications,
    );

    addReport(generated);

    // Same two templates as a package application — the report block is
    // included when one exists, and ignored by templates that omit it.
    const outcome = await sendApplicationEmails(app, generated);
    setDelivery(outcome);

    addApplication({ ...app, delivery: outcome });
    setReport(generated);
    setStage('complete');
    notify(
      outcome.complete
        ? 'Assessment complete. Your report is on screen and on its way to your inbox.'
        : 'Assessment complete. Your report is ready.',
    );
  }

  function applyRecommendation() {
    if (!report) return;
    openModal({
      kind: 'service',
      serviceId: report.recommendation.serviceId,
      tier: report.recommendation.tier,
      apply: true,
    });
  }

  return (
    <Modal
      onClose={onClose}
      label="Store readiness assessment"
      size={stage === 'complete' ? 'wide' : 'mid'}
    >
      <div className="modal__glow" aria-hidden="true" />

      {stage === 'form' && (
        <>
          <div className="modal__head">
            <div className="steps" aria-hidden="true">
              {['Details', 'Scan', 'Report'].map((s, i) => (
                <span key={s} style={{ display: 'contents' }}>
                  {i > 0 && <span className="steps__sep" />}
                  <span className={`steps__item ${i === 0 ? 'steps__item--active' : ''}`}>
                    <i>{i + 1}</i>
                    {s}
                  </span>
                </span>
              ))}
            </div>
            <h2 className="modal__title" style={{ marginTop: 20 }}>
              Let's Find Out How Ready Your Store Is.
            </h2>
            <p className="modal__sub" style={{ marginTop: 10 }}>
              Enter your Shopify store URL to begin your readiness assessment. Your
              report is generated instantly from public store signals and reviewed by
              an expert.
            </p>
          </div>

          <div className="modal__body">
            {!settings.assessmentLive ? (
              <div className="assess-note" style={{ borderColor: 'rgba(214,152,0,0.35)', background: 'rgba(214,152,0,0.1)' }}>
                <AlertTriangle size={15} />
                <span>
                  Assessments are paused while we work through the current queue. You can
                  still browse the catalogue and apply for any package directly — or
                  message us on WhatsApp and we will assess your store manually.
                </span>
              </div>
            ) : null}

            <form
              className="assess-form"
              onSubmit={(e) => {
                e.preventDefault();
                void run();
              }}
            >
              <div className="url-field">
                <label className="field" htmlFor="storeUrl">
                  <span className="field__label">
                    Shopify store URL <em>*</em>
                  </span>
                  <input
                    id="storeUrl"
                    name="storeUrl"
                    value={values.storeUrl}
                    placeholder="yourstore.com"
                    autoComplete="url"
                    autoFocus
                    aria-invalid={Boolean(values.storeUrl) && !urlValid}
                    onChange={(e) => set('storeUrl')(e.target.value)}
                  />
                  {values.storeUrl && !urlValid ? (
                    <span className="field__error">{parsed.error}</span>
                  ) : (
                    <span className="field__hint">
                      Accepts yourstore.com or yourstore.myshopify.com
                    </span>
                  )}
                </label>
              </div>

              <div className="assess-form__group">
                <span className="assess-form__label">Your details</span>
                <div className="form-grid">
                  <Field
                    label="Full name"
                    name="fullName"
                    value={values.fullName}
                    onChange={set('fullName')}
                    autoComplete="name"
                    required
                  />
                  <Field
                    label="Email address"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={set('email')}
                    autoComplete="email"
                    required
                  />
                  <Field
                    label="WhatsApp number"
                    name="whatsapp"
                    value={values.whatsapp}
                    onChange={set('whatsapp')}
                    placeholder="+234 801 000 0000"
                    autoComplete="tel"
                    required
                  />
                  <SelectField
                    label="Business category"
                    name="category"
                    value={values.category}
                    onChange={set('category')}
                    options={BUSINESS_CATEGORIES}
                  />
                  <div className="span-2">
                    <SelectField
                      label="Primary business objective"
                      name="objective"
                      value={values.objective}
                      onChange={set('objective')}
                      options={BUSINESS_OBJECTIVES}
                    />
                  </div>
                </div>
              </div>

              <label className="assess-consent">
                <input
                  type="checkbox"
                  checked={values.consent}
                  onChange={(e) => set('consent')(e.target.checked)}
                />
                <span>
                  I understand this assessment evaluates observable store conditions
                  and supplied information. It does not guarantee sales, profitability or
                  advertising performance.{' '}
                  <button
                    type="button"
                    onClick={() => openModal({ kind: 'policy', policy: 'Assessment Disclaimer' })}
                  >
                    Read the disclaimer
                  </button>
                </span>
              </label>

              {error && (
                <div className="assess-note" style={{ borderColor: 'rgba(217,83,91,0.4)', background: 'rgba(217,83,91,0.1)' }}>
                  <AlertTriangle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <div className="assess-note">
                <Lock size={15} />
                <span>
                  Your store URL, contact details and assessment data are handled
                  securely and used only to prepare your report and contact you about
                  it.
                </span>
              </div>

              <button
                className="btn btn--primary btn--block btn--lg"
                type="submit"
                disabled={!settings.assessmentLive}
              >
                <ScanSearch size={17} />
                {settings.assessmentLive
                  ? 'Submit Store for Assessment'
                  : 'Assessments temporarily paused'}
              </button>
            </form>
          </div>
        </>
      )}

      {stage === 'scanning' && (
        <div className="modal__body">
          <div className="scan">
            <div className="scan__orb">
              <span className="scan__core">
                <Gauge size={28} />
              </span>
            </div>
            <div>
              <h2 className="scan__title">Assessing your store</h2>
              <p className="scan__domain">{parsed.normalised}</p>
            </div>
            <div className="scan__list">
              {SCAN_STEPS.map((s, i) => {
                const done = scanStep > i;
                const active = scanStep === i;
                return (
                  <div
                    key={s}
                    className={`scan__task ${done ? 'scan__task--done' : ''} ${active ? 'scan__task--active' : ''}`}
                  >
                    <span className="scan__task-icon">
                      {done ? <Check size={11} strokeWidth={3.4} /> : <CircleDashed size={11} />}
                    </span>
                    {s}
                  </div>
                );
              })}
            </div>
            <p className="muted" style={{ fontSize: 11.5, maxWidth: 380 }}>
              Checks that require account access or a test order are marked "Not
              Validated" rather than assumed.
            </p>
          </div>
        </div>
      )}

      {stage === 'complete' && report && (
        <>
          <div className="modal__head">
            <div className="steps" aria-hidden="true">
              {['Details', 'Scan', 'Report'].map((s, i) => (
                <span key={s} style={{ display: 'contents' }}>
                  {i > 0 && <span className="steps__sep" />}
                  <span className={`steps__item ${i < 2 ? 'steps__item--done' : 'steps__item--active'}`}>
                    <i>{i < 2 ? <Check size={10} strokeWidth={3.4} /> : i + 1}</i>
                    {s}
                  </span>
                </span>
              ))}
            </div>
            <h2 className="modal__title" style={{ marginTop: 20 }}>
              Your Readiness Report
            </h2>
            <p className="modal__sub" style={{ marginTop: 8 }}>
              {report.normalisedUrl} · Generated {formatDate(report.createdAt)} · Review
              ID {report.id.slice(0, 10).toUpperCase()}
            </p>

            {delivery.sent.includes('user') && (
              <div className="delivery-note">
                <Mail size={14} />
                <span>
                  A copy has been emailed to <strong>{values.email}</strong>, and our team
                  has been notified.
                </span>
              </div>
            )}
            {delivery.sent.includes('admin') && !delivery.sent.includes('user') && (
              <div className="delivery-note delivery-note--warn">
                <AlertTriangle size={14} />
                <span>
                  Our team has been notified, but the copy to{' '}
                  <strong>{values.email}</strong> could not be sent. You can download the
                  summary below.
                </span>
              </div>
            )}
            {delivery.failed.some((f) => f.channel === 'admin') && (
              <div className="delivery-note delivery-note--warn">
                <AlertTriangle size={14} />
                <span>
                  {summariseDelivery(delivery).message} Your report is on this screen, and
                  you can download a summary below.
                </span>
              </div>
            )}
          </div>
          <div className="modal__body">
            <ReportView report={report} />
          </div>
          <div className="modal__foot" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn--glass btn--sm" onClick={() => setStage('form')}>
              <ArrowLeft size={14} />
              Assess another store
            </button>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                if (!report) return;
                applyRecommendation();
              }}
            >
              <Sparkles size={14} />
              Apply for the recommended package
              <ArrowRight size={14} className="arrow" />
            </button>
          </div>
        </>
      )}

      {stage === 'form' && (
        <div className="modal__foot">
          <span className="steps__item">
            <ShieldCheck size={14} />
            {settings.assessmentLive ? 'No payment required for assessment' : 'Assessment paused'}
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a
              className="btn btn--glass btn--sm"
              href={whatsappLink(
                "Hi, I'd like help understanding my Shopify store's readiness.",
              )}
              target="_blank"
              rel="noreferrer noopener"
            >
              <MessageCircle size={14} />
              Ask on WhatsApp
            </a>
            <button className="btn btn--glass btn--sm" onClick={onClose}>
              Continue browsing
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
