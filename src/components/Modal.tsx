import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDialog } from '../hooks';

type Size = 'narrow' | 'mid' | 'wide' | 'full';

export function Modal({
  children,
  onClose,
  label,
  size = 'wide',
  light,
  bare,
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  size?: Size;
  light?: boolean;
  bare?: boolean;
}) {
  const ref = useDialog(onClose, true);

  return createPortal(
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div
        ref={ref}
        className={`modal modal--${size} ${light ? 'modal--light' : ''} ${bare ? 'modal--bare' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <button className="modal__close" onClick={onClose} aria-label="Close dialog">
          <X size={17} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
