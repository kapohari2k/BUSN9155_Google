export type SamplePriority = 'high' | 'medium' | 'unchanged';
export type PublisherRole = 'owner' | 'web_contact';

export interface SampleAuditFinding {
  id: string;
  itemCode: string;
  touchpoint: string;
  priority: SamplePriority;
  priorityLabel: string;
  publisher: PublisherRole;
  publisherLabel: string;
  findingTitle: string;
  currentObservation: string;
  reason: string;
  proposedWording: string;
  placementInstruction: string;
  ownerConfirmationNote: string;
}

export interface CoverageChecklistItem {
  id: string;
  stepNumber: string;
  area: 'Google Business Profile' | 'Website Pages' | 'Enquiry & Quote Flow';
  title: string;
  checkInstruction: string;
  whenToEdit: string;
  typicalPublisher: string;
}

export const SAMPLE_AUDIT_FINDINGS: SampleAuditFinding[] = [
  {
    id: 'quote-link-guidance',
    itemCode: 'ITEM 01',
    touchpoint: 'Homepage & Services Page Quote Buttons',
    priority: 'high',
    priorityLabel: 'High priority update',
    publisher: 'web_contact',
    publisherLabel: 'Web contact (after owner confirmation)',
    findingTitle: 'Quote link gives no guidance on what details to include',
    currentObservation:
      'Fictional example: The primary "Request a Quote" link opens a generic message box with only Name, Email, and Message fields, without telling the customer what property or booking details are needed.',
    reason:
      'When prospective customers do not know what information is needed to estimate a job, enquiries often arrive without a suburb, service type, or home size. That creates avoidable follow-up messages before you can even confirm whether the home is in your coverage area.',
    proposedWording:
      'Tell us your suburb, clean type and property size.',
    placementInstruction:
      'Place directly above the enquiry message box and below the heading on the Request a Quote section (or as helper text on the main enquiry form).',
    ownerConfirmationNote:
      'Subject to owner confirmation of the exact details required before quoting (for example, whether bathroom count or pet details should also be requested).',
  },
  {
    id: 'suburb-coverage-mismatch',
    itemCode: 'ITEM 02',
    touchpoint: 'Google Business Profile vs Website Footer & Service Page',
    priority: 'high',
    priorityLabel: 'High priority update',
    publisher: 'owner',
    publisherLabel: 'Owner (Google profile) & Web contact (website)',
    findingTitle: 'Listed service area on the website is broader than current preferred suburbs',
    currentObservation:
      'Fictional example: The website footer states "Servicing all Perth metro suburbs north and south of the river", while the owner now focuses on recurring residential cleans within 15 minutes of Stirling and inner northern suburbs.',
    reason:
      'Inconsistent coverage statements between your Google Business Profile and website pages lead to enquiries from outer suburbs you no longer serve, taking time to decline and creating confusion about where you actually travel.',
    proposedWording:
      'We provide regular residential cleaning across inner northern and coastal Perth suburbs, including Stirling, Karrinyup, Scarborough, Innaloo, Mount Hawthorn, and surrounding areas.',
    placementInstruction:
      'Update the Google Business Profile Service Area list (up to 20 suburbs or postcodes) via the owner Google account, and replace the broad metro line in the website footer and Home introduction.',
    ownerConfirmationNote:
      'Subject to owner confirmation of the final suburb list and whether nearby suburbs are accepted for fortnightly bookings.',
  },
  {
    id: 'regular-clean-inclusions',
    itemCode: 'ITEM 03',
    touchpoint: 'Regular Home Cleaning Service Page',
    priority: 'medium',
    priorityLabel: 'Medium priority update',
    publisher: 'web_contact',
    publisherLabel: 'Web contact (after owner confirmation)',
    findingTitle: 'Standard inclusions vs extra tasks are not separated clearly',
    currentObservation:
      'Fictional example: The Regular Cleaning page mentions kitchens, bathrooms, floors, ovens, and interior windows in one general paragraph without distinguishing routine fortnightly tasks from add-on extras.',
    reason:
      'Grouping routine upkeep with periodic extras makes it harder for homeowners to understand what a standard visit covers and which tasks require extra time and a separate quote.',
    proposedWording:
      'Every regular clean covers kitchen benches and sinks, bathroom sanitising, dusting, and vacuuming and mopping hard floors. Inside oven cleaning, internal windows, and deep skirting board detailing can be added by prior arrangement.',
    placementInstruction:
      'Replace the second paragraph under "What Our Regular Home Clean Covers" on the Services page with two short sub-sections: "Included in every visit" and "Available by prior request".',
    ownerConfirmationNote:
      'Subject to owner confirmation of standard routine tasks and which add-on tasks are currently offered.',
  },
  {
    id: 'cancellation-access-policy-clear',
    itemCode: 'ITEM 04',
    touchpoint: 'Booking Enquiry Page: Access & Rescheduling Note',
    priority: 'unchanged',
    priorityLabel: 'Clear (keep unchanged)',
    publisher: 'owner',
    publisherLabel: 'No edit required',
    findingTitle: 'Entry instructions and 48-hour rescheduling notice are already clear',
    currentObservation:
      'Fictional example: The existing page states: "You do not need to be home during your clean if safe key or lockbox access is arranged in advance. Please give at least 48 hours notice if you need to reschedule a regular booking."',
    reason:
      'This wording is plain, specific, and matches the owner-confirmed operating policy. Rewriting clear copy adds unnecessary editing cost and risks introducing ambiguity where none exists.',
    proposedWording:
      'No replacement wording needed. Keep current text unchanged.',
    placementInstruction:
      'Retain in its current position under "How Bookings Work" on the Enquiry page.',
    ownerConfirmationNote:
      'Confirmed accurate against current operating policy; flagged as "Keep unchanged" so neither the owner nor the web contact spends time editing it.',
  },
];

