import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  COVERAGE_CHECKLIST_ITEMS,
  SAMPLE_AUDIT_FINDINGS,
  calculateChecklistProgress,
  filterSampleFindings,
} from '../data/auditSampleData';
import {
  isValidHttpUrl,
  submitEnquiryPayload,
  validateEnquiryForm,
} from './formValidation';
import {
  AnalyticsManager,
  getCleanPageLocation,
  isValidGa4MeasurementId,
  sanitizeAnalyticsParams,
} from './analytics';

test('sample audit data includes quote-link wording and an unchanged item, with zero em dashes', () => {
  assert.equal(SAMPLE_AUDIT_FINDINGS.length, 4);

  const quoteItem = SAMPLE_AUDIT_FINDINGS.find(
    (item) => item.id === 'quote-link-guidance'
  );
  assert.ok(quoteItem);
  assert.equal(
    quoteItem.proposedWording,
    'Tell us your suburb, clean type and property size.'
  );

  const unchangedItems = filterSampleFindings(
    SAMPLE_AUDIT_FINDINGS,
    'unchanged',
    'all'
  );
  assert.equal(unchangedItems.length, 1);
  assert.equal(unchangedItems[0].id, 'cancellation-access-policy-clear');

  const serializedData = JSON.stringify({
    SAMPLE_AUDIT_FINDINGS,
    COVERAGE_CHECKLIST_ITEMS,
  });
  assert.equal(
    serializedData.includes('—'),
    false,
    'Customer-facing data must not contain em dashes'
  );
});

test('checklist progress calculation deduplicates and computes accurate percentages', () => {
  const zero = calculateChecklistProgress([]);
  assert.deepEqual(zero, { completedCount: 0, totalCount: 5, percentage: 0 });

  const two = calculateChecklistProgress([
    'confirm-operating-suburbs',
    'check-gbp-service-areas',
    'confirm-operating-suburbs', // duplicate
    'non-existent-id', // invalid
  ]);
  assert.deepEqual(two, { completedCount: 2, totalCount: 5, percentage: 40 });
});

test('enquiry form validation enforces required fields and URL/email formats', () => {
  const emptyResult = validateEnquiryForm({
    email: '',
    websiteUrl: '',
    reviewGoals: '',
  });
  assert.equal(emptyResult.isValid, false);
  assert.ok(emptyResult.errors.email);
  assert.ok(emptyResult.errors.websiteUrl);
  assert.ok(emptyResult.errors.reviewGoals);

  assert.equal(isValidHttpUrl('examplecleaning.com.au'), false);
  assert.equal(isValidHttpUrl('https://examplecleaning.com.au'), true);

  const validResult = validateEnquiryForm({
    email: 'owner@perthcleaners.com.au',
    websiteUrl: 'https://perthcleaners.com.au',
    reviewGoals: 'We narrowed our recurring home cleaning suburbs to northern Perth.',
    gbpUrl: 'https://maps.google.com/?cid=12345',
    publisherRole: 'web_contact',
  });
  assert.equal(validResult.isValid, true);
  assert.deepEqual(validResult.errors, {});
});

test('submitEnquiryPayload blocks unconfigured endpoint and distinguishes HTTP 200 vs errors', async () => {
  const validInput = {
    email: 'owner@perthcleaners.com.au',
    websiteUrl: 'https://perthcleaners.com.au',
    reviewGoals: 'Check service page inclusions and quote request steps.',
    publisherRole: 'me' as const,
  };

  // 1. Missing endpoint must not report fake success
  const unconfigured = await submitEnquiryPayload(validInput, '');
  assert.equal(unconfigured.ok, false);
  assert.equal(unconfigured.errorCategory, 'endpoint_not_configured');

  // 2. Mocked HTTP 200 acceptance
  const accepted = await submitEnquiryPayload(
    validInput,
    'https://formspree.io/f/mocktest',
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
  );
  assert.equal(accepted.ok, true);
  assert.equal(accepted.errorCategory, undefined);

  // 3. Mocked HTTP 500 rejection
  const rejected = await submitEnquiryPayload(
    validInput,
    'https://formspree.io/f/mocktest',
    async () => new Response('Server error', { status: 500 })
  );
  assert.equal(rejected.ok, false);
  assert.equal(rejected.errorCategory, 'service_rejected');

  // 4. Mocked network throw
  const netErr = await submitEnquiryPayload(
    validInput,
    'https://formspree.io/f/mocktest',
    async () => {
      throw new Error('Network disconnected');
    }
  );
  assert.equal(netErr.ok, false);
  assert.equal(netErr.errorCategory, 'network_error');
});

