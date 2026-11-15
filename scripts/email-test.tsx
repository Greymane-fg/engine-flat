/**
 * Verifies the EmailJS contract without contacting the network: both templates
 * must fire, with the documented variables, and failures must degrade safely.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true });
g.localStorage = dom.window.localStorage;
g.location = dom.window.location;
g.self = dom.window;

// Deliberately NOT setting VITE_ values: this verifies the shipped defaults
// in src/lib/email.ts, i.e. what actually goes live.
const EXPECTED = {
  service: 'service_engine',
  publicKey: 'QW0apJtjNMp6E4PP9',
  admin: 'template_2awtneq', // to the team
  user: 'template_mrb3g7f',  // to the merchant
};

const calls: any[] = [];
let failMode: 'none' | 'user' | 'admin' | 'both' = 'none';

// Stub the module before importing our wrapper.
// Inject a fake transport: no network, full visibility of what would be sent.
const transport = async (config: any, templateId: string, params: any) => {
  calls.push({ serviceId: config.serviceId, templateId, params });
  const mode = failMode;
  const isAdmin = templateId === EXPECTED.admin;
  if (mode === 'both') throw new Error('Network error');
  if (mode === 'user' && !isAdmin) throw new Error('Recipient rejected');
  if (mode === 'admin' && isAdmin) throw new Error('Quota exceeded');
};

const { createServer } = await import('vite');
const server = await createServer({
  define: {
    // Simulate a real build with no .env: defaults must carry it.
    'import.meta.env.VITE_EMAILJS_SERVICE_ID': 'undefined',
    'import.meta.env.VITE_EMAILJS_PUBLIC_KEY': 'undefined',
    'import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID': 'undefined',
    'import.meta.env.VITE_EMAILJS_USER_TEMPLATE_ID': 'undefined',
    'import.meta.env.VITE_EMAILJS_ADMIN_EMAIL': 'undefined',
  },
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});


try {
  const email = await server.ssrLoadModule('/src/lib/email.ts');
  const EMAIL_CONFIG_PUBLIC_KEY = (email.EMAIL_CONFIG as { publicKey: string }).publicKey;
  const { makeApplication } = await server.ssrLoadModule('/src/store.tsx');

  const errors: string[] = [];
  const assert = (cond: any, msg: string) => {
    if (!cond) errors.push('✗ ' + msg);
    else console.log('✓ ' + msg);
  };

  console.log('\n--- configuration ---');
  assert(email.isEmailConfigured(), 'ships configured — no .env required');
  const diag = email.emailDiagnostics();
  assert(diag.configured && diag.missing.length === 0, 'diagnostics report nothing missing');
  assert(diag.serviceId === EXPECTED.service, `service id = ${EXPECTED.service}`);
  assert(diag.adminTemplateId === EXPECTED.admin, 'admin template = the TEAM one (2awtneq)');
  assert(diag.userTemplateId === EXPECTED.user, 'user template = the MERCHANT one (mrb3g7f)');
  assert(diag.warnings.length === 0, 'no template-mapping warning');
  assert(
    diag.adminTemplateId !== diag.userTemplateId,
    'the two IDs are distinct — merchant and team are not crossed',
  );

  console.log('\n--- service application ---');
  const app = makeApplication({
    type: 'service',
    serviceId: 'operational-validation',
    packageId: 'ov-standard',
    packageTier: 'Standard',
    serviceFee: 1000,
    adBudget: 500,
    total: 1500,
    contact: {
      fullName: 'Ada Okafor',
      email: 'ada@store.com',
      whatsapp: '+2348012345678',
      storeUrl: 'https://adastore.com',
      category: 'Fashion & Apparel',
      requirements: 'Need validation before scaling',
      attachments: [{ name: 'brand.pdf', size: 204800, type: 'application/pdf' }],
      consentGiven: true,
    },
  }, []);

  failMode = 'none';
  calls.length = 0;
  let state = await email.sendApplicationEmails(app, undefined, undefined, transport);
  assert(calls.length === 2, 'exactly two emails sent');
  assert(calls.some(c => c.templateId === EXPECTED.admin), 'admin template used');
  assert(calls.some(c => c.templateId === EXPECTED.user), 'user template used');
  assert(calls.every(c => c.serviceId === EXPECTED.service), 'service id applied to both');
  assert(state.complete === true, 'delivery reported complete');
  assert(state.sent.includes('admin') && state.sent.includes('user'), 'both channels recorded sent');

  const adminVars = calls.find(c => c.templateId === EXPECTED.admin).params;
  const userVars = calls.find(c => c.templateId === EXPECTED.user).params;
  assert(EMAIL_CONFIG_PUBLIC_KEY === EXPECTED.publicKey, 'public key matches the shipped key');
  assert(adminVars.reference === app.reference, 'reference passed through');
  assert(/ENG-\d{4}-\d{4}/.test(adminVars.reference), 'reference format sequential');
  assert(userVars.to_email === 'ada@store.com', 'merchant template addressed to applicant');
  assert(userVars.customer_name === 'Ada Okafor', 'customer name provided');
  assert(adminVars.service === 'Operational Validation', 'service slug humanised');
  assert(adminVars.package_name === 'Standard package', 'package label provided');
  assert(adminVars.service_fee === '$1,000', 'service fee formatted in display currency');
  assert(adminVars.advertising_budget === '$500', 'ad budget formatted separately');
  assert(adminVars.total_payment === '$1,500', 'total provided');
  assert(/held separately from the service fee/.test(adminVars.ad_budget_line), 'ad budget explained in words');
  assert(/brand\.pdf \(200 KB\)/.test(adminVars.attachments), 'attachments serialised');
  assert(adminVars.has_report === '', 'no report block for a package application');
  assert(userVars.reply_to === 'ada@store.com', 'reply-to set to merchant');

  console.log('\n--- merchant template fails ---');
  failMode = 'user';
  calls.length = 0;
  state = await email.sendApplicationEmails(app, undefined, undefined, transport);
  assert(calls.length === 2, 'both still attempted');
  assert(state.sent.includes('admin'), 'team still notified when merchant email fails');
  assert(state.failed.length === 1 && state.failed[0].channel === 'user', 'failure attributed to merchant channel');
  let summary = email.summariseDelivery(state);
  assert(summary.tone === 'partial', 'UI describes partial delivery');
  assert(/reached our team/.test(summary.message), 'message reassures but is honest');

  console.log('\n--- team template fails ---');
  failMode = 'admin';
  calls.length = 0;
  state = await email.sendApplicationEmails(app, undefined, undefined, transport);
  assert(state.failed.some(f => f.channel === 'admin'), 'admin failure recorded');
  summary = email.summariseDelivery(state);
  assert(summary.tone === 'manual', 'UI falls back to manual confirmation');
  assert(/WhatsApp|send it to us/i.test(summary.message), 'offers an alternative contact route');

  console.log('\n--- total failure ---');
  failMode = 'both';
  state = await email.sendApplicationEmails(app, undefined, undefined, transport);
  assert(state.sent.length === 0 && state.failed.length === 2, 'both failures recorded');
  assert(!state.complete, 'never claims success');

  console.log('\n--- assessment with report ---');
  const { generateReport } = await server.ssrLoadModule('/src/lib/assess.ts');
  const report = generateReport(
    { storeUrl: 'glowlab.com', fullName: 'Ada', email: 'a@b.co', whatsapp: '+23480123456', category: 'Beauty & Personal Care', objective: 'I do not know where to start' },
    { reachable: null, https: true, customDomain: true, metaDescription: false, structuredData: false, altText: false, shopifyTheme: false, socialLinks: false, approximatePages: 0, inspectionNote: 'test', inspectedAt: new Date().toISOString() },
    { id: 'rep_test' },
  );
  const assessment = makeApplication({
    type: 'assessment', serviceFee: null, total: 0, reportId: report.id,
    contact: { fullName: 'Ada', email: 'a@b.co', whatsapp: '+23480123456', storeUrl: 'https://glowlab.com', attachments: [], consentGiven: true },
  }, []);
  failMode = 'none';
  calls.length = 0;
  state = await email.sendApplicationEmails(assessment, report, undefined, transport);
  const rVars = calls.find(c => c.templateId === EXPECTED.admin).params;
  assert(rVars.has_report === 'true', 'report flag set for assessments');
  assert(rVars.readiness_score === `${report.overall}%`, 'readiness score included');
  assert(rVars.current_stage === report.currentStage.label, 'current stage included');
  assert(/Stage breakdown:/.test(rVars.report_summary), 'full stage table in report summary');
  assert(/Recommended:/.test(rVars.report_summary), 'recommendation included');
  assert(state.complete, 'assessment emails deliver');
  assert(rVars.submission_type === 'Store Readiness Assessment', 'assessment labelled distinctly');

  console.log('\n--- identical template guard ---');
  const crossed = email.emailDiagnostics({
    serviceId: 's', publicKey: 'p',
    adminTemplateId: 'template_same', userTemplateId: 'template_same',
    adminEmail: 'x@y.z',
  });
  assert(crossed.warnings.length === 1, 'identical IDs raise a warning');
  assert(/identical/i.test(crossed.warnings[0]), 'warning explains the risk');

  console.log('\n--- unconfigured fallback ---');
  const bare = { serviceId: '', publicKey: '', adminTemplateId: '', userTemplateId: '', adminEmail: 'x@y.z' };
  assert(!email.isEmailConfigured(bare), 'incomplete config detected');
  calls.length = 0;
  state = await email.sendApplicationEmails(app, undefined, bare, transport);
  assert(calls.length === 0, 'no network attempted when unconfigured');
  assert(state.skipped.length === 2, 'both channels marked skipped');
  summary = email.summariseDelivery(state);
  assert(/saved/.test(summary.message) && !/sent to our team/i.test(summary.message), 'copy does not claim an email was sent');

  if (errors.length) { console.error('\n' + errors.join('\n')); process.exitCode = 1; }
  else console.log('\nAll email assertions passed.');
} finally {
  await server.close();
}
