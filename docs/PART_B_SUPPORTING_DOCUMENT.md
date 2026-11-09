# BUSN9155 Part B Supporting Document: Local Lift Website, Analytics & Critical AI Use

> **Note for submission**: This document is stored in `docs/PART_B_SUPPORTING_DOCUMENT.md` so that it is excluded from the public `dist/` website bundle while providing the complete technical explanation, GA4 measurement plan, rubric mapping, test evidence, and critical AI development record for your Word document submission.

---

## 1. Website Strategy, Audience Integration & Search Implementation

### 1.1 Service Positioning & Value Proposition
Local Lift is a proposed consultancy offering a **Website and enquiry clarity review for Perth cleaners**. Rather than acting as a general digital agency or promising unverified search rankings or conversion rates, Local Lift solves a concrete operational problem for established, owner-managed residential cleaning businesses in Perth:
- Over time, an owner-manager adjusts how the business operates (for example, narrowing preferred suburbs to reduce unpaid travel time, refining standard regular-clean inclusions versus periodic extras, or requiring specific property details before quoting).
- Public touchpoints (website pages, Google Business Profile service areas, and quote request forms) frequently lag behind those operational changes.
- Local Lift compares agreed website pages, relevant Google Business Profile information, and enquiry prompts against owner-confirmed operating details, delivering **prioritised findings with reasons, ready-to-use replacement wording, placement instructions, publishing responsibilities (owner vs web contact), and a review call**.

### 1.2 Addressing Planning Persona Considerations (Alex Morgan)
Our synthetic planning persona from Part A (Alex Morgan, a fictional 42-year-old Perth owner-manager providing recurring home cleaning who recently narrowed preferred suburbs and relies on a web contact for website edits) raised five practical concerns. These were treated as design considerations across all five pages without presenting Alex as a real customer or restricting the offer solely to recurring cleaning:

| Design Consideration from Persona Simulation | How the Website Implementation Addresses It |
| :--- | :--- |
| **1. Whether an external review adds value beyond a simple update** | The *Home*, *About*, and *Coverage checklist* pages explicitly state when Local Lift is **not** needed (e.g., when an owner already knows a single sentence or suburb edit and can do it themselves or email their web provider directly). |
| **2. Seeing a concrete sample before enquiring** | *The audit* (`the-audit.html#sample-audit`) embeds a complete, ungated 4-item sample review with interactive priority and publisher filters, showing exact findings, reasons, replacement wording (`"Tell us your suburb, clean type and property size."`), placement notes, and an already-clear item marked to remain unchanged. |
| **3. The review fee plus separate publishing costs** | *About* and *The audit* clearly explain that scope, review fee, and timing are agreed in writing before paid work starts, that web contact publishing fees may be separate, and that already-clear items are flagged as `"Keep unchanged"` to avoid unnecessary editing bills. |
| **4. Understanding and correcting recommendations** | *About* and *The audit* include a 4-stage responsibility table and process walkthrough showing that the owner confirms operating details first and reviews/adjusts all wording during the included review call before anything is published. |
| **5. What submitting an enquiry commits the owner to** | *Enquire* (`enquire.html`) states above the submit button and in the sidebar that submitting an enquiry creates **no payment or contract commitment**, requires **no passwords or account logins**, and is used solely to inspect public pages and propose an agreed scope. |

### 1.3 Search Implementation Strategy & Keyword Hypotheses
All search terms are treated as **relevance-based targeting hypotheses** rather than validated search volume claims, and are naturally qualified so the site never misleads visitors looking for domestic house cleaners or full-service technical SEO:

