import { useNavigate } from 'react-router-dom';
import { hotelsInCity, recommendNextTrips } from '@ayana/ai-engine';
import { useSimulationStore } from '@ayana/simulation-engine';
import type { AyanaMemory, HotelCity } from '@ayana/shared-types';
import { AnaIqMark, Card } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';

/**
 * Where this guest is likely to travel next from the city they're currently in.
 * Destinations where AYANA has partner inventory lead, and each one drops straight
 * into a bookable hotel — that's the path from one stay into the next booking.
 */
export function NextTripPanel({ city, memory }: { city: HotelCity; memory: AyanaMemory }) {
  const navigate = useNavigate();
  const hotels = useSimulationStore((s) => s.hotels);
  const ideas = recommendNextTrips(city, memory);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink-950">Where Next?</h2>
        <AnaIqMark />
      </div>
      <p className="mb-2.5 text-xs text-ink-700/50">
        Popular onward journeys from {city}, picked for how you travel.
      </p>

      <div className="flex flex-col gap-2">
        {ideas.map((idea) => {
          const bookable = idea.matchedCity ? hotelsInCity(hotels, idea.matchedCity, 1)[0] : undefined;

          return (
            <Card key={idea.id} className="flex flex-col gap-2">
              <div className="flex gap-3">
                <span className="text-2xl leading-none">{idea.icon}</span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-ink-900">{idea.destination}</p>
                    <span className="flex-none text-[11px] text-ink-700/40">{idea.travelTime}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-700/60">{idea.description}</p>
                  <p className="mt-1 text-[11px] text-gold-600">✦ {idea.reason}</p>
                </div>
              </div>

              {bookable ? (
                <button
                  onClick={() => navigate(`/traveller/hotel/${bookable.id}`)}
                  className="flex items-center justify-between rounded-lg border border-gold-500/40 bg-gold-500/5 px-3 py-2 text-left"
                >
                  <span>
                    <span className="block text-xs font-medium text-ink-900">{bookable.name}</span>
                    <span className="block text-[11px] text-ink-700/50">
                      {bookable.starRating}★ · from {formatINR(bookable.priceFloor)}/night
                    </span>
                  </span>
                  <span className="text-xs font-medium text-gold-600">Book →</span>
                </button>
              ) : (
                <p className="rounded-lg bg-ink-900/[0.03] px-3 py-2 text-[11px] text-ink-700/50">
                  {idea.bestFor} · Ask the concierge to plan this trip.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
