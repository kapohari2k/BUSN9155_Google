# Local Lift — Website and Enquiry Clarity Review for Perth Cleaners

Static multi-page consultancy website built for **Flinders University BUSN9155 Part B**.

- **Target Repository**: `https://github.com/kapohari2k/BUSN9155_Google`
- **Target GitHub Pages URL**: `https://kapohari2k.github.io/BUSN9155_Google/`
- **Supporting Word Document Content & Measurement Plan**: See [`docs/PART_B_SUPPORTING_DOCUMENT.md`](./docs/PART_B_SUPPORTING_DOCUMENT.md) (excluded from `dist/` production build output).

---

## 1. Website Pages & Architecture

Local Lift uses a static multi-page Vite architecture (`vite.config.ts`) that outputs five directly accessible, indexable HTML pages into `dist/`:

1. **Home (`index.html`)**: Explains who the service is for (established, owner-led Perth residential cleaning businesses), what is reviewed, practical deliverables, when Local Lift is not needed, and clear paths to the sample review, free checklist, and enquiry form.
2. **About (`about.html`)**: Explains the comparison and drafting method, core principles, owner confirmation workflow, publishing handoff between owner and web contact, and an honest comparison with DIY, existing web providers, copywriters, and SEO agencies.
3. **The audit (`the-audit.html`)**: The Services page. Details suitability, agreed scope, deliverables, step-by-step process, review call, commercial terms (scope, fees, and timing agreed before paid work; web contact publishing fees separate), exclusions, and an **ungated interactive 4-item sample review** (including the quote-link guidance example `"Tell us your suburb, clean type and property size."` and an already-clear item marked to remain unchanged).
4. **Coverage checklist (`coverage-checklist.html`)**: A standalone, 5-step interactive self-check guide for aligning Google Business Profile service areas, website pages, and quote forms, including official Google Help guidance (`https://support.google.com/business/answer/9157481`) and a fictional northern-Perth scenario.
5. **Enquire (`enquire.html`)**: The Contact page. Includes suitability guidance, privacy and no-commitment explanations (no passwords needed, no obligation), and an accessible enquiry form with client-side validation, pending lock, retry preservation, and configurable static-site endpoint support.

---

## 2. Local Development & Production Subpath Preview

### Install dependencies
```bash
npm install --legacy-peer-deps
```

### Run development server (serves at `/`)
```bash
npm run dev
```

### Run unit and static HTML verification tests
```bash
npx --yes tsx --test src/utils/siteLogic.test.ts
```

### Build and preview production output under `/BUSN9155_Google/`
```bash
VITE_BASE_PATH=/BUSN9155_Google/ npm run build
npx vite preview --port 4173
```
Then open `http://localhost:4173/BUSN9155_Google/` to test direct page visits (`index.html`, `about.html`, `the-audit.html`, `coverage-checklist.html`, `enquire.html`), emitted assets in `dist/assets/`, and subpath navigation.

---

## 3. Configuration Required Before Live Launch

### A. GitHub Pages Activation
1. Push or sync this repository to `https://github.com/kapohari2k/BUSN9155_Google` on the `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` triggers automatically on `push` to `main` or manually via **Actions → Deploy static site to GitHub Pages → Run workflow**.

### B. Static Form Endpoint (`VITE_FORM_ENDPOINT`)
By default, `VITE_FORM_ENDPOINT` is empty so the site never sends enquiries to an invented or unrelated server. When unconfigured, submitting valid form inputs displays a transparent notice while preserving all user answers for retry.

To enable live form submissions (e.g. via Formspree):
1. Create a form in Formspree (or an equivalent static form receiver that accepts JSON `POST` requests).
2. Add your endpoint URL as a repository variable or secret in GitHub (`VITE_FORM_ENDPOINT=https://formspree.io/f/your_form_id`) and reference it in `.github/workflows/deploy.yml` under `env:`, or set it in `.env.local` before building.

### C. Google Analytics 4 (`VITE_GA4_MEASUREMENT_ID`)
By default, GA4 is disabled until a real Measurement ID (`G-XXXXXXXXXX`) is supplied:
1. In Google Analytics, create a GA4 Property and a **Web Data Stream** for `https://kapohari2k.github.io/BUSN9155_Google/`.
2. Copy the Measurement ID (e.g., `G-12345ABCDE`).
3. Set `VITE_GA4_MEASUREMENT_ID=G-12345ABCDE` in your build environment (`.env.local` or GitHub Actions `env:`).
4. In the GA4 Admin interface under **Data collection and modification → Data streams → Enhanced measurement**, keep **Page views** enabled (our code sets `send_page_view: false` in `gtag('config', ...)` and dispatches one clean `page_view` per page load) and **turn OFF "Form interactions"** so GA4's automatic form listener does not duplicate our custom `form_start` event or fire false `form_submit` events on failed validations.
5. Mark `generate_lead` as a **Key Event** under **Admin → Data display → Events**.