| Page & URL (`https://kapohari2k.github.io/BUSN9155_Google/...`) | Target Keyword Hypothesis | Unique `<title>` | Unique `<meta name="description">` | Main `<h1>` Heading |
| :--- | :--- | :--- | :--- | :--- |
| **Home** (`/`) | Primary: `cleaning business website audit Perth` | `Cleaning Business Website Audit Perth \| Local Lift` | `Website and enquiry clarity review for established Perth residential cleaning businesses. Receive prioritised findings and ready-to-publish wording.` | `Website and enquiry clarity review for Perth residential cleaning businesses` |
| **About** (`/about.html`) | Qualified secondary: `website content audit Perth`, `website copywriting Perth` | `About Our Website Content Review Approach \| Local Lift Perth` | `Learn how Local Lift compares your cleaning business website, Google Business Profile and enquiry steps against your confirmed operating details.` | `A structured method for reviewing cleaning business websites and enquiry steps` |
| **The audit** (`/the-audit.html`) | Primary + service offer: `cleaning business website audit Perth` | `Website and enquiry clarity review for Perth cleaners \| Local Lift` | `Scope, deliverables, exclusions and an ungated sample for our website content audit and replacement wording service for Perth cleaning businesses.` | `Website and enquiry clarity review for Perth cleaners` |
| **Coverage checklist** (`/coverage-checklist.html`) | Informational: `Google Business Profile service area`, `change Google Business Profile service area` | `Google Business Profile Service Area & Website Checklist \| Local Lift` | `Free self-check guide for Perth cleaners to align Google Business Profile service area settings, website suburb lists and quote enquiry forms.` | `How to review your cleaning service area across Google and your website` |
| **Enquire** (`/enquire.html`) | Conversion intent: enquiry & scope check | `Enquire About a Website Clarity Review \| Local Lift Perth` | `Send your cleaning business website URL and review goals to check suitability and agree on scope before any paid work begins.` | `Enquire about a website and enquiry clarity review` |

---

## 2. Google Analytics 4 (GA4) Measurement Plan & Technical Design

### 2.1 Privacy-Safe & Configurable Architecture (`src/utils/analytics.ts`)
- **Static `<head>` GTM tag & active event layer**: All five HTML pages embed `<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-5LJQ3KBV"></script>` and the `window.dataLayer` / `gtag` bootstrap directly in `<head>`. `AnalyticsManager` defaults to `GTM-5LJQ3KBV` (and supports optional override via `VITE_GA4_MEASUREMENT_ID`) so custom events are dispatched immediately while the website continues to work even if ad-blockers block external scripts.
- **Deduplication**:
  - `injectGtagScriptIfNeeded()` detects the existing `<head>` script for `GTM-5LJQ3KBV` so a duplicate `<script>` tag is never appended at runtime. When a `G-` GA4 Measurement ID is used, `gtag('config', id, { send_page_view: false, anonymize_ip: true })` disables automatic config-level pageviews so our explicit `trackPageView()` call records exactly one `page_view` per page load.
  - `trackFormStart()` uses a session/page boolean guard (`formStartRecorded`) and `{ once: true }` listeners on `#enquiry-form` so `form_start` fires at most once when a visitor begins interacting with the form.
- **Strict PII & URL Stripping (`sanitizeAnalyticsParams` & `getCleanPageLocation`)**:
  - Query strings and hashes are stripped from `page_location`.
  - Any parameter key matching `email`, `websiteUrl`, `gbpUrl`, `reviewGoals`, `message`, `name`, or `phone` is blocked, and any string value containing `@` or starting with `http://` / `https://` is automatically dropped before `gtag('event', ...)` is called.

### 2.2 Measurement Table: Events, Triggers, Parameters & Decisions Informed

| Event Name | Role / Type | Exact Technical Trigger | Safe Custom Parameters Sent | Decision Informed & Analytical Interpretation Limit |
| :--- | :--- | :--- | :--- | :--- |
| `page_view` | Standard event | Fired once per page load in `initAnalyticsTracking()` after `send_page_view: false` config | `page_path` (e.g. `/BUSN9155_Google/the-audit.html`), `page_title`, `page_location` (query-stripped) | Shows which entry pages (e.g. informational *Coverage checklist* vs commercial *The audit*) attract visits and how visitors move between pages. **Limit**: A page view does not prove the visitor read or agreed with the content. |
| `enquiry_cta_click` | Custom event | Click on any `<a data-cta-placement="...">` leading to `enquire.html` | `cta_placement` (`header_primary`, `home_bottom_banner`, `about_bottom_cta`, `audit_scope_cta`, `audit_sample_cta`, `checklist_optional_cta`, `footer_enquire`), `source_page` | Indicates which page sections prompt visitors to inspect the enquiry form (e.g., whether visitors click after viewing the sample review vs from the top header). **Limit**: Clicking a CTA is navigation intent, not a completed enquiry. |
| `sample_or_guide_select` | Custom event | Actual user interaction with sample links, sample priority/publisher filter buttons, copy-wording buttons, checklist step checkboxes, or the official Google Help link | `interaction_type` (`home_sample_jump`, `home_checklist_jump`, `sample_filter_change`, `sample_copy_wording`, `checklist_item_toggle`, `checklist_reset`, `official_gbp_guide_click`), `item_id`, `source_page` | Helps evaluate whether visitors actively engage with the ungated sample findings or use the self-check coverage steps independently. **Limit**: Clicking a filter or checkbox indicates interaction with the tool, not thorough comprehension or offline implementation. |
| `form_start` | Recommended event | First `focusin` or `input` event on any field inside `#enquiry-form` (deduplicated to once per load) | `form_id: 'enquiry_form'`, `source_page: 'enquire'` | Measures how many visitors on the *Enquire* page begin filling out the form versus leaving immediately, helping identify friction between viewing the form and starting it. |
| `generate_lead` | **Recommended Key Event** | Fired **only** when `submitEnquiryPayload()` receives an HTTP 2xx (`response.ok === true`) confirmation from the configured form endpoint | `form_id: 'enquiry_form'`, `publisher_option` (`me`, `web_contact`, `needs_confirmation`, or `unspecified`) | Measures confirmed initial enquiry submissions and shows the mix of owner-publishers vs web-contact publishers. **Limit**: `generate_lead` represents an unquoted, no-commitment enquiry, **not** a paying customer or accepted scope. |
| `form_submission_error` | Custom diagnostic event | Fired when form submission is blocked by client validation or fails due to missing endpoint / network / HTTP error | `form_id: 'enquiry_form'`, `error_category` (`validation_error`, `endpoint_not_configured`, `network_error`, `service_rejected`, `rate_limited`) | Alerts the site owner if form validation rules are causing repeated user mistakes or if the external form service experiences downtime. Never records what the user typed. |

