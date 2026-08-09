import { useMemo } from 'react';
import {
  calculateIntentFulfilment,
  intentTemplateById,
  mergeBlueprints,
  resolveExperienceBlueprint,
  shouldSuggestSpaAfterMeeting,
} from '@ayana/ai-engine';
import type { Booking, ConciergeRequest, ConciergeRequestType, IntentTask } from '@ayana/shared-types';
import { Badge, Card, ProgressSteps } from '@ayana/shared-ui';

interface JourneyMissionCardProps {
  booking: Booking;
  conciergeRequests: ConciergeRequest[];
  intentTasks: IntentTask[];
  onArrange: (type: ConciergeRequestType, label: string) => void;
  onSuggestSpa: () => void;
}

/**
 * "My Journey" — the guest-facing surface of the Intent Engine. Only renders when a booking
 * opted into an intent at all; a booking with `intents: []` never reaches this component.
 */
export function JourneyMissionCard({ booking, conciergeRequests, intentTasks, onArrange, onSuggestSpa }: JourneyMissionCardProps) {
  const primary = booking.intents.find((i) => i.role === 'primary');
  const secondary = booking.intents.find((i) => i.role === 'secondary');

  const primaryBlueprint = useMemo(
    () => (primary ? resolveExperienceBlueprint(primary.templateId, { bookingId: booking.id, conciergeRequests, intentTasks }) : []),
    [primary, booking.id, conciergeRequests, intentTasks],
  );
  const secondaryBlueprint = useMemo(
    () => (secondary ? resolveExperienceBlueprint(secondary.templateId, { bookingId: booking.id, conciergeRequests, intentTasks }) : []),
    [secondary, booking.id, conciergeRequests, intentTasks],
  );
  const merged = useMemo(() => mergeBlueprints(primaryBlueprint, secondaryBlueprint), [primaryBlueprint, secondaryBlueprint]);

  if (!primary) return null;

  const primaryTemplate = intentTemplateById(primary.templateId);
  const secondaryTemplate = secondary ? intentTemplateById(secondary.templateId) : undefined;
  const overallFulfilment = calculateIntentFulfilment(merged);
  const suggestSpa = primaryTemplate?.deepBuilt && shouldSuggestSpaAfterMeeting(primaryBlueprint);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink-950">My Journey</h2>
        <Badge tone="gold">{overallFulfilment}% ready</Badge>
      </div>

      <Card>
        {booking.journeyGoal && (
          <p className="mb-3 rounded-lg bg-cream-100 px-3 py-2 text-xs italic text-ink-700/70">“{booking.journeyGoal}”</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Badge tone="neutral">{primaryTemplate?.label ?? 'Primary intent'} · Primary</Badge>
          {secondaryTemplate && <Badge tone="neutral">{secondaryTemplate.label} · Secondary</Badge>}
        </div>

        {primaryTemplate?.deepBuilt ? (
          <div className="mt-3 border-t border-ink-900/10 pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-700/60">Today's Mission</p>
            <ProgressSteps steps={merged.map((item) => ({ key: item.id, label: item.label, done: item.done }))} />

            {merged.some((item) => item.kind === 'concierge_request' && !item.done) && (
              <div className="mt-3 flex flex-col gap-1.5">
                {merged
                  .filter((item) => item.kind === 'concierge_request' && !item.done)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => item.conciergeRequestType && onArrange(item.conciergeRequestType, item.label)}
                      className="rounded-lg border border-ink-900/15 px-3 py-2 text-left text-xs font-medium text-ink-900"
                    >
                      Arrange: {item.label}
                    </button>
                  ))}
              </div>
            )}

            {suggestSpa && (
              <button
                onClick={onSuggestSpa}
                className="mt-3 w-full rounded-lg bg-gold-500/10 px-3 py-2 text-left text-xs font-medium text-gold-600"
              >
                Meeting's wrapped up early — want to book the spa before it gets busy?
              </button>
            )}
          </div>
        ) : (
          <p className="mt-3 border-t border-ink-900/10 pt-3 text-xs text-ink-700/50">
            {merged[0]?.label ?? 'Full blueprint coming soon.'}
          </p>
        )}
      </Card>
    </section>
  );
}
