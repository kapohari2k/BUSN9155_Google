# Google Tag Manager & Custom Event Integration (`GTM-5LJQ3KBV`)

This update embeds the requested Google Tag Manager script (`GTM-5LJQ3KBV`) and `dataLayer` / `gtag` bootstrap directly in the `<head>` of all five static website pages, and activates immediate custom event tracking (`enquiry_cta_click`, `sample_or_guide_select`, `form_start`, `generate_lead`, and `form_submission_error`) while preserving strict PII sanitisation and event deduplication.

## User Review & Critical Decisions

> [!IMPORTANT]
> The decisions below reflect your confirmed choices from our clarification step and govern how the tag and custom events will operate across the site.

- **Confirmed Decision 1 — Static `<head>` Tag Placement**: The exact `<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-5LJQ3KBV"></script>` and `window.dataLayer` / `gtag` snippet will be placed directly inside the `<head>` of all five static pages (*Home*, *About*, *The audit*, *Coverage checklist*, and *Enquire*) so tag verification tools (such as Google Tag Assistant) detect it immediately on initial HTML parse.
- **Confirmed Decision 2 — Active Custom Event Dispatch with `GTM-5LJQ3KBV`**: The analytics manager will recognise both `GTM-XXXX` container IDs and `G-XXXX` Measurement IDs, defaulting to `GTM-5LJQ3KBV` so all custom interactions are pushed to `window.dataLayer` and `gtag` immediately without requiring a separate environment variable override.

---

## 1. Overview & Core Concept

- **What It Does**: Loads the `GTM-5LJQ3KBV` container and initialises `window.dataLayer` and `window.gtag` across every page of the Local Lift consultancy site, ensuring both standard Tag Manager container triggers and custom user-journey events are recorded immediately.
- **Target Audience / Persona**: Supports BUSN9155 Part B assessment verification (Tag Assistant, DebugView, and Realtime inspection) while measuring how prospective Perth cleaning business owners navigate from informational guides and sample audit findings to the enquiry form.
- **Key Value**: Combines immediate static-HTML tag discoverability in the `<head>` with privacy-safe, deduplicated event tracking across all five pages.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Page Arrival & Navigation**: When a visitor opens any of the five pages, the `<head>` script initialises `window.dataLayer` and loads `GTM-5LJQ3KBV` asynchronously without blocking first paint, followed by a single deduplicated `page_view` event with query parameters stripped.
  2. **Sample & Checklist Exploration**: Filtering the ungated sample findings, copying proposed replacement wording, ticking self-check steps, or opening the official Google Business Profile help link records a `sample_or_guide_select` event.
  3. **Enquiry Funnel**: Clicking any enquiry call-to-action records `enquiry_cta_click` with its placement label; focusing or typing in the enquiry form fires `form_start` once per page load; validation or service errors record safe `form_submission_error` categories; confirmed HTTP 2xx submissions fire `generate_lead`.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Retains the existing authoritative editorial consultancy design with zero telemetry banners or debug clutter visible to customers.
  - *Color Palette & Mood*: Preserves the 60-30-10 high-contrast light palette (`#F8FAFC` / `#FFFFFF` neutral canvas, `#0F172A` slate typography, `#0369A1` cobalt primary accents).
  - *Typography & Hierarchy*: Keeps `Plus Jakarta Sans` display headings, `Public Sans` body copy, and `JetBrains Mono` tabular codes.
  - *Component Styling & Layout*: Zero visual layout changes or layout shift (`CLS = 0`) from the asynchronous `<head>` tag injection.
