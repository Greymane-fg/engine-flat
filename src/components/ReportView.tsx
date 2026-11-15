import { Fragment, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  Info,
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
  BadgeCheck,
} from 'lucide-react';
import { ScoreRing, StatusBadge } from './ui';
import { STAGE_DEFINITIONS } from '../data/readiness';
import { SEED_SERVICES } from '../data/services';
import { money } from '../lib/utils';
import type { ReadinessReport } from '../types';
import { useApp } from '../store';

export function ReportView({ report }: { report: ReadinessReport }) {
  const [openStage, setOpenStage] = useState<number | null>(null);
  const { services, openModal } = useApp();

  const service = services.find((s) => s.id === report.recommendation.serviceId)
    ?? SEED_SERVICES.find((s) => s.id === report.recommendation.serviceId);

  const recommendationPrice =
    service?.packages.find((p) => p.tier === report.recommendation.tier)?.price ??
    report.recommendation.price;

  return (
    <div className="report">
      <div className="report__top">
        <ScoreRing value={report.overall} label="Readiness" size={124} stroke={7} />
        <div>
          <div className="report__stage-label">Current readiness stage</div>
          <div className="report__stage-title">{report.currentStage.label}</div>
          <div className="report__meta">
            <span>
              Store <strong>{report.normalisedUrl.replace('https://', '')}</strong>
            </span>
            <span>
              Checks passed <strong>{report.stages.reduce((n, s) => n + s.passed.length, 0)}</strong>
            </span>
          </div>
          {report.currentStage.provisional && (
            <div className="report__provisional">
              <Info size={13} />
              Progression is provisional — operational validation is still unproven.
            </div>
          )}
        </div>
      </div>

      <div className="report__table" aria-label="Stage breakdown">
        <div className="report__row report__row--head" role="row">
          <span>Stage</span>
          <span>Score</span>
          <span>Status</span>
        </div>
        {report.stages.map((s) => (
          <Fragment key={s.stage}>
            <button
              className={`report__row ${s.stage === 5 ? 'report__row--fifth' : ''}`}
              onClick={() => setOpenStage(openStage === s.stage ? null : s.stage)}
              aria-expanded={openStage === s.stage}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <span className="report__stage-name">
                <i>{String(s.stage).padStart(2, '0')}</i>
                <span>{s.title}</span>
              </span>
              <span className="report__score">
                <span className="report__score-bar">
                  <i style={{ width: `${s.score ?? 0}%` }} />
                </span>
                <b className={s.score === null ? 'is-null' : ''}>
                  {s.score === null ? '—' : `${s.score}%`}
                </b>
              </span>
              <span className="report__status-cell">
                <StatusBadge status={s.status} dark />
                <ChevronDown size={13} className="report__caret" aria-hidden="true" />
              </span>
            </button>
            {openStage === s.stage && <StageDetail stage={s.stage} report={report} />}
          </Fragment>
        ))}
      </div>

      <div className="report__grid2">
        <div className="report__panel report__panel--danger">
          <h4>
            <AlertTriangle size={13} />
            Critical issues
          </h4>
          <ul>
            {report.criticalIssues.map((issue) => (
              <li key={issue}>
                <AlertTriangle size={12} />
                {issue}
              </li>
            ))}
          </ul>
        </div>
        <div className="report__panel report__panel--good">
          <h4>
            <BadgeCheck size={13} />
            What is working
          </h4>
          <ul>
            {report.strengths.map((s) => (
              <li key={s}>
                <BadgeCheck size={12} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="report__conclusion">
        <span className="report__stage-label" style={{ display: 'block' }}>
          Assessment conclusion
        </span>
        {report.conclusion}
      </div>

      <div className="report__rec">
        <div>
          <div className="report__rec-label">Recommended next step</div>
          <div className="report__rec-title">
            {service?.title} — {report.recommendation.tier} Package
          </div>
          <p className="report__rec-reason">{report.recommendation.reason}</p>
          <div className="report__rec-price">
            <strong>{money(recommendationPrice)}</strong>
            <span>
              Estimated cost to reach the next stage
              {service?.adBudget ? ' (advertising budget separate)' : ''}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="btn btn--primary"
            onClick={() =>
              openModal({
                kind: 'service',
                serviceId: report.recommendation.serviceId,
                tier: report.recommendation.tier,
                apply: true,
              })
            }
          >
            <Sparkles size={15} />
            Select this package
          </button>
          {service && (
            <button
              className="btn btn--glass btn--sm"
              onClick={() => openModal({ kind: 'service', serviceId: service.id })}
            >
              Compare all packages
            </button>
          )}
        </div>
      </div>

      <div className="report__notice">
        <Info size={14} />
        <span>
          {report.signals.inspectionNote}{' '}
          Requirements that cannot be confirmed from a public storefront are marked{' '}
          <strong style={{ color: 'rgba(247,244,251,0.75)' }}>Not Validated</strong>, never
          assumed passed. This assessment does not guarantee sales, profitability or
          advertising performance.
        </span>
      </div>
    </div>
  );
}

function StageDetail({ stage, report }: { stage: number; report: ReadinessReport }) {
  const result = report.stages[stage - 1];
  const def = STAGE_DEFINITIONS[stage - 1];
  const evidenceChecks = def.checks.filter((c) => c.kind === 'evidence');

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        padding: '6px 18px 18px',
        background: 'rgba(0,0,0,0.18)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(247,244,251,0.6)', padding: '10px 0 14px' }}>
        {result.summary}
      </p>
      <div className="report__checks">
        {result.passed.length > 0 && (
          <CheckGroup
            icon={<Eye size={12} />}
            title="Observed as present"
            items={result.passed}
            tone="good"
          />
        )}
        {result.missing.length > 0 && (
          <CheckGroup
            icon={<AlertTriangle size={12} />}
            title="Missing or insufficient"
            items={result.missing}
            tone="bad"
          />
        )}
        {result.unverified.length > 0 && (
          <CheckGroup
            icon={<EyeOff size={12} />}
            title="Cannot be verified publicly"
            items={result.unverified}
            tone="neutral"
            note="Requires authorised access, a test transaction or merchant-supplied evidence."
          />
        )}
      </div>
      {evidenceChecks.length > 0 && result.passed.length === 0 && result.missing.length === 0 && (
        <p style={{ fontSize: 12, color: 'rgba(247,244,251,0.42)', marginTop: 10 }}>
          <TrendingUp size={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 5 }} />
          This stage is evidence-led. Schedule operational validation to have these
          checks formally verified.
        </p>
      )}
    </div>
  );
}

function CheckGroup({
  icon,
  title,
  items,
  tone,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: 'good' | 'bad' | 'neutral';
  note?: string;
}) {
  const color =
    tone === 'good' ? '#8ee0b0' : tone === 'bad' ? '#f0a2a7' : 'rgba(185,165,237,0.9)';
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <h5
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-body)',
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color,
          marginBottom: 8,
        }}
      >
        {icon}
        {title}
      </h5>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((i) => (
          <li key={i} style={{ fontSize: 12.2, lineHeight: 1.5, color: 'rgba(247,244,251,0.7)' }}>
            {i}
          </li>
        ))}
      </ul>
      {note && (
        <p style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(247,244,251,0.4)', marginTop: 8 }}>
          {note}
        </p>
      )}
    </div>
  );
}
