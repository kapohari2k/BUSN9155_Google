import './index.css';
import faviconUrl from './assets/favicon.svg';
import auditWorkflowDiagramUrl from './assets/audit-workflow-diagram.svg';
import coverageAlignmentDiagramUrl from './assets/coverage-alignment-diagram.svg';
import {
  COVERAGE_CHECKLIST_ITEMS,
  SAMPLE_AUDIT_FINDINGS,
  calculateChecklistProgress,
  filterSampleFindings,
  type PublisherRole,
  type SampleAuditFinding,
  type SamplePriority,
} from './data/auditSampleData';
import {
  AnalyticsManager,
  DEFAULT_ANALYTICS_ID,
  isValidGa4MeasurementId,
  type SafeCtaPlacement,
  type SafeSampleGuideAction,
} from './utils/analytics';
import {
  submitEnquiryPayload,
  validateEnquiryForm,
  type AllowedPublisherOption,
  type EnquiryFieldErrors,
  type EnquiryFormValues,
} from './utils/formValidation';

const CHECKLIST_STORAGE_KEY = 'local_lift_coverage_checklist_v1';

function resolveGa4MeasurementId(): string {
  if (
    typeof window !== 'undefined' &&
    window.__LOCAL_LIFT_CONFIG__?.ga4MeasurementId !== undefined
  ) {
    return window.__LOCAL_LIFT_CONFIG__.ga4MeasurementId;
  }
  const envId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  if (typeof envId === 'string' && isValidGa4MeasurementId(envId)) {
    return envId.trim();
  }
  return DEFAULT_ANALYTICS_ID;
}

function resolveFormEndpoint(formEl?: HTMLFormElement | null): string | undefined {
  if (formEl?.dataset.formEndpoint) {
    return formEl.dataset.formEndpoint;
  }
  if (typeof window !== 'undefined' && window.__LOCAL_LIFT_CONFIG__?.formEndpoint) {
    return window.__LOCAL_LIFT_CONFIG__.formEndpoint;
  }
  const envEndpoint = import.meta.env.VITE_FORM_ENDPOINT;
  return typeof envEndpoint === 'string' ? envEndpoint : undefined;
}

export const analytics = new AnalyticsManager(resolveGa4MeasurementId());

function bindImportedMediaAssets(): void {
  let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.type = 'image/svg+xml';
    document.head.appendChild(iconLink);
  }
  iconLink.href = faviconUrl;

  document
    .querySelectorAll<HTMLImageElement>('img[data-asset="audit-workflow-diagram"]')
    .forEach((img) => {
      img.src = auditWorkflowDiagramUrl;
    });

  document
    .querySelectorAll<HTMLImageElement>('img[data-asset="coverage-alignment-diagram"]')
    .forEach((img) => {
      img.src = coverageAlignmentDiagramUrl;
    });
}

function initMobileNavigation(): void {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const menuPanel = document.getElementById('mobile-menu-panel');
  if (!toggleBtn || !menuPanel) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;
    toggleBtn.setAttribute('aria-expanded', String(nextState));
    menuPanel.classList.toggle('hidden', !nextState);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
      toggleBtn.setAttribute('aria-expanded', 'false');
      menuPanel.classList.add('hidden');
      toggleBtn.focus();
    }
  });
}

function initAnalyticsTracking(): void {
  // Re-check runtime config in case tests set window.__LOCAL_LIFT_CONFIG__ before DOMContentLoaded
  analytics.configure(resolveGa4MeasurementId());
  analytics.injectGtagScriptIfNeeded();

  const currentPageId = document.body.dataset.page || 'home';
  analytics.trackPageView(
    window.location.pathname,
    document.title,
    window.location.href
  );

  // Track enquiry CTA clicks with predefined safe placement labels
  document.querySelectorAll<HTMLElement>('[data-cta-placement]').forEach((el) => {
    el.addEventListener('click', () => {
      const placement = el.dataset.ctaPlacement as SafeCtaPlacement | undefined;
      if (placement) {
        analytics.trackEnquiryCtaClick(placement, currentPageId);
      }
    });
  });

  // Track sample or guide link interactions
  document.querySelectorAll<HTMLElement>('[data-guide-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const action = el.dataset.guideAction as SafeSampleGuideAction | undefined;
      const itemId = el.dataset.guideItem || action || 'interaction';
      if (action) {
        analytics.trackSampleOrGuideSelect(action, itemId, currentPageId);
      }
    });
  });
}

