import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { POLICIES } from '../data/policies';
import { SITE } from '../config';
import { useApp } from '../store';
import { formatDate } from '../lib/utils';

export function PolicyModal({ policy, onClose }: { policy: string; onClose: () => void }) {
  const { openModal } = useApp();
  const doc = POLICIES[policy] ?? POLICIES['Terms of Service'];

  return (
    <Modal onClose={onClose} label={doc.title} size="mid" light>
      <div className="modal__head">
        <span className="eyebrow" style={{ marginBottom: 14 }}>
          Legal
        </span>
        <h2 className="modal__title">{doc.title}</h2>
        <p className="modal__sub" style={{ marginTop: 12 }}>
          {doc.intro}
        </p>
        <p className="policy__updated">Last updated {formatDate(new Date(doc.updated).toISOString())}</p>
      </div>

      <div className="modal__body">
        <div className="policy">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h3>{s.heading}</h3>
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.list && (
                <ul>
                  {s.list.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="policy__notice">
            <ShieldCheck size={15} />
            <span>
              These policies should be reviewed by a qualified legal professional before
              launch. Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </span>
          </div>
        </div>
      </div>

      <div className="modal__foot">
        <span className="muted" style={{ fontSize: 11.5 }}>
          {SITE.legalName}
        </span>
        <button
          className="btn btn--outline btn--sm"
          onClick={() => openModal({ kind: 'assessment' })}
        >
          Assess my store
          <ArrowRight size={14} className="arrow" />
        </button>
      </div>
    </Modal>
  );
}