### 2.3 GA4 Property Setup & Live Verification Procedure (To Complete After Publishing)
1. **Create GA4 Property & Web Stream**:
   - In Google Analytics, go to **Admin → Create → Property** (`Local Lift - BUSN9155`).
   - Choose **Web** platform and enter Website URL `https://kapohari2k.github.io` (or full path `https://kapohari2k.github.io/BUSN9155_Google/`) and Stream name `Local Lift GitHub Pages`.
2. **Configure Enhanced Measurement to Prevent Duplication**:
   - In the Web Stream settings under **Enhanced measurement**, click the gear icon:
   - Leave **Page views** ON (our code passes `send_page_view: false` in `gtag('config', ...)` so only our single clean `page_view` fires).
   - Turn **Form interactions** **OFF** so GA4 does not auto-fire duplicate `form_start` events or unvalidated `form_submit` events.
3. **Supply Measurement ID & Redeploy**:
   - Add `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX` to the GitHub Actions workflow environment or repository variables and run the deployment workflow.
4. **Verify Collection on the Published Website (Evidence for Report)**:
   - Open **Google Tag Assistant** (`https://tagassistant.google.com/`), connect to `https://kapohari2k.github.io/BUSN9155_Google/`, and step through:
     1. Visiting Home (`page_view`)
     2. Navigating to *The audit* and filtering the sample (`sample_or_guide_select`)
     3. Visiting *Coverage checklist* and ticking a step (`sample_or_guide_select`)
     4. Clicking *Enquire* (`enquiry_cta_click`), focusing a field (`form_start`), and testing a validation error (`form_submission_error`) or confirmed submission (`generate_lead`).
   - Capture screenshots of **Tag Assistant**, **GA4 Admin → DebugView**, and **Reports → Realtime** showing the events arriving with safe parameters and zero PII. *(Not yet performed in this local draft; must be completed once the student creates the GA4 property and publishes to GitHub Pages.)*

---

## 3. Mapping to BUSN9155 Part B Excellent Rubric Criteria (5 × 8 Marks)

