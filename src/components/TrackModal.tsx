import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Search, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../store';
import { APPLICATION_STAGES } from '../config';
import { formatDateTime, money } from '../lib/utils';
import { StatusBadge } from './ui';
import type { StageStatus } from '../types';

const STATUS_TONE: Record<string, StageStatus> = {
  Submitted: 'Not Validated',
  'Awaiting Review': 'Not Validated',
  'Assessment in Progress': 'Needs Attention',
  'Assessment Completed': 'Passed',
  'Awaiting Merchant Approval': 'Needs Attention',
  'Payment Pending': 'Needs Attention',
  'Assigned to Expert': 'Passed',
  'In Progress': 'Passed',
  Completed: 'Passed',
};

export function TrackModal({ onClose }: { onClose: () => void }) {
  const { applications, reports, openModal } = useApp();
  const [selected, setSelected] = useState<string | null>(applications[0]?.id ?? null);
  const [reference, setReference] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const app = applications.find((a) => a.id === selected) ?? null;
  const report = app?.reportId ? reports.find((r) => r.id === app.reportId) : null;

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    const found = applications.find(
      (a) => a.reference.toLowerCase() === reference.trim().toLowerCase(),
    );
    if (!found) {
      setSearchError('No application with that reference on this device.');
      return;
    }
    setSearchError(null);
    setSelected(found.id);
  }

  return (
    <Modal onClose={onClose} label="Track application" size="mid">
      <div className="modal__glow" aria-hidden="true" />
      <div className="modal__head">
        <span className="eyebrow" style={{ marginBottom: 12 }}>
          Application tracking
        </span>
        <h2 className="modal__title">Track Your Application</h2>
        <p className="modal__sub" style={{ marginTop: 10 }}>
          Follow your submission from review through to expert assignment. Applications
          are shown from this device.
        </p>
      </div>

      <div className="modal__body">
        {applications.length === 0 ? (
          <div className="success">
            <div className="success__mark" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--lavender)', boxShadow: 'none' }}>
              <ClipboardList size={26} />
            </div>
            <h3 className="h3" style={{ textAlign: 'center' }}>
              No applications yet
            </h3>
            <p className="modal__sub" style={{ textAlign: 'center' }}>
              Submit a store assessment or purchase a package and your application will
              appear here with live status.
            </p>
            <div className="success__actions">
              <button
                className="btn btn--primary"
                onClick={() => openModal({ kind: 'assessment' })}
              >
                Assess my store
                <ArrowRight size={15} className="arrow" />
              </button>
              <button className="btn btn--glass" onClick={onClose}>
                Browse services
              </button>
            </div>
          </div>
        ) : (
          <>
            {!app && (
              <form onSubmit={lookup} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Search reference, e.g. ENG-2026-1234"
                  className="field"
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--on-dark)',
                    fontSize: 13,
                  }}
                />
                <button className="btn btn--glass btn--sm" type="submit">
                  <Search size={14} />
                </button>
              </form>
            )}
            {searchError && <p className="field__error">{searchError}</p>}

            <div className="track-list">
              {applications.map((a) => (
                <button
                  key={a.id}
                  className={`track-item ${a.id === selected ? 'track-item--active' : ''}`}
                  onClick={() => setSelected(a.id)}
                >
                  <span>
                    <span className="track-item__ref">{a.reference}</span>
                    <div className="track-item__name">
                      {a.type === 'assessment'
                        ? 'Store Readiness Assessment'
                        : a.packageTier
                          ? `${a.packageTier} Package`
                          : 'Service Application'}
                    </div>
                    <div className="track-item__meta">
                      {a.contact.storeUrl.replace('https://', '')} · {formatDateTime(a.createdAt)}
                    </div>
                  </span>
                  <StatusBadge status={STATUS_TONE[a.status] ?? 'Not Validated'} dark />
                </button>
              ))}
            </div>

            {app && (
              <div className="track-detail" style={{ marginTop: 22 }}>
                <div>
                  <div className="report__stage-label">Current status</div>
                  <div className="report__stage-title">{app.status}</div>
                  {app.expert && (
                    <div className="report__meta">
                      <span>
                        Assigned to <strong>{app.expert}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="track-pipeline">
                  {APPLICATION_STAGES.map((s, i) => {
                    const currentIdx = APPLICATION_STAGES.indexOf(app.status);
                    const done = i < currentIdx;
                    const current = i === currentIdx;
                    return (
                      <div
                        key={s}
                        className={`track-stage ${done ? 'track-stage--done' : ''} ${
                          current ? 'track-stage--current' : ''
                        }`}
                      >
                        <span className="track-stage__dot">
                          {done ? <Check size={10} strokeWidth={3.4} /> : i + 1}
                        </span>
                        <span className="track-stage__label">{s}</span>
                      </div>
                    );
                  })}
                </div>

                <dl className="review__lines" style={{ margin: 0 }}>
                  <div>
                    <dt>Application</dt>
                    <dd>{app.reference}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>
                      {app.contact.fullName}
                      <br />
                      <span className="review__muted">
                        {app.contact.email} · {app.contact.whatsapp}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Store</dt>
                    <dd>{app.contact.storeUrl}</dd>
                  </div>
                  <div>
                    <dt>Value</dt>
                    <dd>{app.total === null ? 'Awaiting quote' : money(app.total)}</dd>
                  </div>
                  {typeof app.adBudget === 'number' && app.adBudget > 0 && (
                    <div>
                      <dt>Advertising budget</dt>
                      <dd>
                        {app.total === null
                          ? `${money(app.adBudget)} allocated to advertising, separate from the service fee`
                          : `${money(app.adBudget)} of ${money(app.total)} is allocated to advertising`}
                      </dd>
                    </div>
                  )}
                  {report && (
                    <div>
                      <dt>Readiness report</dt>
                      <dd>
                        {report.overall}% overall ·{' '}
                        {report.stages.find((s) => s.status === 'Not Ready') ? 'needs work' : 'progressing'}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="success__actions" style={{ justifyContent: 'flex-start' }}>
                  {report && (
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={() => openModal({ kind: 'report', report })}
                    >
                      <Sparkles size={14} />
                      View full report
                    </button>
                  )}
                  <button className="btn btn--glass btn--sm" onClick={onClose}>
                    <ArrowLeft size={14} />
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
