import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ExternalLink,
  Lock,
  LogOut,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../store';
import { APPLICATION_STAGES } from '../config';
import { formatDateTime, money } from '../lib/utils';
import type { Application } from '../store';
import type { PackageTier, ServiceId } from '../types';

type Tab = 'applications' | 'services' | 'settings';
const EXPERTS = [
  'Grace A. — Structure & Operations',
  'Tobi O. — Brand & Storefront',
  'Ifeoma N. — SEO, AEO & GEO',
  'Daniel K. — Validation & Paid Media',
  'Amara B. — Genius Marketing',
];

export function AdminModal({ onClose }: { onClose: () => void }) {
  const { adminUnlocked, applications, reports, lockAdmin, services } = useApp();
  const [tab, setTab] = useState<Tab>('applications');

  return (
    <Modal onClose={onClose} label="Team console" size="wide" light>
      {!adminUnlocked ? (
        <AdminGate />
      ) : (
        <>
          <div className="modal__head">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <span className="eyebrow" style={{ marginBottom: 12 }}>
                  Internal console
                </span>
                <h2 className="modal__title">Operations</h2>
                <p className="modal__sub" style={{ marginTop: 8 }}>
                  Review submissions, manage package pricing and control service
                  availability.
                </p>
              </div>
              <button
                className="btn btn--outline btn--sm"
                onClick={() => {
                  lockAdmin();
                  onClose();
                }}
              >
                <LogOut size={14} />
                Lock console
              </button>
            </div>

            <div className="admin-tabs" style={{ marginTop: 20 }} role="tablist">
              <button
                role="tab"
                aria-selected={tab === 'applications'}
                className={`admin-tab ${tab === 'applications' ? 'is-active' : ''}`}
                onClick={() => setTab('applications')}
              >
                <Users size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Applications ({applications.length})
              </button>
              <button
                role="tab"
                aria-selected={tab === 'services'}
                className={`admin-tab ${tab === 'services' ? 'is-active' : ''}`}
                onClick={() => setTab('services')}
              >
                <Tag size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Services &amp; pricing
              </button>
              <button
                role="tab"
                aria-selected={tab === 'settings'}
                className={`admin-tab ${tab === 'settings' ? 'is-active' : ''}`}
                onClick={() => setTab('settings')}
              >
                <Settings2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Settings
              </button>
            </div>
          </div>

          <div className="modal__body">
            {tab === 'applications' && (
              <ApplicationsTab applications={applications} reports={reports} />
            )}
            {tab === 'services' && (
              <ServicesTab
                services={services}
                count={services.length}
              />
            )}
            {tab === 'settings' && <SettingsTab />}
          </div>
        </>
      )}
    </Modal>
  );
}

function AdminGate() {
  const { unlockAdmin } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="modal__body">
      <div className="admin-gate">
        <span className="admin-gate__icon">
          <Lock size={22} />
        </span>
        <h2>Team access</h2>
        <p>
          This console is for authorised team members. Enter the workspace passcode to
          review applications, manage pricing and control service availability.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!unlockAdmin(code)) setError('Incorrect passcode. Try again.');
          }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <label className="field">
            <span className="field__label">Workspace passcode</span>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
              autoFocus
            />
          </label>
          {error && <span className="field__error">{error}</span>}
          <button className="btn btn--violet btn--block" type="submit">
            Unlock console
          </button>
        </form>
        <p className="admin-gate__hint">
          Demo passcode: <strong>engine</strong> — replace with real authentication before
          production.
        </p>
      </div>
    </div>
  );
}

