import type { BlueprintItem, BlueprintItemKind, ConciergeRequest, IntentCategory, IntentTask, IntentTemplate, StaffRole } from '@ayana/shared-types';

/**
 * The selectable catalog of travel purposes. Only 'business_presentation' is deepBuilt —
 * every other template is real and selectable (proving the platform's breadth) but resolves
 * to a single placeholder line rather than a fabricated checklist. See
 * docs/AYANA_Intent_Engine_Architecture.docx for the full production design of every intent.
 */
export const INTENT_CATALOG: IntentTemplate[] = [
  { id: 'business_meeting', label: 'Business Meeting', category: 'business', description: 'A single-day meeting with a client or partner', deepBuilt: false },
  { id: 'conference', label: 'Conference', category: 'business', description: 'Attending or speaking at an industry event', deepBuilt: false },
  { id: 'sales_visit', label: 'Sales Visit', category: 'business', description: 'On-site visit to close or support a deal', deepBuilt: false },
  { id: 'business_presentation', label: 'Business Presentation', category: 'business', description: 'A high-stakes presentation you need to nail', deepBuilt: true },
  { id: 'remote_working', label: 'Remote Working', category: 'business', description: 'Working from the hotel for an extended stretch', deepBuilt: false },
  { id: 'job_interview', label: 'Job Interview', category: 'business', description: 'An interview you’re travelling in for', deepBuilt: false },
  { id: 'education', label: 'Education', category: 'business', description: 'A course, exam, or campus visit', deepBuilt: false },

  { id: 'anniversary', label: 'Anniversary', category: 'celebration', description: 'Marking a relationship milestone together', deepBuilt: false },
  { id: 'wedding', label: 'Wedding', category: 'celebration', description: 'Attending or hosting a wedding', deepBuilt: false },
  { id: 'birthday', label: 'Birthday', category: 'celebration', description: 'Celebrating a birthday away from home', deepBuilt: false },
  { id: 'honeymoon', label: 'Honeymoon', category: 'celebration', description: 'Your first trip as a married couple', deepBuilt: false },
  { id: 'family_reunion', label: 'Family Reunion', category: 'celebration', description: 'Bringing the extended family together', deepBuilt: false },

  { id: 'medical_visit', label: 'Medical Visit', category: 'health_wellness', description: 'Travelling for treatment, recovery, or a procedure', deepBuilt: false },
  { id: 'personal_wellness', label: 'Personal Wellness', category: 'health_wellness', description: 'A stay focused on rest and recovery', deepBuilt: false },
  { id: 'spiritual_retreat', label: 'Spiritual Retreat', category: 'health_wellness', description: 'Time set aside for reflection and quiet', deepBuilt: false },

  { id: 'family_vacation', label: 'Family Vacation', category: 'leisure', description: 'A trip with the whole family', deepBuilt: false },
  { id: 'staycation', label: 'Staycation', category: 'leisure', description: 'A local break without the travel', deepBuilt: false },
  { id: 'adventure', label: 'Adventure', category: 'leisure', description: 'An active, exploration-led trip', deepBuilt: false },
  { id: 'leisure', label: 'Leisure', category: 'leisure', description: 'Simple, unstructured downtime', deepBuilt: false },
  { id: 'sports_event', label: 'Sports Event', category: 'leisure', description: 'Attending or competing in a sporting event', deepBuilt: false },

  { id: 'transit_stay', label: 'Transit Stay', category: 'life_travel', description: 'A short stay between connecting journeys', deepBuilt: false },
  { id: 'emergency_travel', label: 'Emergency Travel', category: 'life_travel', description: 'An urgent, unplanned trip', deepBuilt: false },
];

export const INTENT_CATEGORY_LABEL: Record<IntentCategory, string> = {
  business: 'Business',
  celebration: 'Celebration',
  health_wellness: 'Health & Wellness',
  leisure: 'Leisure',
  life_travel: 'Life & Travel',
};

export function intentTemplateById(id: string): IntentTemplate | undefined {
  return INTENT_CATALOG.find((t) => t.id === id);
}

/** The blueprint definition for a template — kind/label/routing only, `done` is resolved separately against live state. */
function blueprintTemplate(templateId: string): Omit<BlueprintItem, 'done'>[] {
  if (templateId === 'business_presentation') {
    return [
      { id: 'quiet_room', label: 'Quiet room confirmed', kind: 'intent_task', department: 'front_office' },
      { id: 'internet', label: 'High-speed internet verified', kind: 'auto_ready' },
      { id: 'printer', label: 'Printer availability confirmed', kind: 'auto_ready' },
      { id: 'meeting_room', label: 'Meeting room recommendation held', kind: 'intent_task', department: 'front_office' },
      { id: 'coffee', label: 'Coffee preference on file', kind: 'auto_ready' },
      { id: 'airport_pickup', label: 'Airport pickup arranged', kind: 'concierge_request', conciergeRequestType: 'airport_pickup' },
      { id: 'express_checkout', label: 'Express checkout enabled', kind: 'auto_ready' },
      { id: 'wake_up', label: 'Wake-up call scheduled', kind: 'concierge_request', conciergeRequestType: 'wake_up_call' },
      { id: 'taxi', label: 'Taxi reserved for the meeting', kind: 'concierge_request', conciergeRequestType: 'taxi' },
      { id: 'early_checkin', label: 'Early check-in recommendation noted', kind: 'intent_task', department: 'front_office' },
    ];
  }
  const template = intentTemplateById(templateId);
  return [
    {
      id: 'placeholder',
      label: `Full blueprint being prepared for ${template?.label ?? 'this journey'}`,
      kind: 'auto_ready',
    },
  ];
}

