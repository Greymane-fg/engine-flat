import { SITE } from '../config';

export type PolicySection = {
  heading: string;
  body: string[];
  list?: string[];
};

export type Policy = {
  title: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
};

const updated = '15 November 2026';

export const POLICIES: Record<string, Policy> = {
  'Terms of Service': {
    title: 'Terms of Service',
    updated,
    intro: `These terms govern your use of the ${SITE.legalName} platform and the services purchased through it. By submitting an assessment or an application you accept them.`,
    sections: [
      {
        heading: '1. Who we are',
        body: [
          `${SITE.legalName} operates a Shopify store readiness and growth platform. We assess stores against a published five-stage framework, sell fixed-scope service packages, and connect clients with specialists who deliver them.`,
        ],
      },
      {
        heading: '2. Assessment services',
        body: [
          'An assessment is a diagnostic instrument. It combines automated inspection of publicly observable store conditions with expert review of the information you supply.',
          'An assessment is a recommendation mechanism, not a restriction. You may purchase any service at any time, subject to expert review and suitability.',
        ],
        list: [
          'We do not claim to verify payment processing, order fulfilment, conversion performance or product viability unless sufficient evidence exists.',
          'Checks that cannot be verified are reported as "Not Validated", not as passed.',
          'Assessment scores are indicative and produced from the evidence available on the date of the report.',
        ],
      },
      {
        heading: '3. Service packages',
        body: [
          'Each package describes its deliverables, exclusions, estimated turnaround and revision allowance. Any work not expressly listed as a deliverable is excluded.',
          'Estimated turnaround times begin when we receive the information and access required to start, and pause while we await it.',
        ],
      },
      {
        heading: '4. Your responsibilities',
        body: [
          'You agree to provide accurate contact and store information, grant access where required, respond to review requests, and ensure you have authority to authorise work on the store.',
        ],
      },
      {
        heading: '5. Pricing and payment',
        body: [
          `All prices are displayed in ${SITE.currency.code} and are fixed for the package selected at the time of application. Applications are reviewed before payment is requested.`,
          'Advertising budgets are separate from service fees and are never included unless a package expressly states otherwise.',
        ],
      },
      {
        heading: '6. Limitation of liability',
        body: [
          'To the maximum extent permitted by law, our aggregate liability arising from any engagement is limited to the service fees paid for that engagement. We are not liable for indirect or consequential loss, including lost profit or lost revenue.',
        ],
      },
      {
        heading: '7. Governing law',
        body: [
          `These terms are governed by the laws of the Federal Republic of Nigeria, without prejudice to any mandatory consumer protection rights in your jurisdiction.`,
        ],
      },
    ],
  },
  'Privacy Policy': {
    title: 'Privacy Policy',
    updated,
    intro:
      'We collect only the information required to assess your store, contact you about it and deliver the service you purchase.',
    sections: [
      {
        heading: 'Information we collect',
        body: ['When you submit an assessment or application we may collect:'],
        list: [
          'Your name, email address and WhatsApp number',
          'Your Shopify store URL and business category',
          'Your stated business objective and requirements',
          'Assessment responses, scores and report data',
          'Files you choose to attach',
        ],
      },
      {
        heading: 'Why we use it',
        body: [
          'To generate and review your readiness report, to route your application to an appropriate specialist, to communicate about your application, and to keep records of the work performed.',
        ],
      },
      {
        heading: 'How it is stored',
        body: [
          'Assessment and application data is stored securely and access-limited to team members who require it. In this demonstration build, data entered is held in your own browser storage only and is never transmitted to a server.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          `You may request access to, correction of, or deletion of your personal data at any time by contacting ${SITE.email}. We respond within a reasonable period and in line with applicable data protection law.`,
        ],
      },
      {
        heading: 'Sharing',
        body: [
          'We share contact and requirement details with the specialist assigned to your engagement. We do not sell personal data.',
        ],
      },
    ],
  },
  'Refund Policy': {
    title: 'Refund and Cancellation Policy',
    updated,
    intro:
      'We want you to understand exactly when a refund is available before you pay. Payment terms, cancellation conditions, refund eligibility and commencement of work are set out below.',
    sections: [
      {
        heading: 'Before work begins',
        body: [
          'If you cancel before work has commenced, you receive a full refund of any amount paid, less any third-party costs already incurred on your instructions.',
        ],
      },
      {
        heading: 'After work begins',
        body: [
          'Service fees are charged for reserved capacity and completed work. Once delivery has started, refunds are calculated on a pro-rata basis against the deliverables completed at the date of cancellation.',
        ],
      },
      {
        heading: 'Advertising budget',
        body: [
          'The advertising budget is held for advertising, not retained as revenue. Unspent budget is returned, less platform advertising fees actually charged by the ad network, where applicable and disclosed in advance.',
        ],
      },
      {
        heading: 'Business categories excluded from refunds',
        body: [
          'Where a package results in an ineligible purchase under applicable law, statutory rights prevail. Nothing in this policy limits your statutory rights.',
        ],
      },
      {
        heading: 'How to request a refund',
        body: [
          `Email ${SITE.email} with your application reference. We acknowledge requests within two business days and confirm the outcome within ten.`,
        ],
      },
    ],
  },
  'Cookie Policy': {
    title: 'Cookie Policy',
    updated,
    intro:
      'This site uses the minimum storage needed to operate and to remember your own session data.',
    sections: [
      {
        heading: 'Essential storage',
        body: [
          'Your submitted applications, assessment reports and interface preferences are stored locally in your browser so you can return to them. This data stays on your device and can be cleared at any time.',
        ],
      },
      {
        heading: 'Analytics',
        body: [
          'Production deployments may use privacy-respecting analytics to understand aggregate usage. Where required, we request consent before setting non-essential cookies.',
        ],
      },
      {
        heading: 'Managing cookies',
        body: [
          'You can clear or block storage through your browser settings. Blocking essential storage will prevent the application from retaining your reports and applications between visits.',
        ],
      },
    ],
  },
  'Service Agreement': {
    title: 'Service Agreement',
    updated,
    intro:
      'This agreement sets out how engagements are scoped, delivered and accepted. It applies to every package purchased through the platform.',
    sections: [
      {
        heading: 'Scope',
        body: [
          'The package selected defines the scope. Deliverables, exclusions and turnaround are those shown on the package card at the time of application. Anything not listed is out of scope unless agreed in writing.',
        ],
      },
      {
        heading: 'Client responsibilities',
        body: ['Timely provision of the following is required for delivery:'],
        list: [
          'Collaborator access to the Shopify store',
          'Brand assets and product information',
          'Access to relevant ad accounts and analytics',
          'Feedback within the revision windows',
        ],
      },
      {
        heading: 'Revisions',
        body: [
          'Revision allowances are stated per package. Revisions are for refinement within the agreed direction; a change of direction constitutes new scope and is quoted separately.',
        ],
      },
      {
        heading: 'Acceptance',
        body: [
          'Deliverables are deemed accepted seven days after delivery unless you raise specific, documented objections within that period.',
        ],
      },
      {
        heading: 'Marketing outcomes',
        body: [
          'Marketing outcomes depend on product demand, pricing, competition, audience, advertising budgets, creative quality and other external conditions. No specific revenue, ROAS or ranking outcome is guaranteed.',
        ],
      },
    ],
  },
  'Assessment Disclaimer': {
    title: 'Assessment Disclaimer',
    updated,
    intro:
      'Please read this before submitting a store for assessment. It explains precisely what the assessment does and does not do.',
    sections: [
      {
        heading: 'What the assessment evaluates',
        body: [
          'An automated or manual readiness assessment evaluates observable store conditions and supplied information. It is a structured diagnostic, not an audit of your business.',
        ],
      },
      {
        heading: 'What it cannot confirm',
        body: [
          'A publicly accessible store may allow us to assess visual design, content and structure. It does not allow us to confirm that payment gateways work, that orders are fulfilled, that tracking fires correctly, or that the store converts. Those checks require authorised testing or merchant-supplied evidence, and are reported as "Not Validated" until they are performed.',
        ],
      },
      {
        heading: 'No guarantee',
        body: [
          'The assessment does not guarantee sales, profitability or advertising performance. Scores are indicative and reflect the evidence available at the time of review.',
        ],
      },
      {
        heading: 'Recommendations',
        body: [
          'Recommended services reflect the framework, not a contractual obligation. You may purchase any available service regardless of your results, subject to expert review and suitability.',
        ],
      },
    ],
  },
};

export const POLICY_TITLES = Object.keys(POLICIES);
