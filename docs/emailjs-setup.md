# Email routing — EmailJS setup

Every submission fires **exactly two emails** through **two templates**. The same pair
covers both readiness assessments and package applications; the templates branch on the
variables they receive, so you never maintain more than two.

```
Merchant submits (assessment or package)
        │
        ├──► Template 1 — "admin"  →  YOUR inbox. Full detail, reply-to the merchant.
        └──► Template 2 — "user"   →  THE MERCHANT. Confirmation + reference number.
```

Both are sent in parallel. If one fails, the other still goes — the merchant's
confirmation failing must never stop you from hearing about a sale.

---

## 1. Create the service

1. Sign up at <https://dashboard.emailjs.com>.
2. **Email Services → Add New Service** (Gmail, Outlook, or custom SMTP).
3. Copy the **Service ID** (`service_xxxxxxx`).

## 2. Create Template 1 — to yourself

**Email Templates → Create New Template**

- **To email:** your own address, e.g. `readiness@yourdomain.com`
- **Reply-To:** `{{reply_to}}` ← so hitting reply answers the merchant
- **Subject:** `New {{submission_type}} — {{reference}} — {{store_url}}`

Body:

```html
<h2>{{submission_type}}</h2>
<p><strong>Reference:</strong> {{reference}}<br>
<strong>Submitted:</strong> {{submitted_at}}</p>

<h3>Merchant</h3>
<p>
  {{customer_name}}<br>
  {{customer_email}}<br>
  {{customer_whatsapp}}<br>
  Store: {{store_url}}<br>
  Category: {{business_category}}<br>
  Objective: {{objective}}
</p>

<h3>Commercial</h3>
<p>
  Service: {{service}}<br>
  Package: {{package_name}}<br>
  Service fee: {{service_fee}}<br>
  Advertising budget: {{advertising_budget}}<br>
  Total: {{total_payment}}
</p>
{{#if ad_budget_line}}<p><em>{{ad_budget_line}}</em></p>{{/if}}

<h3>Requirements</h3>
<p>{{requirements}}</p>
<p>{{additional_info}}</p>
<p>Attachments: {{attachments}}</p>

{{#if has_report}}
  <h3>Readiness report</h3>
  <pre style="font-family:monospace">{{report_summary}}</pre>
{{/if}}
```

Copy the **Template ID** (`template_xxxxxxx`).

## 3. Create Template 2 — to the merchant

- **To email:** `{{to_email}}`
- **Subject:** `We've received your {{submission_type}} — {{reference}}`

Body:

```html
<p>Hi {{customer_name}},</p>

<p>Thank you — we've received your {{submission_type}} for
<strong>{{store_url}}</strong> and passed it to our team for review.</p>

<p><strong>Your reference: {{reference}}</strong><br>
Keep this handy; quote it if you contact us.</p>

{{#if package_name}}<p>Selected package: <strong>{{package_name}}</strong><br>
Total expected payment: <strong>{{total_payment}}</strong></p>{{/if}}

{{#if ad_budget_line}}<p>{{ad_budget_line}}</p>{{/if}}

{{#if has_report}}
  <p>Your readiness score is <strong>{{readiness_score}}</strong>.<br>
  Current stage: <strong>{{current_stage}}</strong></p>
{{/if}}

<p>An appropriate specialist will review your requirements and contact you using the
details you provided — usually within one business day. No payment has been taken.</p>

<p>Questions in the meantime? Reply to this email, or reach us on WhatsApp at
{{brand_whatsapp}}.</p>

<p>— {{brand_name}}<br>{{brand_email}} · {{support_hours}}</p>
```

Copy the **Template ID** (`template_yyyyyyy`).

## 4. Get your public key

**Account → General → Public Key**. This is safe to ship in the browser bundle.
**Never** put a private key or SMTP password in a `VITE_` variable — anything prefixed
`VITE_` is baked into the public JavaScript.

## 5. Configure the app

```bash
cp .env.example .env
```

```dotenv
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxx
VITE_EMAILJS_ADMIN_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_USER_TEMPLATE_ID=template_yyyyyyy
VITE_EMAILJS_ADMIN_EMAIL=you@yourdomain.com
```

Restart the dev server (Vite only reads `.env` at boot).

## 6. Verify

1. Open **Team access** (footer) → passcode `engine` → **Settings**.
2. The **Email routing** panel shows which IDs were picked up. If any are missing it
   lists the exact variables.
3. Click **Send test email**. It fires both templates with sample data and reports the
   result. Check both inboxes, including spam.

---

## Variable reference

Both templates read from one flat variable set. Use whatever you need; ignore the rest.

| Variable | Example | Notes |
| --- | --- | --- |
| `to_email` | `ada@store.com` | Merchant template's **To** field |
| `to_name` | `Ada Okafor` | |
| `reply_to` | `ada@store.com` | Use in your template's Reply-To |
| `admin_email` | `you@domain.com` | Your address |
| `reference` | `ENG-2026-0001` | Sequential per year |
| `submission_type` | `Service Application` | or `Store Readiness Assessment` |
| `submitted_at` | `15 Nov 2026, 14:32` | |
| `customer_name` | `Ada Okafor` | |
| `customer_email` | `ada@store.com` | |
| `customer_whatsapp` | `+234 801 234 5678` | |
| `store_url` | `https://adastore.com` | |
| `business_category` | `Fashion & Apparel` | |
| `objective` | `I need more organic traffic…` | Assessment only |
| `service` | `Operational Validation` | Empty for assessments |
| `package_name` | `Standard package` | Empty for assessments |
| `service_fee` | `$1,000` | |
| `advertising_budget` | `$500` | Held separately from the fee |
| `total_payment` | `$1,500` | |
| `ad_budget_line` | `$500 allocated to advertising (held separately from the service fee)` | Ready-made sentence |
| `requirements` | free text | |
| `additional_info` | free text | |
| `attachments` | `brand.pdf (200 KB)` | **Names and sizes only** — see below |
| `has_report` | `true` or empty | Use for `{{#if has_report}}` |
| `readiness_score` | `70%` | |
| `current_stage` | `Stage 03 — Organic Discoverability` | |
| `report_summary` | multi-line block | Whole stage table + recommendation |
| `brand_name` `/` `brand_email` `/` `brand_whatsapp` `/` `support_hours` | | From `src/config.ts` |
| `year` | `2026` | For footers |

## Two things to know

**Attachments are not transmitted.** EmailJS's browser SDK sends variables, not files.
The templates receive `attachments` as a list of filenames and sizes — enough to know
something was attached and to ask for it. Real file handling needs a backend or a
storage bucket; wire that before promising merchants their uploads are delivered.

**The public key is public.** That is by design, but it means anyone can call your
service from a script. In the EmailJS dashboard enable **rate limiting** and
**reCAPTCHA** on the service, and restrict the allowed origins to your domain. Without
that, the endpoint can be used to send mail through your quota.

## Behaviour without configuration

With no `.env` values the app still works: submissions are saved locally, and the
confirmation screen tells the merchant plainly that automatic email delivery is not
active and to send their reference by WhatsApp. It never claims an email was sent when
none was.
