import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Full-screen cinematic hero.
 * Exactly one sentence. No eyebrow, subtitle, or secondary paragraph.
 */
export function Hero() {
  const particles = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = particles.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const count = window.innerWidth < 720 ? 26 : 54;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.className = 'hero__particle';
      dot.style.setProperty('--x', `${Math.random() * 100}%`);
      dot.style.setProperty('--y', `${40 + Math.random() * 60}%`);
      dot.style.setProperty('--s', `${1 + Math.random() * 2.4}px`);
      dot.style.setProperty('--d', `${12 + Math.random() * 16}s`);
      dot.style.setProperty('--delay', `${-Math.random() * 22}s`);
      dot.style.setProperty('--o', `${0.2 + Math.random() * 0.6}`);
      frag.appendChild(dot);
    }
    node.appendChild(frag);
    return () => {
      node.replaceChildren();
    };
  }, []);

  return (
    <section className="hero" id="top" aria-label="Introduction">
      <div className="hero__media" aria-hidden="true">
        <img
          src="/hero.jpg"
          alt=""
          {...({ fetchpriority: 'high' } as Record<string, string>)}
          decoding="async"
        />
        <div className="hero__veil" />
        <div className="hero__aurora hero__aurora--a" />
        <div className="hero__aurora hero__aurora--b" />
        <div className="hero__grid" />
        <div className="hero__particles" ref={particles} />
        <div className="grain" />
      </div>

      <div className="hero__content shell">
        <h1 className="hero__headline">
          <span>Build Your Store.</span>
          <span className="hero__headline-accent">Prepare It for Growth.</span>
        </h1>
      </div>

      <a className="hero__scroll" href="#introduction" aria-label="Scroll to introduction">
        <span className="hero__scroll-text">Explore what comes next</span>
        <span className="hero__scroll-line" aria-hidden="true">
          <span />
        </span>
        <ChevronDown size={15} className="hero__scroll-arrow" aria-hidden="true" />
      </a>
    </section>
  );
}