| Rubric Criterion (8 Marks Each) | How the Implementation & Documentation Support the Excellent Standard |
| :--- | :--- |
| **1. Technical Implementation** | Static multi-page Vite configuration (`vite.config.ts`) compiling all 5 HTML entry points into `dist/` with `base: process.env.VITE_BASE_PATH ?? (command === 'build' ? '/BUSN9155_Google/' : '/')` and `build.assetsInlineLimit: 0`. Local SVG diagrams and favicon are imported via ES modules in `src/main.tsx` and emitted into `dist/assets/`. Includes `.github/workflows/deploy.yml` using Node 22 LTS, `npm install --legacy-peer-deps`, and official GitHub Pages deployment actions. Unit-tested with `node:test`. |
| **2. Professional UX & Accessibility** | Cohesive consultancy aesthetic (`Plus Jakarta Sans` + `Public Sans`, high-contrast slate/cobalt palette). Implements skip link, semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), logical heading hierarchy (single `<h1>` per page), keyboard focus rings (`:focus-visible`), `prefers-reduced-motion` support, responsive mobile menu with `Escape` key handling, ungated interactive sample explorer, persistent self-check coverage checklist, and accessible form validation (`aria-invalid`, `aria-describedby`, `role="alert"`, retry without losing answers). |
| **3. Persuasive Content & Search Implementation** | Written entirely in Australian English with zero em dashes (`—`). Clearly defines the offer, owner confirmation role, web contact handoff, and exclusions without invented testimonials, prices, rankings, or guarantees. Integrates primary, secondary, and informational keyword hypotheses naturally across unique `<title>`, `<meta name="description">`, `<h1>`, canonical URLs (`https://kapohari2k.github.io/BUSN9155_Google/...`), JSON-LD structured data, `sitemap.xml`, and `robots.txt`. |
| **4. Technically Sound GA4 Implementation** | Opt-in `AnalyticsManager` (`src/utils/analytics.ts`) disabled until a valid `G-` ID is provided. Prevents duplicate pageviews (`send_page_view: false`) and duplicate `form_start` events. Tracks `enquiry_cta_click`, `sample_or_guide_select`, `form_start`, `generate_lead` (confirmed HTTP 2xx only), and `form_submission_error` (safe categories only). Automated unit tests verify that emails, submitted URLs, and free-text answers are stripped before analytics dispatch. |
| **5. Critical AI-Assisted Development** | Demonstrated through modular separation of pure logic (`auditSampleData.ts`, `formValidation.ts`, `analytics.ts`) from DOM wiring (`main.tsx`), automated `node:test` assertions checking content rules (such as zero em dashes and PII stripping), production subpath verification under `/BUSN9155_Google/`, and transparent separation between mocked local tests and live external service configuration. |

---

## 4. Development Record of Important AI-Assisted Changes & Refinements

During development and verification of this first version, the following key engineering and content refinements were made:

1. **Static Multi-Page HTML vs Client-Only SPA Routing**:
   - *Initial consideration*: The starter template was a single-page React app (`index.html` with an empty `<div id="root"></div>`).
   - *Refinement & reason*: A client-only SPA either relies on history rewrites (which break on GitHub Pages refresh without hacks) or serves an empty DOM shell before JS runs. We re-architected the project into five static HTML entry points (`index.html`, `about.html`, `the-audit.html`, `coverage-checklist.html`, `enquire.html`) in `vite.config.ts` so every page contains full semantic HTML, unique metadata, and canonical tags in `dist/*.html`, enhanced by shared TypeScript (`src/main.tsx`).
2. **Eliminating Em Dashes & Enforcing Australian English via Automated Tests**:
   - *Defect caught*: Two labels in the initial `src/data/auditSampleData.ts` draft contained em dashes (`Booking Enquiry Page — Access & Rescheduling Note` and `Clear — keep unchanged`).
   - *Refinement & reason*: Replaced both with colons/parentheses and added an automated assertion in `src/utils/siteLogic.test.ts` that scans all data structures and all five HTML files to guarantee zero em dashes (`—` or `&mdash;`) anywhere in customer-facing copy.
3. **Removing Static Pill Enclosures in Sample Cards**:
   - *Defect caught*: Initial card markup in `renderSampleFindingCard` wrapped the priority status in a bordered badge (`px-2.5 py-1 rounded border`).
   - *Refinement & reason*: Replaced with clean unboxed typographic metadata separated by middle dots (`·`) to maintain editorial restraint while keeping interactive filter buttons clearly styled as buttons.
4. **Preventing False Form Success & Preserving User Input on Retry**:
   - *Refinement & reason*: `submitEnquiryPayload()` in `src/utils/formValidation.ts` was designed so that an empty `VITE_FORM_ENDPOINT` returns `ok: false` with `errorCategory: 'endpoint_not_configured'` rather than faking a successful submission. All user inputs remain populated in the form fields and a `"Retry submission"` button is rendered so the user never loses their typed answers.
5. **GA4 Privacy Sanitiser & Query-String Stripping**:
   - *Refinement & reason*: Added `sanitizeAnalyticsParams()` and `getCleanPageLocation()` in `src/utils/analytics.ts` to guarantee that even if a future developer accidentally passes form fields or query strings into an analytics call, any key or value containing an email (`@`), URL (`https://`), or free-text field is stripped before reaching `window.gtag`.
