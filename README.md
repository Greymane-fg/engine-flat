# Engine — Shopify Store Readiness & Growth Platform

A single-page application that assesses a Shopify store against a five-stage readiness
framework, recommends the right service and package, and lets merchants purchase any of
15 fixed-price packages — from foundational setup to Genius Marketing.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle
npm run typecheck
npm run smoke      # headless end-to-end flow test (JSDOM)
```

---

## What's built

**Landing experience**
- Full-screen cinematic hero with one sentence, floating glass navigation, animated
  particle field, and a minimal scroll teaser.
- Introduction with the two customer paths (assess vs. buy directly).
- Five readiness stages on a connected progression rail, with stage 05 given a
  distinctive premium treatment.
- Five-step process, service catalogue, dark immersive Genius Marketing feature,
  about section, final conversion block, and a full footer.

**Path A — assessment**
- URL validation (accepts `store.com` and `store.myshopify.com`, rejects free-mail
  domains and malformed input), plus name, email, WhatsApp, category and objective.
- Best-effort live inspection of the public storefront. Browsers enforce CORS, so most
  stores refuse the read — when that happens the report **says so explicitly** rather
  than pretending checks ran.
- Scored report: overall readiness %, current stage, per-stage scores and statuses,
  critical issues, strengths, a written conclusion, and a recommended package with an
  estimated cost.
- Requirements are split into **observed**, **missing**, and **cannot be verified
  publicly**. Unverifiable checks are never marked failed.

**Path B — direct purchase**
- Three fixed-price packages per service, each with deliverables, exclusions,
  turnaround, revision allowance and a select button.
- Application form, optional attachments, review screen and success state with a
  reference number.

**Operational Validation pricing**
- Two separate cost components, stated as such throughout: the service fee and the
  merchant-chosen advertising budget. The total recalculates live as either changes.
- The summary always shows both lines separately, never as one opaque figure.

**Admin console** (`Team access` in the footer, passcode `engine`)
- Review submissions, change application status through the 9-state pipeline, assign
  specialists, record payments, email or WhatsApp the merchant.
- Edit package names and prices — changes propagate live to the public catalogue.
- Pause an individual service or pause assessments entirely.
- Reset demo data.

**Legal & tracking**
- Six policy modals (Terms, Privacy, Refunds, Cookies, Service Agreement, Assessment
  Disclaimer), all inside the page — no navigation away.
- Application tracking with the full status pipeline.

---

## Architecture

```
src/
  config.ts              brand, currency, contact details
  types.ts               domain types
  store.tsx              React context: persistence, modals, applications, admin state
  data/
    services.ts          15 packages — the single source of truth for pricing
    readiness.ts         71 readiness checks across 5 stages (auto vs. evidence)
    policies.ts          legal copy
  lib/
    assess.ts            live inspection + deterministic scoring engine
    utils.ts             currency, URL parsing, seeded PRNG, formatting
  components/            page sections + the modal system
  styles/                design tokens and per-area stylesheets
scripts/
  smoke.tsx              headless flow test
```

### Scoring

Each stage is scored from weighted checks. Checks are either `auto` (observable on a
public storefront) or `evidence` (requires access, a test transaction, or merchant
evidence).

- A **critical** failure blocks stage completion regardless of the aggregate score —
  a strong later stage cannot mask a broken foundation.
- Evidence-dominant stages (Operational Validation) report **Not Validated** rather
  than inventing a pass.
- Stage 05 is only scored once stages 01–04 have passed; until then it is
  **Not Yet Eligible** (but still purchasable, subject to review).
- Scores are deterministic per domain, so the same store produces the same report and
  the admin can reproduce a merchant's result.

### Data & persistence

State is persisted to `localStorage` (`engine-flat:v1`). Pricing edits, applications
and settings survive reloads. In production the same context methods map to a backend;
no component reads prices from a hardcoded literal.

---

## Design system

Futuristic glassmorphism over a midnight-violet / lavender / electric-chartreuse
palette. Glass is used deliberately — navigation, hero overlay, stage cards, pricing
overlays, modals — while content sections keep visual breathing room.

- **Type:** Manrope (display) + Inter (body), self-hosted via Fontsource.
- **Dark / light alternation:** midnight, warm white and aubergine sections.
- **Motion:** restrained. Scroll reveals, soft card elevation, ambient hero drift,
  animated readiness bars. All of it respects `prefers-reduced-motion`.

## Accessibility notes

- Focus-trapped dialogs, Escape to close, restore focus on close.
- Skip link, semantic landmarks, labelled form controls and error messages tied to
  `aria-invalid`.
- Status is conveyed with text labels and icons, not colour alone.

---

## Before production

1. Replace the demo passcode with real authentication and role-based access.
2. Move applications, reports and pricing to a database behind an API; wire email
   notifications and specialist assignment.
3. Serve the assessment engine server-side (same inputs and weights) so reports cannot
   be edited client-side, and so real Storefront API / theme inspection is possible
   with merchant authorisation.
4. Review all policy copy with a qualified legal professional.
5. Replace the placeholder contact details and social links in `src/config.ts`.
