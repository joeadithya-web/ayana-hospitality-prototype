import { blendIntentMatchScore, intentTemplateById } from '@ayana/ai-engine';
import { Badge, Card, EmptyState } from '@ayana/shared-ui';
import { useSimulationStore } from '@ayana/simulation-engine';
import { useHotelBookings } from '../hooks';

/**
 * The staff-only counterpart to what guests no longer see: the declared purpose of stay and
 * the honest, booking-time match assessment against real availability/amenity data. Guests
 * never see a percentage or a "what didn't match" note — this panel is where that lives.
 */
export function IntentMatchPanel() {
  const bookings = useHotelBookings();
  const guests = useSimulationStore((s) => s.guests);
  const guestById = new Map(guests.map((g) => [g.id, g]));

  const withIntents = bookings
    .filter((b) => (b.intents ?? []).length > 0 && (b.status === 'checked_in' || b.status === 'confirmed' || b.status === 'pending_payment'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (withIntents.length === 0) {
    return <EmptyState icon="🎯" title="No declared purposes yet" description="Guest-stated travel Intents and their match scores will appear here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {withIntents.map((booking) => {
        const guest = guestById.get(booking.guestId);
        const intents = booking.intents ?? [];
        const intentMatch = booking.intentMatch ?? [];
        const blendedScore = blendIntentMatchScore(intents, intentMatch);

        return (
          <Card key={booking.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink-900">{guest?.fullName ?? 'Guest'}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {intents.map((intent) => (
                    <Badge key={intent.templateId} tone="neutral">
                      {intentTemplateById(intent.templateId)?.label ?? 'Intent'} · {intent.role === 'primary' ? 'Primary' : 'Secondary'}
                    </Badge>
                  ))}
                </div>
              </div>
              {blendedScore !== null ? (
                <Badge tone="gold">Match {blendedScore}%</Badge>
              ) : (
                <Badge tone="neutral">Not yet assessable</Badge>
              )}
            </div>

            {booking.journeyGoal && (
              <p className="mt-2 rounded-lg bg-cream-100 px-3 py-2 text-xs italic text-ink-700/70">“{booking.journeyGoal}”</p>
            )}

            {intentMatch.some((m) => m.totalCount > 0) && (
              <div className="mt-2.5 flex flex-col gap-1 border-t border-ink-900/10 pt-2.5">
                {intentMatch.flatMap((m) => m.items).map((item) => (
                  <div key={item.id} className="flex flex-col text-xs">
                    <span className={item.matched ? 'text-ink-900' : 'text-ink-700/70'}>
                      {item.matched ? '✓' : '△'} {item.label}
                    </span>
                    {item.note && <span className="pl-4 text-ink-700/50">{item.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
