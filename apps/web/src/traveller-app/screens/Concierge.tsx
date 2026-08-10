import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import type { ConciergeRequestType } from '@ayana/shared-types';
import { recommendConcierge, recommendDining, recommendTransport } from '@ayana/ai-engine';
import { AnaIqMark, Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { useBooking, useCurrentGuest, useHotel } from '../hooks';

const REQUEST_TYPES: { type: ConciergeRequestType; label: string; icon: string }[] = [
  { type: 'airport_pickup', label: 'Airport Pickup', icon: '🚗' },
  { type: 'taxi', label: 'Taxi', icon: '🚕' },
  { type: 'restaurant_booking', label: 'Restaurant Booking', icon: '🍽️' },
  { type: 'wake_up_call', label: 'Wake-up Call', icon: '⏰' },
  { type: 'special_request', label: 'Special Request', icon: '✨' },
];

export function Concierge() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(bookingId);
  const hotel = useHotel(booking?.hotelId);
  const guest = useCurrentGuest();
  const conciergeRequests = useSimulationStore((s) => s.conciergeRequests);
  const requestConcierge = useSimulationStore((s) => s.requestConcierge);
  const [confirmed, setConfirmed] = useState<ConciergeRequestType | null>(null);

  if (!booking || !hotel || !guest) return null;

  const myRequests = conciergeRequests.filter((r) => r.bookingId === booking.id);
  const dining = recommendDining(guest.memory, hotel.city);
  const transport = recommendTransport(guest.memory);
  const concierge = recommendConcierge(guest.memory, guest.isVip);

  function handleRequest(type: ConciergeRequestType, details: string) {
    requestConcierge({ bookingId: booking!.id, guestId: guest!.id, hotelId: hotel!.id, type, details });
    setConfirmed(type);
    setTimeout(() => setConfirmed(null), 2000);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Concierge" subtitle={hotel.name} onBack={() => navigate(-1)} />

        <div className="flex flex-col gap-5 px-5">
          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Quick Requests</h2>
            <div className="grid grid-cols-2 gap-2">
              {REQUEST_TYPES.map((r) => (
                <Card key={r.type} className="flex flex-col items-start gap-1">
                  <span className="text-lg">{r.icon}</span>
                  <p className="text-sm font-medium text-ink-900">{r.label}</p>
                  <button
                    className="mt-1 w-full rounded-lg bg-ink-900/5 py-1.5 text-xs font-medium text-ink-900"
                    onClick={() => handleRequest(r.type, r.label)}
                  >
                    {confirmed === r.type ? 'Requested ✓' : 'Request'}
                  </button>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink-950">Dining Suggestions</h2>
              <AnaIqMark />
            </div>
            <div className="flex flex-col gap-2">
              {dining.map((d) => (
                <Card key={d.id}>
                  <p className="text-sm font-medium text-ink-900">{d.title}</p>
                  <p className="text-xs text-ink-700/60">{d.description}</p>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Transport</h2>
            <div className="flex flex-col gap-2">
              {transport.map((t) => (
                <Card key={t.id}>
                  <p className="text-sm font-medium text-ink-900">{t.title}</p>
                  <p className="text-xs text-ink-700/60">{t.description}</p>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Concierge Services</h2>
            <div className="flex flex-col gap-2">
              {concierge.map((c) => (
                <Card key={c.id}>
                  <p className="text-sm font-medium text-ink-900">{c.title}</p>
                  <p className="text-xs text-ink-700/60">{c.description}</p>
                </Card>
              ))}
            </div>
          </section>

          {myRequests.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Your Requests</h2>
              <div className="flex flex-col gap-2">
                {myRequests.map((r) => (
                  <Card key={r.id} className="flex items-center justify-between">
                    <span className="text-sm text-ink-900">{r.details}</span>
                    <Badge tone="gold">{r.status}</Badge>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
