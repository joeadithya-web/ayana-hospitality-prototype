import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { intentTemplateById } from '@ayana/ai-engine';
import { Badge, Card, EmptyState, PageHeader } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { useCurrentGuest } from '../hooks';
import { TravellerShell } from '../TravellerShell';

const STATUS_TONE = {
  pending_payment: 'warning',
  confirmed: 'gold',
  checked_in: 'success',
  checked_out: 'neutral',
  cancelled: 'danger',
  rejected: 'danger',
} as const;

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  checked_in: 'In stay',
  checked_out: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export function MyTrips() {
  const navigate = useNavigate();
  const guest = useCurrentGuest();
  const bookings = useSimulationStore((s) => s.bookings);
  const hotels = useSimulationStore((s) => s.hotels);

  if (!guest) return null;
  const hotelById = new Map(hotels.map((h) => [h.id, h]));
  const mine = bookings
    .filter((b) => b.guestId === guest.id)
    .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  // A group booking is many rooms but one trip — collapse it to the lead room and count
  // the rest, rather than showing the guest eight near-identical cards.
  const groupSizes = new Map<string, number>();
  mine.forEach((b) => {
    if (b.groupRef) groupSizes.set(b.groupRef, (groupSizes.get(b.groupRef) ?? 0) + 1);
  });
  const seenGroups = new Set<string>();
  const myBookings = mine.filter((b) => {
    if (!b.groupRef) return true;
    if (seenGroups.has(b.groupRef)) return false;
    seenGroups.add(b.groupRef);
    return true;
  });

  function goTo(bookingId: string, status: string) {
    if (status === 'pending_payment') navigate(`/traveller/payment/${bookingId}`);
    else if (status === 'confirmed') navigate(`/traveller/ready/${bookingId}`);
    else if (status === 'checked_in') navigate(`/traveller/stay/${bookingId}`);
    else navigate(`/traveller/checkout/${bookingId}`);
  }

  return (
    <TravellerShell active="trips">
      <PageHeader title="My Trips" />
      <div className="flex flex-col gap-3 px-5 pb-6">
        {myBookings.length === 0 && (
          <EmptyState icon="🧳" title="No trips yet" description="Search hotels to plan your first AYANA journey." />
        )}
        {myBookings.map((booking) => {
          const nights = Math.max(
            1,
            Math.round(
              (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86_400_000,
            ),
          );
          const balanceDue = Math.max(0, booking.totalAmount - booking.amountPaid);
          const upcoming = booking.status === 'confirmed' || booking.status === 'pending_payment';
          const inHouse = booking.status === 'checked_in';
          // Changes stay possible right up to checkout — never only on the day of arrival.
          const manageable = upcoming || inHouse;

          return (
            <Card key={booking.id} className="cursor-pointer" onClick={() => goTo(booking.id, booking.status)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-ink-900">{hotelById.get(booking.hotelId)?.name}</p>
                  <p className="text-xs text-ink-700/50">
                    {formatDate(booking.checkInDate)} — {formatDate(booking.checkOutDate)} · {nights} night
                    {nights === 1 ? '' : 's'}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[booking.status]}>{STATUS_LABEL[booking.status]}</Badge>
              </div>

              {(booking.groupRef || booking.corporateId || booking.intents.length > 0) && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {booking.groupRef && (
                    <Badge tone="gold">
                      👥 Group · {groupSizes.get(booking.groupRef) ?? 1} rooms
                    </Badge>
                  )}
                  {booking.corporateId && <Badge tone="neutral">🏢 Corporate account</Badge>}
                  {booking.intents.length > 0 && (
                    <Badge tone="springs">
                      🎯 {intentTemplateById(booking.intents.find((i) => i.role === 'primary')?.templateId ?? '')?.label ?? 'Journey'}
                    </Badge>
                  )}
                </div>
              )}

              {upcoming && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-ink-900/10 pt-2.5">
                  <Badge tone="neutral">
                    <span className="capitalize">{booking.roomCategory}</span>
                  </Badge>
                  {booking.readyToRoom.qrCode ? (
                    <Badge tone="success">Key / QR ready</Badge>
                  ) : (
                    <Badge tone="warning">Key not issued yet</Badge>
                  )}
                  {balanceDue > 0 && <Badge tone="warning">{formatINR(balanceDue)} due at check-in</Badge>}
                </div>
              )}

              {inHouse && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-ink-900/10 pt-2.5">
                  <Badge tone="neutral">
                    <span className="capitalize">{booking.roomCategory}</span>
                  </Badge>
                  {balanceDue > 0 ? (
                    <Badge tone="warning">{formatINR(balanceDue)} on your bill</Badge>
                  ) : (
                    <Badge tone="success">Bill settled</Badge>
                  )}
                </div>
              )}

              {manageable && (
                <div className="mt-2.5 flex gap-2">
                  <button
                    className="flex-1 rounded-lg bg-ink-900/5 py-2 text-xs font-medium text-ink-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(booking.id, booking.status);
                    }}
                  >
                    {inHouse ? 'View Stay' : 'View Booking'}
                  </button>
                  <button
                    className="flex-1 rounded-lg border border-ink-900/15 py-2 text-xs font-medium text-ink-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/traveller/manage/${booking.id}`);
                    }}
                  >
                    Manage / Cancel
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </TravellerShell>
  );
}
