/**
 * Guards the two EmailJS templates against the failure that broke real sends.
 *
 * The shipped templates used Handlebars' {{#if x}} ... {{/if}} form, which
 * EmailJS does not understand. The send surfaced as a template error and the
 * merchant saw a dead form. This checks the syntax EmailJS actually uses:
 *
 *   {{#variable}} ... {{/variable}}   render if truthy
 *   {{^variable}} ... {{/variable}}   render if falsy
 *
 * Run with: npx vite-node scripts/check-templates.ts
 */
import { readFileSync, readdirSync } from 'node:fs';

const DIR = 'docs/emailjs';
const files = readdirSync(DIR).filter((f) => f.endsWith('.html'));
const errors: string[] = [];
const check = (cond: boolean, msg: string) => {
  if (cond) console.log('✓ ' + msg);
  else errors.push('✗ ' + msg);
};

check(files.length === 2, `two templates found (${files.join(', ')})`);

/** Strip documentation comments so prose about a syntax is not mistaken for it. */
const stripComments = (src: string) => src.replace(/<!--[\s\S]*?-->/g, '');

for (const file of files) {
  const html = stripComments(readFileSync(`${DIR}/${file}`, 'utf8'));
  console.log(`\n--- ${file} ---`);

  // 1. No Handlebars-only syntax anywhere.
  check(!/\{\{#if\b/.test(html), 'no {{#if}} (unsupported by EmailJS)');
  check(!/\{\{\/if\}\}/.test(html), 'no {{/if}} (unsupported by EmailJS)');
  check(!/\{\{#each\b/.test(html), 'no {{#each}} loops');
  check(!/\{\{else\}\}/.test(html), 'no {{else}} branches');

  // 2. Every control block is opened and closed with the same name.
  const opens = [...html.matchAll(/\{\{#([a-z_][a-z0-9_]*)\}\}/g)].map((m) => m[1]);
  const closes = [...html.matchAll(/\{\{\/([a-z_][a-z0-9_]*)\}\}/g)].map((m) => m[1]);
  check(
    opens.length === closes.length,
    `control blocks balanced (${opens.length} open, ${closes.length} close)`,
  );
  const stack: string[] = [];
  let wellFormed = true;
  for (const m of html.matchAll(/\{\{([#/])([a-z_][a-z0-9_]*)\}\}/g)) {
    if (m[1] === '#') stack.push(m[2]);
    else if (stack.pop() !== m[2]) wellFormed = false;
  }
  check(wellFormed && stack.length === 0, 'control blocks nest correctly');

  // 3. Every plain variable is one EmailJS can resolve.
  const plain = [...html.matchAll(/\{\{([a-z_][a-z0-9_]*)\}\}/g)].map((m) => m[1]);
  const unique = [...new Set(plain)];
  check(unique.length > 0, `uses ${unique.length} variables`);

  // 4. No full HTML document markup; EmailJS wraps the body itself.
  check(!/<html[\s>]/i.test(html), 'no <html> element');
  check(!/<body[\s>]/i.test(html), 'no <body> element');
  check(!/<script/i.test(html), 'no <script>');

  // 5. Colour tokens must be the current palette.
  const purples = [...html.matchAll(/#(6741C8|17131F|B9A5ED|D9F36A|302044|9275D8)\b/gi)];
  check(purples.length === 0, 'no leftover violet/chartreuse colours');

  // 6. Contact and routing safety.
  if (file.includes('merchant')) {
    // The To field lives in the template's Settings, not its body, so this is
    // documented in the header comment rather than as a body variable.
    const raw = readFileSync(`${DIR}/${file}`, 'utf8');
    check(
      /To email:\s*\{\{to_email\}\}/.test(raw),
      'merchant template documents {{to_email}} as its To field',
    );
  }
  check(!/\{\{attachments?\}\}/i.test(html), 'no attachment variable (EmailJS cannot carry files)');
}

// The app and the templates must agree on the variable names.
const emailSrc = readFileSync('src/lib/email.ts', 'utf8');
const contract = emailSrc.slice(emailSrc.indexOf('export const TEMPLATE_VARIABLES'));
const declared = new Set(
  [...contract.matchAll(/'([a-z_][a-z0-9_]*)'/g)].map((m) => m[1]),
);

console.log('\n--- contract ---');
for (const file of files) {
  const html = stripComments(readFileSync(`${DIR}/${file}`, 'utf8'));
  const used = [...new Set([...html.matchAll(/\{\{[#/]?([a-z_][a-z0-9_]*)\}\}/g)].map((m) => m[1]))];
  const missing = used.filter((v) => !declared.has(v));
  check(
    missing.length === 0,
    missing.length
      ? `${file} uses undeclared variables: ${missing.join(', ')}`
      : `${file} only uses declared variables`,
  );
}

if (errors.length) {
  console.error('\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nAll template assertions passed.');