function ApplicationsTab({
  applications,
  reports,
}: {
  applications: Application[];
  reports: ReturnType<typeof useApp>['reports'];
}) {
  const { updateApplication, openModal } = useApp();
  const [open, setOpen] = useState<string | null>(applications[0]?.id ?? null);

  const stats = useMemo(() => {
    const assessments = applications.filter((a) => a.type === 'assessment').length;
    const sold = applications.filter((a) => a.type === 'service');
    const pipeline = sold.reduce((n, a) => n + a.total, 0);
    const adBudget = sold.reduce((n, a) => n + (a.adBudget ?? 0), 0);
    const active = applications.filter((a) => a.status !== 'Completed').length;
    return { assessments, sold: sold.length, pipeline, adBudget, active };
  }, [applications]);

  if (applications.length === 0) {
    return (
      <div className="admin-empty">
        <strong>No submissions yet</strong>
        Assessments and service applications appear here. Run the readiness flow on the
        public site to generate test data.
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="admin-stats">
        <div className="admin-stat">
          <strong>{stats.assessments}</strong>
          <span>Assessments</span>
        </div>
        <div className="admin-stat">
          <strong>{stats.sold}</strong>
          <span>Service applications</span>
        </div>
        <div className="admin-stat">
          <strong>{money(stats.pipeline)}</strong>
          <span>Pipeline value</span>
        </div>
        <div className="admin-stat">
          <strong>{money(stats.adBudget)}</strong>
          <span>Client ad budgets</span>
        </div>
      </div>

      <div className="admin-list">
        {applications.map((a) => {
          const report = a.reportId ? reports.find((r) => r.id === a.reportId) : undefined;
          const isOpen = open === a.id;
          return (
            <div key={a.id} className="admin-row">
              <button
                className="admin-row__head"
                onClick={() => setOpen(isOpen ? null : a.id)}
                aria-expanded={isOpen}
              >
                <span>
                  <span className="admin-row__ref">{a.reference}</span>
                  <div className="admin-row__title">
                    {a.type === 'assessment'
                      ? `Assessment — ${a.contact.storeUrl.replace('https://', '')}`
                      : `${a.packageTier} package — ${a.serviceId}`}
                  </div>
                  <div className="admin-row__meta">
                    {a.contact.fullName} · {a.contact.email} · {formatDateTime(a.createdAt)}
                  </div>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="chip">{a.status}</span>
                  <ChevronDown
                    size={15}
                    style={{ transition: 'transform 240ms var(--ease)', transform: isOpen ? 'rotate(180deg)' : 'none', color: 'var(--ink-muted)' }}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="admin-row__body">
                  <dl className="admin-detail-grid">
                    <div>
                      <dt>Store</dt>
                      <dd>{a.contact.storeUrl}</dd>
                    </div>
                    <div>
                      <dt>WhatsApp</dt>
                      <dd>{a.contact.whatsapp}</dd>
                    </div>
                    <div>
                      <dt>Service fee</dt>
                      <dd>{a.serviceFee === null ? '—' : money(a.serviceFee)}</dd>
                    </div>
                    <div>
                      <dt>Advertising budget</dt>
                      <dd>{a.adBudget ? money(a.adBudget) : '—'}</dd>
                    </div>
                    <div>
                      <dt>Total</dt>
                      <dd>
                        <strong>{money(a.total)}</strong>
                      </dd>
                    </div>
                    <div>
                      <dt>Expert</dt>
                      <dd>{a.expert ?? 'Unassigned'}</dd>
                    </div>
                    {a.contact.requirements && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <dt>Requirements</dt>
                        <dd>{a.contact.requirements}</dd>
                      </div>
                    )}
                    {report && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <dt>Assessment</dt>
                        <dd>
                          {report.overall}% overall · current stage {report.currentStage.number}/5 ·{' '}
                          {report.stages.filter((s) => s.status === 'Not Validated').length}{' '}
                          stage(s) unverified
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="admin-status-select">
                    <span>Status</span>
                    <select
                      value={a.status}
                      onChange={(e) =>
                        updateApplication(a.id, {
                          status: e.target.value as Application['status'],
                        })
                      }
                    >
                      {APPLICATION_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <span style={{ marginLeft: 8 }}>Assign expert</span>
                    <select
                      value={a.expert ?? ''}
                      onChange={(e) =>
                        updateApplication(a.id, { expert: e.target.value || undefined })
                      }
                    >
                      <option value="">Unassigned</option>
                      {EXPERTS.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-actions">
                    {report && (
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => openModal({ kind: 'report', report })}
                      >
                        <ExternalLink size={13} />
                        Open report
                      </button>
                    )}
                    <a
                      className="btn btn--outline btn--sm"
                      href={`mailto:${a.contact.email}?subject=Your%20Engine%20application%20${a.reference}`}
                    >
                      Email merchant
                    </a>
                    <a
                      className="btn btn--outline btn--sm"
                      href={`https://wa.me/${a.contact.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      WhatsApp
                    </a>
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => updateApplication(a.id, { paid: !a.paid })}
                    >
                      {a.paid ? <Check size={13} /> : null}
                      {a.paid ? 'Payment recorded' : 'Mark paid'}
                    </button>
                  </div>
                  {a.expert && (
                    <p className="admin-row-note">
                      Assigned to {a.expert}. Merchant will be contacted using the details
                      provided once status reaches <strong>Assigned to Expert</strong>.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServicesTab({
  services,
  count,
}: {
  services: ReturnType<typeof useApp>['services'];
  count: number;
}) {
  const { updatePackage, toggleService, settings, notify } = useApp();
  // Start collapsed: the console opens on the list, not on a form.
  const [open, setOpen] = useState<ServiceId | null>(null);

  return (
    <div className="admin">
      <p className="muted" style={{ fontSize: 12.5 }}>
        {count} services · prices are live on the public catalogue immediately. Leave a
        price blank to display "To be confirmed".
      </p>

      <div className="admin-price-grid">
        {services.map((s) => {
          const paused = settings.pausedServices.includes(s.id);
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="admin-svc">
              <button
                className="admin-svc__head"
                onClick={() => setOpen(isOpen ? null : s.id)}
                aria-expanded={isOpen}
              >
                <span>
                  <span className="admin-svc__code">{s.code}</span>
                  {s.title}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {paused && <span className="chip">Paused</span>}
                  <span
                    className={`switch ${paused ? '' : 'is-on'}`}
                    role="switch"
                    aria-checked={!paused}
                    aria-label={`Toggle ${s.title} availability`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleService(s.id);
                      notify(paused ? `${s.title} resumed.` : `${s.title} paused.`);
                    }}
                  />
                  <ChevronDown
                    size={15}
                    style={{ color: 'var(--ink-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 240ms var(--ease)' }}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="admin-pkgs">
                  {s.packages.map((p) => (
                    <div key={p.id} className="admin-pkg">
                      <label htmlFor={`price-${p.id}`}>{p.tier}</label>
                      <input
                        id={`name-${p.id}`}
                        type="text"
                        value={p.name}
                        aria-label={`${p.tier} package name`}
                        onChange={(e) =>
                          updatePackage(s.id, p.id, { name: e.target.value })
                        }
                      />
                      <input
                        id={`price-${p.id}`}
                        type="number"
                        min={0}
                        placeholder="TBC"
                        value={p.price ?? ''}
                        aria-label={`${p.tier} package price`}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          updatePackage(s.id, p.id, {
                            price: raw === '' ? null : Math.max(0, Number(raw)),
                          });
                        }}
                      />
                    </div>
                  ))}
                  <div className="admin-pkg admin-pkg--wide">
                    <label htmlFor={`ta-${s.id}`}>Turnaround</label>
                    <input
                      id={`ta-${s.id}`}
                      type="text"
                      value={s.packages[0].turnaround}
                      aria-label={`${s.title} turnaround`}
                      onChange={(e) => {
                        const value = e.target.value;
                        s.packages.forEach((p) => updatePackage(s.id, p.id, { turnaround: value }));
                      }}
                    />
                    <span className="admin-pkg__hint">applies to all tiers</span>
                  </div>
                  <p className="admin-row-note">
                    Package names and prices update across the catalogue, package modals
                    and application summaries. Leave a price blank to display "To be
                    confirmed".
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function SettingsTab() {
  const { settings, updateSettings, resetDemoData, applications, reports } = useApp();
  const [brand, setBrand] = useState(settings.brandName);
  const [email, setEmail] = useState(settings.contactEmail);
  const [whatsapp, setWhatsapp] = useState(settings.whatsappDigits);

  return (
    <div className="admin">
      <div className="admin-settings">
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Brand name</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Contact email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">WhatsApp (digits only, intl.)</span>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Display currency</span>
            <input
              value={`${settings.currencyCode} (${settings.currencySymbol})`}
              readOnly
              style={{ color: 'var(--ink-muted)' }}
            />
          </label>
        </div>
        <div className="admin-actions">
          <button
            className="btn btn--violet btn--sm"
            onClick={() => {
              updateSettings({ brandName: brand, contactEmail: email, whatsappDigits: whatsapp });
            }}
          >
            <Check size={13} />
            Save settings
          </button>
        </div>

        <div className="admin-toggle">
          <div>
            <strong>Accept new assessments</strong>
            <span>When off, the assessment form shows a paused state.</span>
          </div>
          <span
            className={`switch ${settings.assessmentLive ? 'is-on' : ''}`}
            role="switch"
            aria-checked={settings.assessmentLive}
            aria-label="Toggle assessment availability"
            onClick={() => updateSettings({ assessmentLive: !settings.assessmentLive })}
          />
        </div>

        <div className="admin-toggle">
          <div>
            <strong>Demo data</strong>
            <span>
              {applications.length} applications · {reports.length} reports stored in this
              browser.
            </span>
          </div>
          <button className="btn btn--outline btn--sm" onClick={resetDemoData}>
            <RotateCcw size={13} />
            Reset
          </button>
        </div>

        <div className="policy__notice">
          <ShieldCheck size={15} />
          <span>
            Pricing, availability and settings are persisted to this browser for
            demonstration. In production these route to a secured backend with role-based
            access and an audit log.
          </span>
        </div>
      </div>
    </div>
  );
}

export type { PackageTier as _PackageTier };
