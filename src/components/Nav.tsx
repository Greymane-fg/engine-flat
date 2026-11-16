import { ArrowRight, ArrowUpRight, ChevronRight, Menu, X } from 'lucide-react';
import { useApp } from '../store';
import { useScrolled } from '../hooks';
import { SITE } from '../config';
import { useDialog } from '../hooks';

/**
 * Three anchors, not five. Everything that used to be its own section now
 * lives inside #explore as a tab, so the nav can point at the choice rather
 * than at each chapter of it.
 */
const LINKS = [
  { label: 'Start here', href: '#introduction' },
  { label: 'What we do', href: '#explore' },
  { label: 'Get started', href: '#contact' },
];

function BrandMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 19V5h14v4.2H10.6v1.9h7v3.8h-7v1.9H19V19H5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Nav() {
  const { openModal, setNavOpen, navOpen, settings } = useApp();
  const scrolled = useScrolled(40);

  return (
    <>
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__inner">
          <a
            className="nav__brand"
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="nav__mark">
              <BrandMark />
            </span>
            {settings.brandName}
          </a>

          <nav className="nav__links" aria-label="Primary">
            {LINKS.map((l) => (
              <a key={l.href} className="nav__link" href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <a className="btn btn--glass btn--sm" href="#explore">
              Explore
            </a>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => openModal({ kind: 'assessment' })}
            >
              Assess My Store
              <ArrowRight size={15} className="arrow" />
            </button>
            <button
              className="nav__burger"
              aria-label="Open menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      {navOpen && <Drawer onClose={() => setNavOpen(false)} />}
    </>
  );
}

function Drawer({ onClose }: { onClose: () => void }) {
  const { openModal, settings } = useApp();
  const ref = useDialog(onClose, true);

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu" ref={ref}>
      <div className="drawer__scrim" onClick={onClose} />
      <div className="drawer__panel">
        <div className="drawer__head">
          <span className="nav__brand">
            <span className="nav__mark">
              <BrandMark />
            </span>
            {settings.brandName}
          </span>
          <button className="drawer__close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="drawer__links" aria-label="Mobile">
          {LINKS.map((l) => (
            <a key={l.href} className="drawer__link" href={l.href} onClick={onClose}>
              {l.label}
              <ChevronRight size={17} />
            </a>
          ))}
          <button
            className="drawer__link"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => openModal({ kind: 'track' })}
          >
            Track Application
            <ChevronRight size={17} />
          </button>
        </nav>

        <div className="drawer__cta">
          <button
            className="btn btn--primary btn--block btn--lg"
            onClick={() => openModal({ kind: 'assessment' })}
          >
            Assess My Store
            <ArrowRight size={17} className="arrow" />
          </button>
          <a className="btn btn--glass btn--block" href="#explore" onClick={onClose}>
            Explore Services
            <ArrowUpRight size={16} />
          </a>
        </div>

        <div className="drawer__meta">
          <span>{settings.contactEmail}</span>
          <span>{SITE.hours}</span>
          <button
            className="link-arrow"
            style={{ color: 'var(--lavender)', fontSize: 12.5, marginTop: 6, textAlign: 'left' }}
            onClick={() => {
              onClose();
              openModal({ kind: 'admin' });
            }}
          >
            Team access
          </button>
        </div>
      </div>
    </div>
  );
}
