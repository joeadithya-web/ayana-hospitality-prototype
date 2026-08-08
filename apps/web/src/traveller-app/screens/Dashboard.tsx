import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import type { Booking, Hotel } from '@ayana/shared-types';
import { Avatar, Badge, Button, Card } from '@ayana/shared-ui';
import { formatDate } from '@ayana/shared-utils';
import { useCurrentGuest } from '../hooks';
import { TravellerShell } from '../TravellerShell';

export function Dashboard() {
  const navigate = useNavigate();
  const guest = useCurrentGuest();
  const bookings = useSimulationStore((s) => s.bookings);
  const hotels = useSimulationStore((s) => s.hotels);
  const notifications = useSimulationStore((s) => s.notifications);

  if (!guest) return null;

  const hotelById = new Map(hotels.map((h) => [h.id, h]));
  const myBookings = bookings.filter((b) => b.guestId === guest.id);
  // A stay stays "upcoming" right through the stay itself — it only drops off once its
  // checkout date has passed, so an un-checked-in booking never silently disappears.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcoming = myBookings
    .filter(
      (b) =>
        (b.status === 'confirmed' || b.status === 'pending_payment' || b.status === 'checked_in') &&
        new Date(b.checkOutDate) >= startOfToday,
    )
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
  const past = myBookings.filter((b) => b.status === 'checked_out').slice(0, 3);
  const unreadCount = notifications.filter((n) => n.guestId === guest.id && !n.read).length;

  const forYou = hotels
    .filter((h) => h.segment.includes(guest.memory.businessOrLeisure === 'leisure' ? 'leisure' : 'business'))
    .sort((a, b) => b.starRating - a.starRating)
    .slice(0, 3);

  return (
    <TravellerShell active="home">
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-3">
          <Avatar name={guest.fullName} />
          <div>
            <p className="text-xs text-ink-700/50">Welcome back,</p>
            <p className="font-display text-lg font-semibold text-ink-950">{guest.fullName.split(' ')[0]}</p>
          </div>
        </div>
        <button onClick={() => navigate('/traveller/notifications')} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-5 px-5 py-6">
        <Card className="bg-ink-950 text-cream-50">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gold-400">Loyalty Status</p>
            <Badge tone="gold">{guest.loyalty.tier}</Badge>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold">{guest.loyalty.points.toLocaleString('en-IN')} pts</p>
        </Card>

        <UpcomingStays bookings={upcoming} hotelById={hotelById} />


        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-ink-950">For You</h2>
          <div className="flex flex-col gap-3">
            {forYou.map((hotel) => (
              <Card key={hotel.id} className="flex cursor-pointer items-center gap-3" onClick={() => navigate(`/traveller/hotel/${hotel.id}`)}>
                <img src={hotel.images[0]} alt={hotel.name} className="h-14 w-14 flex-none rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{hotel.name}</p>
                  <p className="text-xs text-ink-700/50">{hotel.city} · {hotel.starRating}★</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Previous Stays</h2>
            <div className="flex flex-col gap-3">
              {past.map((booking) => (
                <Card key={booking.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{hotelById.get(booking.hotelId)?.name}</p>
                    <p className="text-xs text-ink-700/50">{formatDate(booking.checkInDate)}</p>
                  </div>
                  <button
                    className="text-xs font-medium text-gold-600"
                    onClick={() => navigate(`/traveller/hotel/${booking.hotelId}`)}
                  >
                    Rebook
                  </button>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Search', icon: '🔍', to: '/traveller/search' },
            { label: 'AYANA Memory', icon: '🧠', to: '/traveller/memory' },
            { label: 'Support', icon: '💬', to: '/traveller/support' },
          ].map((action) => (
            <button key={action.label} onClick={() => navigate(action.to)} className="flex flex-col items-center gap-1.5 rounded-xl2 bg-white p-3 text-center shadow-sm">
              <span className="text-xl">{action.icon}</span>
              <span className="text-[11px] font-medium text-ink-700/70">{action.label}</span>
            </button>
          ))}
        </section>
      </div>
    </TravellerShell>
  );
}

function UpcomingStays({ bookings, hotelById }: { bookings: Booking[]; hotelById: Map<string, Hotel> }) {
  const navigate = useNavigate();
  const cancelBooking = useSimulationStore((s) => s.cancelBooking);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function scrollTo(next: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(bookings.length - 1, next));
    // Cards are gap-separated, so derive the offset from the child rather than card width.
    const child = el.children[clamped] as HTMLElement | undefined;
    el.scrollTo({ left: child ? child.offsetLeft - el.offsetLeft : 0, behavior: 'smooth' });
    setIndex(clamped);
  }

  function open(b: Booking) {
    if (b.status === 'pending_payment') navigate(`/traveller/payment/${b.id}`);
    else if (b.status === 'checked_in') navigate(`/traveller/stay/${b.id}`);
    else navigate(`/traveller/ready/${b.id}`);
  }

  if (bookings.length === 0) {
    return (
      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Upcoming Stays</h2>
        <Card className="cursor-pointer text-center text-sm text-ink-700/60" onClick={() => navigate('/traveller/search')}>
          No upcoming stay yet — search hotels to plan your next trip.
        </Card>
      </section>
    );
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink-950">
          Upcoming Stays{bookings.length > 1 && <span className="ml-1.5 text-xs text-ink-700/40">({bookings.length})</span>}
        </h2>
        {bookings.length > 1 && (
          <div className="flex gap-1.5">
            <button
              aria-label="Previous stay"
              disabled={index === 0}
              onClick={() => scrollTo(index - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-900 shadow-sm disabled:opacity-30"
            >
              ‹
            </button>
            <button
              aria-label="Next stay"
              disabled={index >= bookings.length - 1}
              onClick={() => scrollTo(index + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-900 shadow-sm disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollerRef}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {bookings.map((b) => {
          const stayStarted = new Date(b.checkInDate) <= new Date() && b.status !== 'checked_in';
          return (
            <div key={b.id} className="w-full flex-none snap-center">
              <Card className="cursor-pointer" onClick={() => open(b)}>
                <p className="font-medium text-ink-900">{hotelById.get(b.hotelId)?.name}</p>
                <p className="text-sm text-ink-700/60">
                  {formatDate(b.checkInDate)} — {formatDate(b.checkOutDate)}
                </p>
                <Badge
                  tone={b.status === 'checked_in' ? 'success' : b.status === 'confirmed' ? 'gold' : 'warning'}
                >
                  {b.status === 'checked_in' ? 'In stay' : b.status === 'confirmed' ? 'Confirmed' : 'Awaiting payment'}
                </Badge>

                {stayStarted && (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-800">Your stay has started — you haven’t checked in yet</p>
                    <p className="mt-0.5 text-[11px] text-amber-700/80">
                      Check in at the hotel kiosk, or cancel if your plans have changed.
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          open(b);
                        }}
                      >
                        Remind me how to check in
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelBooking(b.id, 'guest', 'Cancelled by guest from Upcoming Stays');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Always reachable — changing or cancelling is not limited to arrival day. */}
                <button
                  className="mt-2.5 w-full rounded-lg border border-ink-900/15 py-2 text-xs font-medium text-ink-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/traveller/manage/${b.id}`);
                  }}
                >
                  Manage / Cancel Booking
                </button>
              </Card>
            </div>
          );
        })}
      </div>

      {bookings.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {bookings.map((b, i) => (
            <span
              key={b.id}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-gold-500' : 'w-1.5 bg-ink-900/20'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