function renderSampleFindingCard(item: SampleAuditFinding): string {
  const isUnchanged = item.priority === 'unchanged';
  const priorityTone =
    item.priority === 'high'
      ? 'text-sky-800'
      : item.priority === 'medium'
      ? 'text-slate-800'
      : 'text-emerald-800';

  return `
    <article class="bg-white border border-slate-200 rounded-lg p-6 transition-colors" data-finding-id="${item.id}" data-priority="${item.priority}" data-publisher="${item.publisher}">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 text-xs text-slate-600">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-mono font-semibold text-slate-900">${item.itemCode}</span>
          <span aria-hidden="true">·</span>
          <span class="font-medium text-slate-800">${item.touchpoint}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold ${priorityTone}">${item.priorityLabel}</span>
          <span aria-hidden="true">·</span>
          <span>Publisher: <strong class="text-slate-900">${item.publisherLabel}</strong></span>
        </div>
      </div>

      <h3 class="text-lg font-bold text-slate-900 mb-3">${item.findingTitle}</h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
        <div class="bg-slate-50 border border-slate-200 rounded-md p-4">
          <p class="text-xs font-semibold text-slate-700 mb-1.5">What we observed (fictional example)</p>
          <p class="text-sm text-slate-700 leading-relaxed mb-3">${item.currentObservation}</p>
          <p class="text-xs font-semibold text-slate-700 mb-1">Why this matters</p>
          <p class="text-sm text-slate-700 leading-relaxed">${item.reason}</p>
        </div>

        <div class="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <p class="text-xs font-semibold text-slate-900">${
                isUnchanged
                  ? 'Recommendation (keep existing wording)'
                  : 'Ready-to-use replacement wording (subject to owner confirmation)'
              }</p>
              ${
                !isUnchanged
                  ? `<button type="button" class="copy-wording-btn px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0" data-wording-id="${item.id}" aria-label="Copy proposed wording for ${item.itemCode}">Copy wording</button>`
                  : ''
              }
            </div>
            <blockquote class="text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded p-3.5 mb-3 leading-relaxed">
              "${item.proposedWording}"
            </blockquote>
          </div>
          <div class="space-y-1.5 text-xs text-slate-600">
            <p><strong class="text-slate-900">Placement instruction:</strong> ${item.placementInstruction}</p>
            <p><strong class="text-slate-900">Owner confirmation note:</strong> ${item.ownerConfirmationNote}</p>
          </div>
        </div>
      </div>
    </article>
  `;
}

