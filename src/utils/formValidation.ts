export type AllowedPublisherOption =
  | ''
  | 'me'
  | 'web_contact'
  | 'needs_confirmation';

export interface EnquiryFormValues {
  email: string;
  websiteUrl: string;
  reviewGoals: string;
  gbpUrl?: string;
  publisherRole?: AllowedPublisherOption;
}

export interface EnquiryFieldErrors {
  email?: string;
  websiteUrl?: string;
  reviewGoals?: string;
  gbpUrl?: string;
  publisherRole?: string;
}

export interface EnquiryValidationResult {
  isValid: boolean;
  errors: EnquiryFieldErrors;
  normalisedValues: EnquiryFormValues;
}

export type SubmissionErrorCategory =
  | 'validation_error'
  | 'endpoint_not_configured'
  | 'network_error'
  | 'service_rejected'
  | 'rate_limited';

export interface EnquirySubmissionOutcome {
  ok: boolean;
  errorCategory?: SubmissionErrorCategory;
  userMessage: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_PUBLISHER_OPTIONS = new Set<string>([
  '',
  'me',
  'web_contact',
  'needs_confirmation',
]);

export function isValidHttpUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || (host.includes('.') && !host.startsWith('.') && !host.endsWith('.'));
  } catch {
    return false;
  }
}

export function validateEnquiryForm(
  raw: EnquiryFormValues
): EnquiryValidationResult {
  const email = (raw.email ?? '').trim();
  const websiteUrl = (raw.websiteUrl ?? '').trim();
  const reviewGoals = (raw.reviewGoals ?? '').trim();
  const gbpUrl = (raw.gbpUrl ?? '').trim();
  const publisherRole = ((raw.publisherRole ?? '').trim() as AllowedPublisherOption);

  const errors: EnquiryFieldErrors = {};

  if (!email) {
    errors.email = 'Please enter your email address so we can reply to your enquiry.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address (for example, name@business.com.au).';
  }

  if (!websiteUrl) {
    errors.websiteUrl = 'Please enter your business website URL (including https://).';
  } else if (!isValidHttpUrl(websiteUrl)) {
    errors.websiteUrl =
      'Please enter a complete website URL starting with https:// or http:// (for example, https://examplecleaning.com.au).';
  }

  if (!reviewGoals) {
    errors.reviewGoals =
      'Please briefly describe what you would like reviewed (such as service pages, suburb coverage, or quote steps).';
  } else if (reviewGoals.length < 10) {
    errors.reviewGoals =
      'Please add a few more words about what you would like reviewed so we can assess suitability.';
  }

  if (gbpUrl && !isValidHttpUrl(gbpUrl)) {
    errors.gbpUrl =
      'If providing a Google Business Profile link, please enter a full URL starting with https:// or http://.';
  }

  if (!ALLOWED_PUBLISHER_OPTIONS.has(publisherRole)) {
    errors.publisherRole = 'Please select a valid publishing option from the list.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalisedValues: {
      email,
      websiteUrl,
      reviewGoals,
      gbpUrl,
      publisherRole: ALLOWED_PUBLISHER_OPTIONS.has(publisherRole)
        ? publisherRole
        : '',
    },
  };
}

export async function submitEnquiryPayload(
  values: EnquiryFormValues,
  endpointUrl: string | undefined | null,
  fetchImpl: typeof fetch = fetch
): Promise<EnquirySubmissionOutcome> {
  const validation = validateEnquiryForm(values);
  if (!validation.isValid) {
    return {
      ok: false,
      errorCategory: 'validation_error',
      userMessage:
        'Please check the highlighted fields below and correct any missing or invalid details before sending.',
    };
  }

  const trimmedEndpoint = (endpointUrl ?? '').trim();
  if (!trimmedEndpoint || !isValidHttpUrl(trimmedEndpoint)) {
    return {
      ok: false,
      errorCategory: 'endpoint_not_configured',
      userMessage:
        'Live form delivery is not yet configured for this preview deployment (VITE_FORM_ENDPOINT is empty). Your entries have been kept in the form below so nothing is lost.',
    };
  }

  try {
    const response = await fetchImpl(trimmedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: validation.normalisedValues.email,
        websiteUrl: validation.normalisedValues.websiteUrl,
        reviewGoals: validation.normalisedValues.reviewGoals,
        gbpUrl: validation.normalisedValues.gbpUrl || undefined,
        publisherRole: validation.normalisedValues.publisherRole || 'unspecified',
        submittedFrom: 'Local Lift Website Enquiry Form',
      }),
    });

    if (response.ok) {
      return {
        ok: true,
        userMessage:
          'Thank you. Your enquiry has been received by the form service. We will inspect the public pages you nominated and reply by email with suitability notes and proposed scope before any paid work is agreed.',
      };
    }

    if (response.status === 429) {
      return {
        ok: false,
        errorCategory: 'rate_limited',
        userMessage:
          'The form service reported too many recent attempts. Your answers are still in the form below. Please wait a moment and try again.',
      };
    }

    return {
      ok: false,
      errorCategory: 'service_rejected',
      userMessage:
        'The form service could not accept the submission right now (HTTP ' +
        String(response.status) +
        '). Your answers have been preserved below so you can retry without retyping.',
    };
  } catch {
    return {
      ok: false,
      errorCategory: 'network_error',
      userMessage:
        'A network error prevented your enquiry from reaching the form service. Your answers remain in the form below so you can retry when your connection is ready.',
    };
  }
}
