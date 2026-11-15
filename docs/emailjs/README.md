# EmailJS templates — copy-paste ready

Two templates. Both fire on every submission. Paste the HTML from the linked files
straight into the EmailJS template editor.

| # | File | Template ID | Goes to | Purpose |
|---|---|---|---|---|
| 1 | [`1-team-notification.html`](1-team-notification.html) | `template_2awtneq` | **You** | Full detail, reply-to the merchant |
| 2 | [`2-merchant-confirmation.html`](2-merchant-confirmation.html) | `template_mrb3g7f` | **The merchant** | Confirmation + reference number |

These IDs are already compiled into the app as defaults, so there is nothing to
configure — just paste the HTML and save.

---

## Template 1 — settings

| Field | Value |
|---|---|
| **To email** | your own address, e.g. `readiness@engine.studio` |
| **Reply-To** | `{{reply_to}}` |
| **Subject** | `New {{submission_type}} — {{reference}} — {{store_url}}` |
| **From name** | `{{brand_name}}` |

## Template 2 — settings

| Field | Value |
|---|---|
| **To email** | `{{to_email}}` |
| **Reply-To** | `{{brand_email}}` |
| **Subject** | `We've received your {{submission_type}} — {{reference}}` |
| **From name** | `{{brand_name}}` |

> **The `To email` field on template 2 is the single most important setting.**
> `{{to_email}}` is the merchant's address, resolved per submission. If that field
> contains a fixed address, every confirmation goes to you and the merchant hears
> nothing — while the app still reports both emails as sent.

---

## Variables used

Both templates read one flat set. Anything below is safe to reference; unused
variables render as empty, and `{{#if}}` blocks disappear when falsy.

**Identity** — `reference` · `submission_type` · `submitted_at` · `year`

**Merchant** — `customer_name` · `customer_email` · `customer_whatsapp` · `store_url` ·
`business_category` · `objective`

**Commercial** (applications) — `service` · `package_name` · `service_fee` ·
`advertising_budget` · `total_payment` · `ad_budget_line`

**Free text** — `requirements` · `additional_info`

**Report** (assessments) — `has_report` · `readiness_score` · `current_stage` ·
`report_summary`

**Routing** — `to_email` · `to_name` · `reply_to` · `admin_email`

**Brand** — `brand_name` · `brand_email` · `brand_whatsapp` · `support_hours`

`submission_type` is either **Service Application** or **Store Readiness Assessment**.
`ad_budget_line` is a pre-written sentence such as
`"$500 allocated to advertising (held separately from the service fee)"` — use it as-is
so the fee/budget distinction stays consistent with the website.

---

## Verify

1. **Team access** in the footer → passcode `engine` → **Settings**.
2. **Email routing** shows both IDs as configured. If they were identical, a warning
   appears — that would mean one side receives the other's email.
3. Click **Send test email**. Both templates fire with sample data.
4. Check both inboxes, spam included. Confirm:
   - the team email has a working **Reply-To** pointing at the test merchant
   - the merchant email is addressed **to the merchant**, not to you

A layout that looks wrong in Gmail is usually a stripped `<style>` block. Everything
here is inline CSS for that reason — keep it that way when editing.

---

## Before going live

- **Rate limiting + reCAPTCHA** — enable both on the service in the EmailJS dashboard,
  and restrict allowed origins to your domain. The public key is visible in the page
  source by design; without these, anyone can spend your quota.
- **File uploads are not supported.** The form no longer accepts attachments. If they
  are reinstated, EmailJS's browser SDK still cannot transmit files — that needs a
  backend or storage bucket, not a template change.
- **Keep the wording honest.** Template 2 says "received", not "confirmed", because the
  specialist sets terms afterwards. If that copy changes, change the success screen in
  `src/components/ServiceModal.tsx` to match.