- **Interactive Feedback & Motion**: Analytics dispatch executes synchronously in memory (`< 1ms`) on click, focus, and submit handlers so interactive buttons, filters, and form states respond instantaneously.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Support for `GTM-` Container IDs and `G-` Measurement IDs**
  - *Chosen Approach*: Update the ID validation and analytics initialisation logic to accept `GTM-5LJQ3KBV` as the active default identifier (while still allowing override via `VITE_GA4_MEASUREMENT_ID`), and push structured event objects to `window.dataLayer` alongside `window.gtag('event', ...)` calls.
  - *Why*: Because the provided tag uses `gtm.js?id=GTM-5LJQ3KBV` paired with `function gtag(){dataLayer.push(arguments);}`, pushing both standard `gtag('event', ...)` arguments and structured `{ event: eventName, ...safeParams }` entries or avoiding duplicate script injection when the `<head>` tag is already present ensures compatibility whether GTM triggers listen to `dataLayer` custom events or `gtag` commands.
  - *Alternatives Considered*: Only inserting the raw HTML snippet without updating the TypeScript analytics validator was rejected because the validator previously required a `G-` prefix and would have kept custom events dormant.
- **Decision 2: Strict Deduplication Between Static `<head>` Tag and Runtime Module**
  - *Chosen Approach*: The runtime analytics module will detect the existing `<head>` script (`GTM-5LJQ3KBV`) and reuse the global `window.dataLayer` and `window.gtag` function defined in the `<head>` rather than injecting a second script tag.
  - *Why*: Prevents duplicate network requests to `googletagmanager.com` and avoids double-counting initial page views.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                Five Static HTML Pages (<head> Tag Layer)                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ <script async src=".../gtm.js?id=GTM-5LJQ3KBV"></script>          │  │
│  │ <script>window.dataLayer = ...; function gtag(){...}</script>     │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ Initialises window.dataLayer & gtag
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Client Enhancement & Event Layer                     │
│                                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────┐  │
│  │  CTA & Nav Links     │   │ Sample & Checklist   │   │ Enquiry     │  │
│  │ [data-cta-placement] │   │ Interactive Controls │   │ Form States │  │
│  └──────────┬───────────┘   └──────────┬───────────┘   └──────┬──────┘  │
│             │                          │                      │         │
│             └──────────────────────────┼──────────────────────┘         │
│                                        ▼                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │               AnalyticsManager (Default: GTM-5LJQ3KBV)            │  │
│  │  • Validates GTM-XXXX or G-XXXX identifier                        │  │
│  │  • Deduplicates page_view (per path) and form_start (per load)    │  │
│  │  • Sanitises parameters (strips emails, URLs, free text, queries) │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ Dispatches safe event payload
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 window.gtag('event', name, safeParams)                  │
│                     & window.dataLayer Queue                            │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Active Tracking ID**: Defaults to `'GTM-5LJQ3KBV'` (overridable via `VITE_GA4_MEASUREMENT_ID` or `window.__LOCAL_LIFT_CONFIG__?.ga4MeasurementId`).
  - **Session Deduplication Sets**: `sentPageViews` (`Set<string>`) and `formStartRecorded` (`boolean`) prevent duplicate `page_view` and `form_start` events.
  - **Sanitised Event Log**: `window.__LOCAL_LIFT_ANALYTICS_LOG__` stores dispatched `{ eventName, params, timestamp }` entries for automated inspection and unit testing.
- **Interactive Component & State Mapping**:
  - **Page Load**: Calls `trackPageView` once with query-stripped `page_location`, `page_path`, and `page_title`.
  - **Enquiry CTA Links**: Clicking any `[data-cta-placement]` anchor dispatches `enquiry_cta_click` with `{ cta_placement, source_page }`.
  - **Sample Explorer & Coverage Checklist**: Clicking priority/publisher filters, copy-wording buttons, checklist checkboxes, or the official Google Help link dispatches `sample_or_guide_select` with `{ interaction_type, item_id, source_page }`.
  - **Enquiry Form Lifecycle**: First field focus/input dispatches `form_start`; client validation or endpoint error dispatches `form_submission_error` with `{ form_id: 'enquiry_form', error_category }`; confirmed HTTP 2xx submission dispatches `generate_lead` with `{ form_id: 'enquiry_form', publisher_option }`.
