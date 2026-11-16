/**
 * Palette guard.
 *
 * Three things are easy to lose in a redesign and expensive to find later:
 *   1. A gradient creeping back in.
 *   2. A stray colour outside the five-colour system.
 *   3. Text that no longer clears WCAG AA.
 *
 * Run with: npx vite-node scripts/check-palette.ts
 */
import { readFileSync, readdirSync } from 'node:fs';

const PALETTE = {
  forest: '#102b2a',
  'forest-deep': '#0b1f1e',
  pine: '#205653',
  sage: '#a9c5bd',
  mist: '#e9ede6',
  coral: '#ff806b',
  white: '#ffffff',
} as const;

const ALLOWED_HEX = new Set([
  ...Object.values(PALETTE),
  '#e86a55', // coral, pressed/hover shade
  '#2a6b67', // pine, hover shade
  '#3a514d', // ink-soft
  '#556b66', // ink-muted
  '#c99a2e', // warning amber (status only)
  '#8a5f00', // warning amber text (status only)
  '#d9535b', // error red (status only)
  '#ff9aa1', // error red on dark (status only)
  '#f0a2a7', // danger icon
  '#8ee0b0', // success icon
  '#f0cd82', // provisional notice
  '#1c6b4a', // status: passed
  '#a8282f', // status: not ready
  '#8a6300', // status: needs attention
  '#fdf3f3', // status: error field tint
  '#000000',
  '#000',
  '#fff',
]);

const errors: string[] = [];
const check = (cond: boolean, msg: string) => {
  if (cond) console.log('✓ ' + msg);
  else errors.push('✗ ' + msg);
};

// --- 1. No gradients -------------------------------------------------------
const cssFiles = readdirSync('src/styles').filter((f) => f.endsWith('.css'));
let gradientHits = 0;
for (const f of cssFiles) {
  const src = readFileSync(`src/styles/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const hits = [...src.matchAll(/(linear|radial|conic)-gradient\(/g)];
  if (hits.length) {
    errors.push(`✗ ${f}: ${hits.length} gradient(s)`);
    gradientHits += hits.length;
  }
}
check(gradientHits === 0, `no gradients in any stylesheet (${cssFiles.length} files)`);

// --- 2. Only palette colours ----------------------------------------------
const offenders: string[] = [];
for (const f of cssFiles) {
  const src = readFileSync(`src/styles/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const hex = m[0].toLowerCase();
    if (hex.length === 4) continue; // #fff / #000 shorthand, allowed
    if (!ALLOWED_HEX.has(hex)) offenders.push(`${f}: ${hex}`);
  }
}
check(offenders.length === 0, `every hex is a palette colour${offenders.length ? ' — ' + offenders.join(', ') : ''}`);

// --- 3. Contrast ----------------------------------------------------------
const lum = (hex: string) => {
  const c = hex
    .replace('#', '')
    .match(/.{2}/g)!
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const pairs: [string, string, string, number][] = [
  ['body text on dark', PALETTE.mist, PALETTE.forest, 7],
  ['body text on light', PALETTE.forest, PALETTE.mist, 7],
  ['text on sage', PALETTE.forest, PALETTE.sage, 7],
  ['text on pine (buttons)', PALETTE.mist, PALETTE.pine, 4.5],
  ['accent on dark', PALETTE.coral, PALETTE.forest, 4.5],
  ['text on coral (badges)', '#0b1f1e', PALETTE.coral, 4.5],
  ['muted text on light', '#556b66', PALETTE.mist, 4.5],
  ['soft text on light', '#3a514d', PALETTE.mist, 4.5],
];

for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  check(r >= min, `${name}: ${r.toFixed(2)}:1 (needs ${min})`);
}

// --- 4. The brief's rule that coral never carries a large surface ----------
const base = readFileSync('src/styles/base.css', 'utf8');
check(
  !/--coral/.test(base.slice(base.indexOf('.section {'), base.indexOf('.section--flush'))),
  'coral is not used as a section background',
);

if (errors.length) {
  console.error('\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nAll palette assertions passed.');
