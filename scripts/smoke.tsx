/**
 * Headless smoke test: boots the real app in JSDOM, walks the primary flows and
 * fails loudly on any runtime error or missing critical UI.
 */
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true });
g.HTMLElement = dom.window.HTMLElement;
g.Node = dom.window.Node;
g.Element = dom.window.Element;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(performance.now()), 0);
g.cancelAnimationFrame = (id: any) => clearTimeout(id);
g.IntersectionObserver = class {
  constructor(private cb: any) {}
  observe(el: any) { this.cb([{ isIntersecting: true, target: el }]); }
  unobserve() {}
  disconnect() {}
};
g.fetch = async () => { throw new Error('CORS'); };
g.matchMedia = (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false });
dom.window.matchMedia = g.matchMedia;
Object.defineProperty(g, 'localStorage', { value: dom.window.localStorage, configurable: true });
g.IS_REACT_ACT_ENVIRONMENT = true;
const origError = console.error;
console.error = (...a: any[]) => { if (!/deprecated|fetchPriority|not wrapped in act/.test(String(a[0]))) origError(...a); };

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const { createRoot } = await import('react-dom/client');
  const React = await import('react');
  const { act } = await import('react-dom/test-utils');
  const { default: App } = await server.ssrLoadModule('/src/App.tsx');
  const { AppProvider } = await server.ssrLoadModule('/src/store.tsx');

  const root = createRoot(document.getElementById('root')!);
  await act(async () => {
    root.render(React.createElement(AppProvider, null, React.createElement(App)));
  });

  const errors: string[] = [];
  const text = () => document.body.textContent ?? '';
  const click = async (el: any) => {
    await act(async () => {
      el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
  };
  const type = async (el: any, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => {
      setter.call(el, value);
      el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
  };
  const byText = (sel: string, re: RegExp) =>
    Array.from(document.querySelectorAll(sel)).find((n) => re.test(n.textContent ?? '')) as any;
  const assert = (cond: any, msg: string) => {
    if (!cond) errors.push('✗ ' + msg);
    else console.log('✓ ' + msg);
  };

  // 1. Landing content
  assert(/Build Your Store/.test(text()), 'hero headline rendered');
  assert(/Not Every Store Is/.test(text()), 'introduction heading rendered');
  assert(/Five Stages/.test(text()), 'stage section rendered');
  assert(/Getting Your Store Ready/.test(text()), 'how it works rendered');
  assert(/Find Exactly What/.test(text()), 'services rendered');
  assert(/More Than/.test(text()), 'genius section rendered');
  assert(/Your Next Stage/.test(text()), 'final cta rendered');
  assert(document.querySelectorAll('.stage-card').length === 5, '5 stage cards');
  assert(document.querySelectorAll('.svc-row').length === 5, '5 service rows');
  assert(document.querySelectorAll('.pkg-grid').length === 0, 'no package modal open initially');

  // 2. Open service modal → packages visible
  await click(byText('.svc-row button', /View Packages/));
  assert(/Structural Foundation/.test(text()), 'service modal opened');
  assert(document.querySelectorAll('.pkg').length === 3, 'three package cards');
  assert(/\$300/.test(text()) && /\$500/.test(text()), 'package prices shown');
  assert(/To be confirmed/.test(text()), 'TBC package rendered');

  // 3. Apply → ad budget only for operational validation (check on OV)
  await click(document.querySelector('.modal__close'));
  assert(document.querySelectorAll('.pkg').length === 0, 'modal closed');

  const ovRow = Array.from(document.querySelectorAll('.svc-row')).find((r) => /Operational Validation/.test(r.textContent ?? ''))!;
  await click(ovRow.querySelector('button'));
  assert(/Advertising budget is separate/.test(text()), 'ad budget disclaimer on OV');
  const standardPkg = Array.from(document.querySelectorAll('.pkg')).find(p => /Standard/.test(p.textContent ?? ''))!;
  await click(standardPkg.querySelector('button'));
  assert(/Apply for Standard/.test(text()), 'application form opened');
  assert(document.querySelector('.adbudget') !== null, 'ad budget input present');
  assert(/\$1,000/.test(text()), 'service fee in summary');

  // live total updates when ad budget changes
  const budgetInput = document.querySelector('.adbudget__input input') as HTMLInputElement;
  await type(budgetInput, '1500');
  assert(/2,500/.test(text()), 'live total recalculates (1000 + 1500)');

  // 4. Validate required fields
  await click(byText('.summary-card button', /Submit Application/));
  assert(/Enter your full name/.test(text()), 'validation blocks empty submit');

  // 5. Fill the form and submit
  await type(document.querySelector('#a-name'), 'Ada Okafor');
  await type(document.querySelector('#a-email'), 'ada@example.com');
  await type(document.querySelector('#a-whats'), '+2348012345678');
  await type(document.querySelector('#a-store'), 'adastore.com');
  const consent = document.querySelector('.assess-consent input') as HTMLInputElement;
  await act(async () => { consent.click(); });
  await click(byText('.summary-card button', /Submit Application/));
  assert(/Your Request Has Been Received/.test(text()), 'success screen shown');
  assert(/ENG-\d{4}-\d{4}/.test(text()), 'application reference issued');
  assert(/ENG-\d{4}-0001/.test(text()), 'reference is sequential (first of the year)');
  assert(/2,500/.test(text()), 'submitted total retained');

  // 6. Policy modal
  await click(document.querySelector('.modal__close'));
  const legalBtn = byText('.footer__legal-links button', /Privacy Policy/);
  await click(legalBtn);
  assert(/Information we collect/.test(text()), 'privacy policy modal opens');

  await click(document.querySelector('.modal__close'));

  // 7. Assessment flow (fetch fails → CORS fallback path)
  await click(byText('.nav__actions button', /Assess My Store/));
  assert(/Let's Find Out How Ready/.test(text()), 'assessment modal opens');
  await type(document.querySelector('#storeUrl'), 'bad-input');
  assert(/does not look like a complete domain|valid domain/.test(text()), 'url validation message');
  await type(document.querySelector('#storeUrl'), 'glowlab.com');
  await type(document.querySelector('#fullName'), 'Ada Okafor');
  await type(document.querySelector('#email'), 'ada@example.com');
  await type(document.querySelector('#whatsapp'), '+2348012345678');
  const aConsent = document.querySelector('.assess-consent input') as HTMLInputElement;
  await act(async () => { aConsent.click(); });

  await act(async () => {
    document.querySelector('.assess-form button[type="submit"]')!
      .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
  assert(/Assessing your store/.test(text()), 'scanning state shown');
  await act(async () => { await new Promise((r) => setTimeout(r, 4200)); });
  assert(/Your Readiness Report/.test(text()), 'report generated after scan');
  assert(/Current readiness stage/.test(text()), 'current stage in report');
  assert(/Recommended next step/.test(text()), 'recommendation present');

  // expand a stage detail
  const row = document.querySelector('.report__table button.report__row') as HTMLElement;
  await click(row);
  const detailText = text();
  assert(/Cannot be verified publicly|Observed as present|Missing or insufficient|requires authorised access/.test(detailText), 'stage detail expands');

  // 8. Admin console
  await click(document.querySelector('.modal__close')!);
  await click(byText('.footer__legal-links button', /Team access/));
  assert(/Team access/.test(text()), 'admin gate shown');
  await type(document.querySelector('.admin-gate input[type="password"]'), 'engine');
  await act(async () => {
    document.querySelector('.admin-gate button[type="submit"]')!
      .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
  assert(/Applications \(/.test(text()), 'admin unlocked');
  assert(/Pipeline value/.test(text()), 'admin stats visible');

  // change a price
  await click(byText('.admin-tab', /Services & pricing/));
  await click(document.querySelectorAll('.admin-svc__head')[0] as HTMLElement);
  const priceInput = document.querySelector('.admin-pkg input[type="number"]') as HTMLInputElement;
  if (priceInput) {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(priceInput, '450');
    priceInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  }
  await click(document.querySelector('.modal__close')!);
  const priceText = (document.querySelector('.services__list')?.textContent ?? '').replace(/\s+/g,' ');
  assert(/\$450/.test(priceText), 'admin price change propagates to catalogue');

  // 9. Track application flow
  await click(byText('.footer__legal-links button', /Team access/));
  await click(document.querySelector('.modal__close')!);
  await act(async () => {
    const btn = byText('.footer__col button', /Track Application/);
    btn?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
  assert(/Track Your Application/.test(text()), 'tracking modal opens');
  assert(/Awaiting Review|Submitted|In Progress/.test(text()), 'pipeline renders');

  // 10. Genius marketing entry + advertising-separate disclosure
  await click(document.querySelector('.modal__close')!);
  await act(async () => {
    (document.querySelector('.genius__actions button') as any).dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true }),
    );
  });
  assert(/Comprehensive Growth Partnership/.test(text()), 'genius packages open');
  assert(/Advertising expenditure is separate/.test(text()), 'genius ad-spend disclaimer');
  assert(/\$25,000/.test(text()), 'premium genius price shown');
  await click(document.querySelector('.modal__close')!);

  // 11. Stage card opens the right service
  const stage3 = document.querySelectorAll('.stage-card')[2] as HTMLElement;
  await click(stage3.querySelector('button')!);
  assert(/Organic Discoverability/.test(text()), 'stage card links to its service');
  assert(document.querySelectorAll('.pkg').length === 3, 'stage service has 3 packages');
  await click(document.querySelector('.modal__close')!);

  // 12. Mobile drawer
  await click(document.querySelector('.nav__burger')!);
  assert(/Track Application/.test(text()) && /Assess My Store/.test(text()), 'drawer opens with CTA');
  await click(document.querySelector('.drawer__close')!);
  assert(!document.querySelector('.drawer'), 'drawer closes');

  // 13. Legal coverage — every policy must resolve
  for (const name of ['Terms of Service', 'Refund Policy', 'Cookie Policy', 'Service Agreement', 'Assessment Disclaimer']) {
    await click(byText('.footer__legal-links button', new RegExp(name)));
    const t = text();
    assert(!/Loading|undefined/.test(t.slice(0, 200)) && t.includes(name), `policy "${name}" resolves`);
    await act(async () => {
      document.querySelector('.modal__close')!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
  }

  if (errors.length) {
    console.error('\n' + errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('\nAll smoke assertions passed.');
  }
} catch (err) {
  console.error('SMOKE FAILURE:', err);
  process.exitCode = 1;
} finally {
  await server.close();
}