/**
 * The seed for each hotel-side task a deepBuilt blueprint needs — resolved into a real
 * IntentTask at booking creation. Derived from `blueprintTemplate` itself (rather than a
 * separately maintained label list) so the seeded task and the checklist item it resolves
 * against can never drift out of sync.
 */
export function intentTaskSeedsForTemplate(templateId: string): { label: string; department: StaffRole }[] {
  return blueprintTemplate(templateId)
    .filter((item) => item.kind === 'intent_task' && item.department)
    .map((item) => ({ label: item.label, department: item.department as StaffRole }));
}

export interface BlueprintContext {
  bookingId: string;
  conciergeRequests: ConciergeRequest[];
  intentTasks: IntentTask[];
}

/** Generates a template's blueprint with `done` resolved against live booking state — the source of truth the UI renders from. */
export function resolveExperienceBlueprint(templateId: string, ctx: BlueprintContext): BlueprintItem[] {
  return blueprintTemplate(templateId).map((item) => {
    if (item.kind === 'auto_ready') return { ...item, done: item.id !== 'placeholder' };
    if (item.kind === 'concierge_request') {
      const done = ctx.conciergeRequests.some(
        (r) => r.bookingId === ctx.bookingId && r.type === item.conciergeRequestType && r.status !== 'cancelled',
      );
      return { ...item, done };
    }
    // intent_task
    const matching = ctx.intentTasks.find((t) => t.bookingId === ctx.bookingId && t.label === item.label);
    return { ...item, done: matching?.status === 'done' };
  });
}

/** Track-A "orchestration": concatenate primary + secondary blueprints, primary first, deduped by label. */
export function mergeBlueprints(primary: BlueprintItem[], secondary: BlueprintItem[]): BlueprintItem[] {
  const seen = new Set(primary.map((i) => i.label));
  return [...primary, ...secondary.filter((i) => !seen.has(i.label))];
}

export function calculateIntentFulfilment(items: BlueprintItem[]): number {
  if (items.length === 0) return 100;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}

const BUCKET_LABEL: Record<BlueprintItemKind, string> = {
  auto_ready: 'Verified automatically before you arrived',
  concierge_request: 'Set up at your request',
  intent_task: 'Handled by our team',
};

export interface BlueprintBucket {
  kind: BlueprintItemKind;
  label: string;
  done: number;
  total: number;
}

export interface TimedCompletion {
  label: string;
  minutesAfterCheckIn: number;
}

export interface BlueprintSummary {
  buckets: BlueprintBucket[];
  timedCompletions: TimedCompletion[];
  stillOpen: string[];
}

/**
 * The guest-facing checkout recap's data source — real counts and, where the timestamps
 * exist, real elapsed-time figures. Never a single opaque percentage: every number here
 * traces back to an actual blueprint item, IntentTask, or ConciergeRequest record.
 */
export function summarizeBlueprint(
  items: BlueprintItem[],
  ctx: { bookingId: string; intentTasks: IntentTask[]; checkedInAt: string | null },
): BlueprintSummary {
  const real = items.filter((i) => i.id !== 'placeholder');

  const buckets: BlueprintBucket[] = (['auto_ready', 'concierge_request', 'intent_task'] as BlueprintItemKind[])
    .map((kind) => {
      const ofKind = real.filter((i) => i.kind === kind);
      return { kind, label: BUCKET_LABEL[kind], done: ofKind.filter((i) => i.done).length, total: ofKind.length };
    })
    .filter((b) => b.total > 0);

  const timedCompletions: TimedCompletion[] = [];
  if (ctx.checkedInAt) {
    const checkedInMs = new Date(ctx.checkedInAt).getTime();
    for (const item of real) {
      if (item.kind !== 'intent_task' || !item.done) continue;
      const task = ctx.intentTasks.find((t) => t.bookingId === ctx.bookingId && t.label === item.label);
      if (!task?.completedAt) continue;
      const minutes = Math.round((new Date(task.completedAt).getTime() - checkedInMs) / 60_000);
      if (minutes >= 0) timedCompletions.push({ label: item.label, minutesAfterCheckIn: minutes });
    }
  }

  const stillOpen = real.filter((i) => !i.done).map((i) => i.label);

  return { buckets, timedCompletions, stillOpen };
}

/**
 * The one concrete conditional-recommendation example from the brief: "if the meeting
 * finishes before 3 PM, recommend the spa." The meeting room item standing in for
 * "meeting finished" is a deliberate simplification — full conditional-relationship
 * modelling is a Track-B design item, not built here.
 */
export function shouldSuggestSpaAfterMeeting(items: BlueprintItem[], now: Date = new Date()): boolean {
  const meetingDone = items.find((i) => i.id === 'meeting_room')?.done;
  return Boolean(meetingDone) && now.getHours() < 15;
}
