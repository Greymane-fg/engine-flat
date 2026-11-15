import type { CSSProperties, ReactNode } from 'react';
import { Check, Minus, X } from 'lucide-react';
import type { StageStatus } from '../types';

/* ------------------------------------------------------------------ */
/* Form field                                                          */
/* ------------------------------------------------------------------ */

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  autoComplete?: string;
};

export function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  error,
  hint,
  autoComplete,
}: FieldProps) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`} htmlFor={name}>
      <span className="field__label">
        {label}
        {required && <em aria-hidden="true">*</em>}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`} htmlFor={name}>
      <span className="field__label">
        {label}
        {required && <em aria-hidden="true">*</em>}
      </span>
      <div className="field__select">
        <select
          id={name}
          name={name}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="field" htmlFor={name}>
      <span className="field__label">{label}</span>
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Status badge                                                        */
/* ------------------------------------------------------------------ */

const STATUS_ICON: Record<StageStatus, ReactNode> = {
  Passed: <Check size={12} strokeWidth={3} />,
  'Needs Attention': <Minus size={12} strokeWidth={3} />,
  'Not Ready': <X size={12} strokeWidth={3} />,
  'Not Validated': <Minus size={12} strokeWidth={3} />,
  'Not Yet Eligible': <Minus size={12} strokeWidth={3} />,
};

export function StatusBadge({ status, dark }: { status: StageStatus; dark?: boolean }) {
  const slug = status.toLowerCase().replace(/\s+/g, '-');
  return (
    <span className={`status status--${slug} ${dark ? 'status--dark' : ''}`}>
      <span className="status__icon">{STATUS_ICON[status]}</span>
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Score ring                                                          */
/* ------------------------------------------------------------------ */

export function ScoreRing({
  value,
  size = 132,
  stroke = 8,
  label,
  tone = 'violet',
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: 'violet' | 'chartreuse';
}) {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const style = { '--ring-size': `${size}px`, '--ring-stroke': `${stroke}px` } as CSSProperties;

  return (
    <div className={`ring ring--${tone}`} style={style}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring__label">
        <strong>{value}%</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

export function StageNumber({ n, premium }: { n: number; premium?: boolean }) {
  return (
    <span className={`stage-num ${premium ? 'stage-num--premium' : ''}`}>
      {String(n).padStart(2, '0')}
    </span>
  );
}

export function Divider({ dark }: { dark?: boolean }) {
  return <div className={`divider ${dark ? 'divider--dark' : ''}`} aria-hidden="true" />;
}
