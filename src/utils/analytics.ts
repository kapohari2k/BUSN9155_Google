import type { SubmissionErrorCategory } from './formValidation';

export type SafeCtaPlacement =
  | 'header_primary'
  | 'hero_primary'
  | 'home_bottom_banner'
  | 'about_bottom_cta'
  | 'audit_scope_cta'
  | 'audit_sample_cta'
  | 'checklist_optional_cta'
  | 'footer_enquire';

export type SafeSampleGuideAction =
  | 'home_sample_jump'
  | 'home_checklist_jump'
  | 'sample_filter_change'
  | 'sample_copy_wording'
  | 'checklist_item_toggle'
  | 'checklist_reset'
  | 'official_gbp_guide_click';

export interface RecordedAnalyticsEvent {
  eventName: string;
  params: Record<string, string | number | boolean>;
  timestamp: number;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __LOCAL_LIFT_CONFIG__?: {
      ga4MeasurementId?: string;
      formEndpoint?: string;
    };
    __LOCAL_LIFT_ANALYTICS_LOG__?: RecordedAnalyticsEvent[];
  }
}

const FORBIDDEN_PARAM_KEYS = new Set([
  'email',
  'user_email',
  'website',
  'websiteurl',
  'website_url',
  'gbpurl',
  'gbp_url',
  'reviewgoals',
  'review_goals',
  'message',
  'free_text',
  'name',
  'phone',
  'query',
  'search_term',
]);

export const DEFAULT_ANALYTICS_ID = 'GTM-5LJQ3KBV';

const ANALYTICS_ID_PATTERN = /^(G|GTM)-[A-Z0-9]{4,16}$/i;

export function isValidGa4MeasurementId(id?: string | null): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  const upper = trimmed.toUpperCase();
  if (
    !trimmed ||
    upper === 'G-XXXXXXXXXX' ||
    upper === 'GTM-XXXXXXXX' ||
    upper === 'GTM-XXXXXXXXXX'
  ) {
    return false;
  }
  return ANALYTICS_ID_PATTERN.test(trimmed);
}

export function sanitizeAnalyticsParams(
  rawParams: Record<string, unknown>
): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(rawParams)) {
    const normalisedKey = key.trim().toLowerCase();
    if (FORBIDDEN_PARAM_KEYS.has(normalisedKey)) {
      continue;
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      safe[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      const trimmedVal = value.trim();
      // Never pass email addresses or full URLs in custom event parameters
      // (page_location is handled solely by explicit page_view with query string stripped)
      if (trimmedVal.includes('@')) {
        continue;
      }
      if (
        normalisedKey !== 'page_location' &&
        (trimmedVal.startsWith('http://') || trimmedVal.startsWith('https://'))
      ) {
        continue;
      }
      safe[key] = trimmedVal.slice(0, 100);
    }
  }

  return safe;
}

export function getCleanPageLocation(href: string): string {
  try {
    const parsed = new URL(href);
    // Strip query string and hash so user inputs or parameters never enter GA4 page_location
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return href.split('?')[0].split('#')[0];
  }
}

export class AnalyticsManager {
  private measurementId: string | null = null;
  private initialized = false;
  private sentPageViews = new Set<string>();
  private formStartRecorded = false;
  private eventLog: RecordedAnalyticsEvent[] = [];

  constructor(measurementId?: string | null) {
    this.configure(measurementId);
  }

  public configure(measurementId?: string | null): boolean {
    if (isValidGa4MeasurementId(measurementId)) {
      this.measurementId = measurementId!.trim();
      this.initialized = true;
      return true;
    }
    this.measurementId = null;
    this.initialized = false;
    return false;
  }

  public isEnabled(): boolean {
    return this.initialized && this.measurementId !== null;
  }

  public getMeasurementId(): string | null {
    return this.measurementId;
  }

  public getRecordedEvents(): RecordedAnalyticsEvent[] {
    return [...this.eventLog];
  }

  public resetSessionState(): void {
    this.sentPageViews.clear();
    this.formStartRecorded = false;
    this.eventLog = [];
  }

  public injectGtagScriptIfNeeded(): void {
    if (!this.isEnabled() || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const id = this.measurementId!;
    const isGtmId = id.toUpperCase().startsWith('GTM-');
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
      window.gtag('js', new Date());
    }

    if (!isGtmId) {
      // Disable automatic page_view inside GA4 config so we send exactly one clean page_view per page load
      window.gtag('config', id, {
        send_page_view: false,
        anonymize_ip: true,
      });
    }

    const existingScript = document.querySelector(
      `script[data-ga4-id="${id}"], script[src*="id=${encodeURIComponent(id)}"]`
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = isGtmId
        ? `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`
        : `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      script.setAttribute('data-ga4-id', id);
      document.head.appendChild(script);
    }
  }

  private dispatch(
    eventName: string,
    rawParams: Record<string, unknown>
  ): boolean {
    const safeParams = sanitizeAnalyticsParams(rawParams);
    const entry: RecordedAnalyticsEvent = {
      eventName,
      params: safeParams,
      timestamp: Date.now(),
    };

    if (!this.isEnabled()) {
      return false;
    }

    this.eventLog.push(entry);
    if (typeof window !== 'undefined') {
      window.__LOCAL_LIFT_ANALYTICS_LOG__ = this.getRecordedEvents();
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, safeParams);
      }
    }
    return true;
  }

  public trackPageView(pagePath: string, pageTitle: string, fullHref?: string): boolean {
    const cleanPath = pagePath.split('?')[0].split('#')[0] || '/';
    if (this.sentPageViews.has(cleanPath)) {
      return false;
    }
    this.sentPageViews.add(cleanPath);

    return this.dispatch('page_view', {
      page_path: cleanPath,
      page_title: pageTitle,
      page_location: fullHref ? getCleanPageLocation(fullHref) : cleanPath,
    });
  }

  public trackEnquiryCtaClick(
    placement: SafeCtaPlacement,
    sourcePage: string
  ): boolean {
    return this.dispatch('enquiry_cta_click', {
      cta_placement: placement,
      source_page: sourcePage,
    });
  }

  public trackSampleOrGuideSelect(
    action: SafeSampleGuideAction,
    itemIdentifier: string,
    sourcePage: string
  ): boolean {
    return this.dispatch('sample_or_guide_select', {
      interaction_type: action,
      item_id: itemIdentifier,
      source_page: sourcePage,
    });
  }

  public trackFormStart(sourcePage = 'enquire'): boolean {
    if (this.formStartRecorded) {
      return false;
    }
    this.formStartRecorded = true;
    return this.dispatch('form_start', {
      form_id: 'enquiry_form',
      source_page: sourcePage,
    });
  }

  public trackGenerateLead(publisherOption: string): boolean {
    const safePublisher =
      publisherOption === 'me' ||
      publisherOption === 'web_contact' ||
      publisherOption === 'needs_confirmation'
        ? publisherOption
        : 'unspecified';

    return this.dispatch('generate_lead', {
      form_id: 'enquiry_form',
      publisher_option: safePublisher,
    });
  }

  public trackFormSubmissionError(category: SubmissionErrorCategory): boolean {
    return this.dispatch('form_submission_error', {
      form_id: 'enquiry_form',
      error_category: category,
    });
  }
}