export const COVERAGE_CHECKLIST_ITEMS: CoverageChecklistItem[] = [
  {
    id: 'confirm-operating-suburbs',
    stepNumber: 'Step 1',
    area: 'Google Business Profile',
    title: 'Write down your actual current suburbs and travel limits first',
    checkInstruction:
      'Before logging into any platform, list the specific Perth suburbs, postcodes, or local government areas you actively want to accept for your main cleaning services.',
    whenToEdit:
      'Only needed when your preferred travel radius or suburb focus has genuinely changed.',
    typicalPublisher: 'Business owner (internal operating list)',
  },
  {
    id: 'check-gbp-service-areas',
    stepNumber: 'Step 2',
    area: 'Google Business Profile',
    title: 'Inspect your Google Business Profile Service Area list',
    checkInstruction:
      'Sign in to your Google Business Profile, select "Edit profile", open the "Location" tab, and review the "Service area" section. Google allows up to 20 specific service areas by suburb, city, or postcode rather than a kilometre radius.',
    whenToEdit:
      'Update this list if it still shows whole-of-Perth coverage or suburbs you have stopped visiting.',
    typicalPublisher: 'Business owner (via Google account)',
  },
  {
    id: 'check-website-headline-and-footer',
    stepNumber: 'Step 3',
    area: 'Website Pages',
    title: 'Check your website homepage introduction and footer summary',
    checkInstruction:
      'Read your homepage opening section and site-wide footer. Look for broad default phrases such as "All Perth Metro Areas" that may contradict your narrower Google Business Profile list.',
    whenToEdit:
      'Update if the website promises metro-wide travel that you now decline. If your website already names the right corridor (for example, "Northern Suburbs Perth") and you only dropped one outlying suburb, a full page rewrite may not be necessary.',
    typicalPublisher: 'Business owner or web contact',
  },
  {
    id: 'check-service-page-suburb-lists',
    stepNumber: 'Step 4',
    area: 'Website Pages',
    title: 'Review dedicated service pages and FAQ travel notes',
    checkInstruction:
      'Check whether different services have different travel rules (for example, travelling further for a full vacate clean than for a two-hour fortnightly home clean) and whether your pages explain that distinction.',
    whenToEdit:
      'Clarify only if customers frequently enquire for small jobs outside your regular corridor.',
    typicalPublisher: 'Web contact (using owner-confirmed suburbs)',
  },
  {
    id: 'check-quote-form-suburb-prompt',
    stepNumber: 'Step 5',
    area: 'Enquiry & Quote Flow',
    title: 'Verify that your quote or contact form asks for the customer suburb up front',
    checkInstruction:
      'Open your contact or quote request page as a customer would. Check whether the form explicitly asks for the property suburb alongside the clean type and property size.',
    whenToEdit:
      'Add a suburb field or a clear helper prompt above the message box if enquiries regularly arrive without a location.',
    typicalPublisher: 'Web contact or form tool administrator',
  },
];

export function filterSampleFindings(
  items: SampleAuditFinding[],
  priorityFilter: 'all' | SamplePriority,
  publisherFilter: 'all' | PublisherRole
): SampleAuditFinding[] {
  return items.filter((item) => {
    const matchesPriority =
      priorityFilter === 'all' || item.priority === priorityFilter;
    const matchesPublisher =
      publisherFilter === 'all' || item.publisher === publisherFilter;
    return matchesPriority && matchesPublisher;
  });
}

export function calculateChecklistProgress(
  completedIds: string[],
  items: CoverageChecklistItem[] = COVERAGE_CHECKLIST_ITEMS
): {
  completedCount: number;
  totalCount: number;
  percentage: number;
} {
  const validIds = new Set(items.map((item) => item.id));
  const uniqueCompleted = Array.from(new Set(completedIds)).filter((id) =>
    validIds.has(id)
  );
  const totalCount = items.length;
  const completedCount = uniqueCompleted.length;
  const percentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percentage,
  };
}
