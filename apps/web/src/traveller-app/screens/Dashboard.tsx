import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Avatar, Badge, Card } from '@ayana/shared-ui';
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
  const now = new Date();
  const upcoming = myBookings
    .filter((b) => (b.status === 'confirmed' || b.status === 'pending_payment') && new Date(b.checkInDate) >= now)
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime())[0];
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

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Upcoming Stay</h2>
          {upcoming ? (
            <Card
              className="cursor-pointer"
              onClick={() =>
                navigate(
                  upcoming.status === 'pending_payment'
                    ? `/traveller/payment/${upcoming.id}`
                    : `/traveller/ready/${upcoming.id}`,
                )
              }
            >
              <p className="font-medium text-ink-900">{hotelById.get(upcoming.hotelId)?.name}</p>
              <p className="text-sm text-ink-700/60">
                {formatDate(upcoming.checkInDate)} — {formatDate(upcoming.checkOutDate)}
              </p>
              <Badge tone={upcoming.status === 'confirmed' ? 'success' : 'warning'}>
                {upcoming.status === 'confirmed' ? 'Confirmed' : 'Awaiting payment'}
              </Badge>
            </Card>
          ) : (
            <Card className="cursor-pointer text-center text-sm text-ink-700/60" onClick={() => navigate('/traveller/search')}>
              No upcoming stay yet — search hotels to plan your next trip.
            </Card>
          )}
        </section>

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