test('GA4 AnalyticsManager stays disabled until valid ID is set, deduplicates events, and strips PII', () => {
  assert.equal(isValidGa4MeasurementId(''), false);
  assert.equal(isValidGa4MeasurementId('G-XXXXXXXXXX'), false);
  assert.equal(isValidGa4MeasurementId('GTM-XXXXXXXX'), false);
  assert.equal(isValidGa4MeasurementId('G-9155PERTH1'), true);
  assert.equal(isValidGa4MeasurementId('GTM-5LJQ3KBV'), true);

  const disabledTracker = new AnalyticsManager('');
  assert.equal(disabledTracker.isEnabled(), false);
  assert.equal(disabledTracker.trackPageView('/index.html', 'Home'), false);
  assert.equal(disabledTracker.getRecordedEvents().length, 0);

  const activeTracker = new AnalyticsManager('GTM-5LJQ3KBV');
  assert.equal(activeTracker.isEnabled(), true);

  // Page view deduplication
  assert.equal(
    activeTracker.trackPageView(
      '/BUSN9155_Google/the-audit.html',
      'Website and enquiry clarity review for Perth cleaners | Local Lift',
      'https://kapohari2k.github.io/BUSN9155_Google/the-audit.html?email=leak@test.com'
    ),
    true
  );
  assert.equal(
    activeTracker.trackPageView(
      '/BUSN9155_Google/the-audit.html',
      'Website and enquiry clarity review for Perth cleaners | Local Lift'
    ),
    false
  );

  // Form start deduplication
  assert.equal(activeTracker.trackFormStart('enquire'), true);
  assert.equal(activeTracker.trackFormStart('enquire'), false);

  // Lead & error events
  assert.equal(activeTracker.trackGenerateLead('web_contact'), true);
  assert.equal(
    activeTracker.trackFormSubmissionError('endpoint_not_configured'),
    true
  );

  const events = activeTracker.getRecordedEvents();
  assert.equal(events.length, 4);
  assert.equal(
    events[0].params.page_location,
    'https://kapohari2k.github.io/BUSN9155_Google/the-audit.html'
  );

  // Verify PII sanitizer blocks emails, URLs, and forbidden keys
  const sanitized = sanitizeAnalyticsParams({
    cta_placement: 'hero_primary',
    email: 'secret@cleaner.com.au',
    websiteUrl: 'https://secretcleaner.com.au',
    reviewGoals: 'My private text',
    accidental_email: 'owner@domain.com',
    accidental_url: 'https://example.com/private',
  });
  assert.deepEqual(sanitized, {
    cta_placement: 'hero_primary',
  });

  assert.equal(
    getCleanPageLocation(
      'https://kapohari2k.github.io/BUSN9155_Google/enquire.html?email=test@example.com#form'
    ),
    'https://kapohari2k.github.io/BUSN9155_Google/enquire.html'
  );
});

test('all 5 HTML pages have GTM-5LJQ3KBV tag, unique titles, descriptions, canonical URLs, single H1, and zero em dashes', () => {
  const pages = [
    'index.html',
    'about.html',
    'the-audit.html',
    'coverage-checklist.html',
    'enquire.html',
  ];

  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const file of pages) {
    const html = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    assert.equal(
      html.includes('—') || html.includes('&mdash;'),
      false,
      `${file} must not contain any em dashes`
    );

    assert.ok(
      html.includes('https://www.googletagmanager.com/gtm.js?id=GTM-5LJQ3KBV'),
      `${file} must include the GTM-5LJQ3KBV script tag in head`
    );
    assert.ok(
      html.includes('function gtag(){dataLayer.push(arguments);}'),
      `${file} must include the gtag dataLayer bootstrap in head`
    );

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    assert.ok(titleMatch, `${file} must have a <title>`);
    titles.add(titleMatch[1].trim());

    const descMatch = html.match(
      /<meta\s+name="description"\s+content="([^"]+)"/
    );
    assert.ok(descMatch, `${file} must have a meta description`);
    descriptions.add(descMatch[1].trim());

    const canonicalMatch = html.match(
      /<link\s+rel="canonical"\s+href="([^"]+)"/
    );
    assert.ok(canonicalMatch, `${file} must have a canonical link`);
    assert.ok(
      canonicalMatch[1].startsWith(
        'https://kapohari2k.github.io/BUSN9155_Google/'
      ),
      `${file} canonical URL must use the deployment address`
    );

    const h1Matches = html.match(/<h1[\s>]/g) || [];
    assert.equal(h1Matches.length, 1, `${file} must have exactly one <h1>`);
  }

  assert.equal(titles.size, 5, 'All 5 page titles must be unique');
  assert.equal(descriptions.size, 5, 'All 5 meta descriptions must be unique');

  const auditHtml = fs.readFileSync(
    path.resolve(process.cwd(), 'the-audit.html'),
    'utf8'
  );
  assert.ok(
    auditHtml.includes(
      '<title>Website and enquiry clarity review for Perth cleaners | Local Lift</title>'
    )
  );

  const checklistHtml = fs.readFileSync(
    path.resolve(process.cwd(), 'coverage-checklist.html'),
    'utf8'
  );
  assert.ok(
    checklistHtml.includes('https://support.google.com/business/answer/9157481')
  );
});