function initSampleAuditExplorer(): void {
  const explorerRoot = document.getElementById('sample-audit-explorer');
  if (!explorerRoot) return;

  const listContainer = document.getElementById('sample-findings-list');
  const countStatus = document.getElementById('sample-findings-count');
  if (!listContainer || !countStatus) return;

  let activePriority: 'all' | SamplePriority = 'all';
  let activePublisher: 'all' | PublisherRole = 'all';

  const priorityButtons = explorerRoot.querySelectorAll<HTMLButtonElement>(
    '[data-filter-priority]'
  );
  const publisherButtons = explorerRoot.querySelectorAll<HTMLButtonElement>(
    '[data-filter-publisher]'
  );

  function updateDisplay(triggerAnalytics = false, filterChangedLabel = ''): void {
    const filtered = filterSampleFindings(
      SAMPLE_AUDIT_FINDINGS,
      activePriority,
      activePublisher
    );

    countStatus!.textContent = `Showing ${filtered.length} of ${SAMPLE_AUDIT_FINDINGS.length} illustrative audit items (all examples are fictional and subject to owner confirmation).`;

    if (filtered.length === 0) {
      listContainer!.innerHTML = `
        <div class="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <p class="text-sm font-medium text-slate-800 mb-2">No sample items match that combination of filters.</p>
          <button type="button" id="reset-sample-filters-btn" class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800">Show all 4 sample items</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-sample-filters-btn');
      resetBtn?.addEventListener('click', () => {
        activePriority = 'all';
        activePublisher = 'all';
        syncButtonStates();
        updateDisplay(true, 'reset_all');
      });
    } else {
      listContainer!.innerHTML = filtered.map(renderSampleFindingCard).join('');
      bindCopyButtons();
    }

    if (triggerAnalytics && filterChangedLabel) {
      analytics.trackSampleOrGuideSelect(
        'sample_filter_change',
        filterChangedLabel,
        'the-audit'
      );
    }
  }

  function syncButtonStates(): void {
    priorityButtons.forEach((btn) => {
      const val = btn.dataset.filterPriority as 'all' | SamplePriority;
      const isSelected = val === activePriority;
      btn.setAttribute('aria-pressed', String(isSelected));
      btn.className = isSelected
        ? 'px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white transition-colors whitespace-nowrap shrink-0'
        : 'px-3 py-1.5 text-xs font-medium rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0';
    });

    publisherButtons.forEach((btn) => {
      const val = btn.dataset.filterPublisher as 'all' | PublisherRole;
      const isSelected = val === activePublisher;
      btn.setAttribute('aria-pressed', String(isSelected));
      btn.className = isSelected
        ? 'px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white transition-colors whitespace-nowrap shrink-0'
        : 'px-3 py-1.5 text-xs font-medium rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0';
    });
  }

  function bindCopyButtons(): void {
    listContainer!
      .querySelectorAll<HTMLButtonElement>('.copy-wording-btn')
      .forEach((btn) => {
        btn.addEventListener('click', async () => {
          const itemId = btn.dataset.wordingId;
          const finding = SAMPLE_AUDIT_FINDINGS.find((f) => f.id === itemId);
          if (!finding) return;

          try {
            if (navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(finding.proposedWording);
            }
          } catch {
            // Clipboard permission optional in headless browser
          }

          btn.textContent = 'Copied to clipboard';
          analytics.trackSampleOrGuideSelect(
            'sample_copy_wording',
            finding.id,
            'the-audit'
          );
          setTimeout(() => {
            btn.textContent = 'Copy wording';
          }, 2000);
        });
      });
  }

  priorityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextPriority = (btn.dataset.filterPriority || 'all') as
        | 'all'
        | SamplePriority;
      activePriority = nextPriority;
      syncButtonStates();
      updateDisplay(true, `priority_${nextPriority}`);
    });
  });

  publisherButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextPublisher = (btn.dataset.filterPublisher || 'all') as
        | 'all'
        | PublisherRole;
      activePublisher = nextPublisher;
      syncButtonStates();
      updateDisplay(true, `publisher_${nextPublisher}`);
    });
  });

  // Bind initial static copy buttons and keep initial DOM interactive
  syncButtonStates();
  updateDisplay(false);
}

function loadSavedChecklistIds(): string[] {
  try {
    const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveChecklistIds(ids: string[]): void {
  try {
    window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}

function initCoverageChecklist(): void {
  const checklistRoot = document.getElementById('coverage-checklist-interactive');
  if (!checklistRoot) return;

  const progressText = document.getElementById('checklist-progress-text');
  const progressBar = document.getElementById('checklist-progress-bar');
  const resetBtn = document.getElementById('checklist-reset-btn');
  const checkboxes = checklistRoot.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"][data-checklist-id]'
  );

  let completedIds = new Set<string>(loadSavedChecklistIds());

  function syncChecklistUi(): void {
    checkboxes.forEach((cb) => {
      const id = cb.dataset.checklistId!;
      const isChecked = completedIds.has(id);
      cb.checked = isChecked;
      const card = cb.closest('[data-checklist-card]');
      if (card) {
        card.classList.toggle('bg-sky-50/60', isChecked);
        card.classList.toggle('border-sky-300', isChecked);
      }
    });

    const stats = calculateChecklistProgress(
      Array.from(completedIds),
      COVERAGE_CHECKLIST_ITEMS
    );
    if (progressText) {
      progressText.textContent = `${stats.completedCount} of ${stats.totalCount} steps checked (${stats.percentage}%)`;
    }
    if (progressBar) {
      progressBar.style.width = `${stats.percentage}%`;
      progressBar.setAttribute('aria-valuenow', String(stats.percentage));
    }
  }

  checkboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.checklistId!;
      if (cb.checked) {
        completedIds.add(id);
      } else {
        completedIds.delete(id);
      }
      saveChecklistIds(Array.from(completedIds));
      syncChecklistUi();
      analytics.trackSampleOrGuideSelect(
        'checklist_item_toggle',
        id,
        'coverage-checklist'
      );
    });
  });

  resetBtn?.addEventListener('click', () => {
    completedIds.clear();
    saveChecklistIds([]);
    syncChecklistUi();
    analytics.trackSampleOrGuideSelect(
      'checklist_reset',
      'reset_all_steps',
      'coverage-checklist'
    );
  });

  syncChecklistUi();
}

function initEnquiryForm(): void {
  const form = document.getElementById('enquiry-form') as HTMLFormElement | null;
  if (!form) return;

  const emailInput = document.getElementById('field-email') as HTMLInputElement;
  const websiteInput = document.getElementById('field-website-url') as HTMLInputElement;
  const reviewGoalsInput = document.getElementById('field-review-goals') as HTMLTextAreaElement;
  const gbpInput = document.getElementById('field-gbp-url') as HTMLInputElement;
  const publisherSelect = document.getElementById('field-publisher-role') as HTMLSelectElement;
  const submitBtn = document.getElementById('enquiry-submit-btn') as HTMLButtonElement;
  const statusRegion = document.getElementById('enquiry-form-status') as HTMLElement;

  let isSubmitting = false;

  const fieldMap: Record<
    keyof EnquiryFieldErrors,
    { input: HTMLElement | null; errorEl: HTMLElement | null }
  > = {
    email: {
      input: emailInput,
      errorEl: document.getElementById('error-email'),
    },
    websiteUrl: {
      input: websiteInput,
      errorEl: document.getElementById('error-website-url'),
    },
    reviewGoals: {
      input: reviewGoalsInput,
      errorEl: document.getElementById('error-review-goals'),
    },
    gbpUrl: {
      input: gbpInput,
      errorEl: document.getElementById('error-gbp-url'),
    },
    publisherRole: {
      input: publisherSelect,
      errorEl: document.getElementById('error-publisher-role'),
    },
  };

  // Record form_start on the first user interaction with any form control
  const recordStartOnce = (): void => {
    analytics.trackFormStart('enquire');
  };
  form.addEventListener('focusin', recordStartOnce, { once: true });
  form.addEventListener('input', recordStartOnce, { once: true });

  function readFormValues(): EnquiryFormValues {
    return {
      email: emailInput?.value ?? '',
      websiteUrl: websiteInput?.value ?? '',
      reviewGoals: reviewGoalsInput?.value ?? '',
      gbpUrl: gbpInput?.value ?? '',
      publisherRole: (publisherSelect?.value ?? '') as AllowedPublisherOption,
    };
  }

  function applyFieldErrors(errors: EnquiryFieldErrors): HTMLElement | null {
    let firstInvalidElement: HTMLElement | null = null;

    (Object.keys(fieldMap) as Array<keyof EnquiryFieldErrors>).forEach((key) => {
      const { input, errorEl } = fieldMap[key];
      const message = errors[key];
      if (!input || !errorEl) return;

      if (message) {
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('border-red-600', 'bg-red-50/30');
        input.classList.remove('border-slate-300');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        if (!firstInvalidElement) {
          firstInvalidElement = input;
        }
      } else {
        input.setAttribute('aria-invalid', 'false');
        input.classList.remove('border-red-600', 'bg-red-50/30');
        input.classList.add('border-slate-300');
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
    });

    return firstInvalidElement;
  }

  // Clear field error when user edits that field
  (Object.keys(fieldMap) as Array<keyof EnquiryFieldErrors>).forEach((key) => {
    const { input, errorEl } = fieldMap[key];
    input?.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        input.setAttribute('aria-invalid', 'false');
        input.classList.remove('border-red-600', 'bg-red-50/30');
        input.classList.add('border-slate-300');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.add('hidden');
        }
      }
    });
  });

  async function handleFormSubmission(): Promise<void> {
    if (isSubmitting) return;

    const currentValues = readFormValues();
    const validation = validateEnquiryForm(currentValues);
    const firstInvalid = applyFieldErrors(validation.errors);

    if (!validation.isValid) {
      analytics.trackFormSubmissionError('validation_error');
      statusRegion.className =
        'mb-6 p-4 rounded-lg border border-red-300 bg-red-50 text-red-900 text-sm';
      statusRegion.setAttribute('role', 'alert');
      statusRegion.innerHTML = `
        <p class="font-semibold mb-1">Please check the highlighted form fields</p>
        <p>One or more required details are missing or need formatting adjustment. Your entries are still in the form below.</p>
      `;
      statusRegion.classList.remove('hidden');
      firstInvalid?.focus();
      return;
    }

    isSubmitting = true;
    form!.setAttribute('aria-busy', 'true');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending enquiry...';
    statusRegion.className =
      'mb-6 p-4 rounded-lg border border-sky-200 bg-sky-50 text-sky-950 text-sm';
    statusRegion.setAttribute('role', 'status');
    statusRegion.innerHTML = `<p class="font-semibold">Submitting your enquiry details...</p>`;
    statusRegion.classList.remove('hidden');

    const endpoint = resolveFormEndpoint(form);
    const outcome = await submitEnquiryPayload(currentValues, endpoint);

    isSubmitting = false;
    form!.setAttribute('aria-busy', 'false');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send enquiry (no payment commitment)';

    if (outcome.ok) {
      analytics.trackGenerateLead(
        validation.normalisedValues.publisherRole || 'unspecified'
      );
      statusRegion.className =
        'mb-6 p-5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-950 text-sm';
      statusRegion.setAttribute('role', 'status');
      statusRegion.innerHTML = `
        <p class="font-bold text-base mb-1.5">Enquiry received</p>
        <p class="leading-relaxed mb-2">${outcome.userMessage}</p>
        <p class="text-xs text-emerald-900">No payment commitment has been created. We only review publicly visible pages at this stage.</p>
      `;
      statusRegion.focus();
      return;
    }

    if (outcome.errorCategory) {
      analytics.trackFormSubmissionError(outcome.errorCategory);
    }

    statusRegion.className =
      'mb-6 p-5 rounded-lg border border-amber-300 bg-amber-50 text-slate-900 text-sm';
    statusRegion.setAttribute('role', 'alert');
    statusRegion.innerHTML = `
      <p class="font-bold text-base mb-1.5">Enquiry could not be sent yet (${
        outcome.errorCategory === 'endpoint_not_configured'
          ? 'Form service endpoint not configured'
          : 'Delivery error'
      })</p>
      <p class="leading-relaxed mb-3">${outcome.userMessage}</p>
      <div class="flex flex-wrap items-center gap-3">
        <button type="button" id="enquiry-retry-btn" class="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors">
          Retry submission
        </button>
        <span class="text-xs text-slate-700">All of your answers are preserved below.</span>
      </div>
    `;

    const retryBtn = document.getElementById('enquiry-retry-btn');
    retryBtn?.addEventListener('click', () => {
      void handleFormSubmission();
    });
    statusRegion.focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleFormSubmission();
  });
}

function bootstrap(): void {
  bindImportedMediaAssets();
  initMobileNavigation();
  initSampleAuditExplorer();
  initCoverageChecklist();
  initEnquiryForm();
  initAnalyticsTracking();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
