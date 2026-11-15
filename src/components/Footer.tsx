import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useApp } from '../store';
import { SITE } from '../config';
import { whatsappLink } from '../lib/utils';

const LEGAL = [
  'Terms of Service',
  'Privacy Policy',
  'Refund Policy',
  'Cookie Policy',
  'Service Agreement',
  'Assessment Disclaimer',
];

export function Footer() {
  const { openModal, settings, services } = useApp();
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <div className="shell">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__wordmark">
              <span className="nav__mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 19V5h14v4.2H10.6v1.9h7v3.8h-7v1.9H19V19H5Z" fill="currentColor" />
                </svg>
              </span>
              {settings.brandName}
            </div>
            <p>{SITE.description}</p>
            <div className="footer__social">
              {SITE.social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer noopener">
                  {s.label}
                  <ArrowUpRight size={12} />
                </a>
              ))}
            </div>
          </div>

          <div className="footer__col">
            <h4>Navigate</h4>
            <a href="#how-it-works">How It Works</a>
            <a href="#stages">Readiness Stages</a>
            <a href="#services">Services</a>
            <a href="#genius">Genius Marketing</a>
            <a href="#about">About</a>
            <button onClick={() => openModal({ kind: 'track' })}>Track Application</button>
          </div>

          <div className="footer__col">
            <h4>Service Categories</h4>
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() =>
                  s.premium
                    ? openModal({ kind: 'genius' })
                    : openModal({ kind: 'service', serviceId: s.id })
                }
              >
                {s.shortTitle}
              </button>
            ))}
          </div>

          <div className="footer__col footer__col--contact">
            <h4>Contact</h4>
            <a href={`mailto:${settings.contactEmail}`}>
              <Mail size={14} />
              {settings.contactEmail}
            </a>
            <a href={`tel:${SITE.phone.replace(/\s/g, '')}`}>
              <Phone size={14} />
              {SITE.phone}
            </a>
            <a
              href={whatsappLink("Hi, I'd like to talk about my Shopify store's readiness.")}
              target="_blank"
              rel="noreferrer noopener"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
            <span className="footer__static">
              <MapPin size={14} />
              {SITE.address}
            </span>
            <span className="footer__static footer__hours">{SITE.hours}</span>
          </div>
        </div>

        <div className="footer__legal">
          <p>
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <div className="footer__legal-links">
            {LEGAL.map((l) => (
              <button key={l} onClick={() => openModal({ kind: 'policy', policy: l })}>
                {l}
              </button>
            ))}
            <button onClick={() => openModal({ kind: 'admin' })}>Team access</button>
          </div>
        </div>

        <p className="footer__disclaimer">
          All prices are displayed in {settings.currencyCode}. Advertising budgets are
          held separately from service fees and are never included unless a package
          expressly states otherwise. Assessment results and marketing outcomes are not
          guaranteed. All policies should be reviewed by a qualified legal professional
          before launch.
        </p>
      </div>
    </footer>
  );
}
