import { ArrowRight, Download, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { ReportView } from './ReportView';
import { useApp } from '../store';
import { formatDate } from '../lib/utils';
import type { ReadinessReport } from '../types';

export function ReportModal({
  report,
  onClose,
}: {
  report: ReadinessReport;
  onClose: () => void;
}) {
  const { openModal } = useApp();

  return (
    <Modal onClose={onClose} label="Readiness report" size="wide">
      <div className="modal__glow" aria-hidden="true" />
      <div className="modal__head">
        <span className="eyebrow" style={{ marginBottom: 12 }}>
          Readiness report
        </span>
        <h2 className="modal__title">Your Readiness Report</h2>
        <p className="modal__sub" style={{ marginTop: 8 }}>
          {report.normalisedUrl} · Generated {formatDate(report.createdAt)} · Review ID{' '}
          {report.id.slice(0, 10).toUpperCase()}
        </p>
      </div>
      <div className="modal__body">
        <ReportView report={report} />
      </div>
      <div className="modal__foot">
        <button
          className="btn btn--glass btn--sm"
          onClick={() => {
            const text = [
              `Readiness report — ${report.normalisedUrl}`,
              `Overall: ${report.overall}%`,
              `Current stage: ${report.currentStage.label}`,
              '',
              ...report.stages.map(
                (s) => `Stage ${s.stage} ${s.title}: ${s.score ?? '—'}% — ${s.status}`,
              ),
              '',
              'Critical issues:',
              ...report.criticalIssues.map((i) => `• ${i}`),
              '',
              `Conclusion: ${report.conclusion}`,
              '',
              `Recommended: ${report.recommendation.tier} package`,
            ].join('\n');
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `readiness-report-${report.normalisedUrl.replace(/^https?:\/\//, '')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download size={14} />
          Download summary
        </button>
        <button
          className="btn btn--primary btn--sm"
          onClick={() =>
            openModal({
              kind: 'service',
              serviceId: report.recommendation.serviceId,
              tier: report.recommendation.tier,
              apply: true,
            })
          }
        >
          <Sparkles size={14} />
          Apply for recommended package
          <ArrowRight size={14} className="arrow" />
        </button>
      </div>
    </Modal>
  );
}
