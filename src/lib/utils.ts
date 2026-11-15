import { SITE } from '../config';

/* ------------------------------------------------------------------ */
/* Currency                                                            */
/* ------------------------------------------------------------------ */

const nf = new Intl.NumberFormat(SITE.currency.locale, {
  maximumFractionDigits: 0,
});

/** Format a price in the platform's display currency. */
export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'To be confirmed';
  const { symbol, symbolFirst, code } = SITE.currency;
  const n = nf.format(value);
  if (symbolFirst) return `${symbol}${n}`;
  return `${code} ${n}`;
}

/** Always show a numeric amount (used in totals where TBC is not allowed). */
export function amount(value: number): string {
  return nf.format(value);
}

export function currencyCode(): string {
  return SITE.currency.code;
}

/* ------------------------------------------------------------------ */
/* URLs                                                                */
/* ------------------------------------------------------------------ */

export type ParsedStoreUrl = {
  ok: boolean;
  error?: string;
  normalised: string;
  domain: string;
  isShopifyHost: boolean;
  isCustomDomain: boolean;
};

export function parseStoreUrl(raw: string): ParsedStoreUrl {
  const empty: ParsedStoreUrl = {
    ok: false,
    error: 'Enter your store address, e.g. yourstore.com',
    normalised: '',
    domain: '',
    isShopifyHost: false,
    isCustomDomain: false,
  };
  const input = raw.trim().toLowerCase();
  if (!input) return empty;

  let candidate = input.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!candidate) return empty;
  if (!candidate.includes('.')) {
    return {
      ...empty,
      error: 'That does not look like a complete domain. Try yourstore.com',
    };
  }
  if (/\s/.test(candidate) || !/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/.test(candidate)) {
    return { ...empty, error: 'Please enter a valid domain, e.g. yourstore.com' };
  }

  const domain = candidate.split('/')[0].replace(/^www\./, '');
  const isShopifyHost = domain.endsWith('.myshopify.com');
  const reserved = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'google.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'amazon.com',
  ];
  if (reserved.includes(domain)) {
    return {
      ...empty,
      error: 'That is not a store address. Enter your Shopify store domain.',
    };
  }

  const tld = domain.split('.').pop() ?? '';
  if (tld.length < 2) {
    return { ...empty, error: 'Please enter a valid domain, e.g. yourstore.com' };
  }

  return {
    ok: true,
    normalised: `https://${domain}`,
    domain,
    isShopifyHost,
    isCustomDomain: !isShopifyHost,
  };
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-3)}`;
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG — the same domain always produces the same baseline. */
export function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function titleCase(str: string): string {
  return str.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(SITE.currency.locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(SITE.currency.locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Smoothly animate a number from 0 to `to` with requestAnimationFrame. */
export function animateNumber(
  to: number,
  onUpdate: (value: number) => void,
  duration = 1200,
): () => void {
  let raf = 0;
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    onUpdate(Math.round(to * eased));
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Lock body scroll while modals/drawers are open. */
export function setBodyLocked(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : '';
  document.body.style.paddingRight = locked ? '' : '';
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsappDigits}?text=${encodeURIComponent(message)}`;
}
