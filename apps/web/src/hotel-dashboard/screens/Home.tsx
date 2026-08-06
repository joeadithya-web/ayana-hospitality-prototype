import { useMemo } from 'react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { generateOperationsAlerts } from '@ayana/ai-engine';
import { Badge, Card } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';
import { useHotelBookings, useHotelConciergeRequests, useHotelRooms } from '../hooks';
import { useSelectedHotelId } from '../HotelContext';

const TODAY = new Date();
function isToday(iso: string) {
  return new Date(iso).toDateString() === TODAY.toDateString();
}

const ALERT_LABEL: Record<string, string> = {
  vip_guest: 'VIP Guest',
  late_arrival: 'Late Arrival',
  overbooking_warning: 'Overbooking',
  housekeeping_delay: 'Housekeeping Delay',
  repeat_guest: 'Repeat Guest',
  upsell_opportunity: 'Upsell Opportunity',
};

export function Home() {
  const { hotelId } = useSelectedHotelId();
  const bookings = useHotelBookings();
  const rooms = useHotelRooms();
  const guests = useSimulationStore((s) => s.guests);
  const transactions = useSimulationStore((s) => s.transactions);
  const conciergeRequests = useHotelConciergeRequests();

  const arrivals = bookings.filter((b) => isToday(b.checkInDate) && b.status !== 'cancelled' && b.status !== 'rejected');
  const departures = bookings.filter((b) => isToday(b.checkOutDate) && (b.status === 'checked_in' || b.status === 'checked_out'));
  const occupied = rooms.filter((r) => r.status === 'occupied').length;
  const occupancy = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;
  const roomsUnderCleaning = rooms.filter((r) => r.status === 'cleaning' || r.status === 'dirty').length;
  const pendingCheckIns = arrivals.filter((b) => b.status === 'confirmed').length;
  const pendingCheckOuts = bookings.filter((b) => b.status === 'checked_in').length;
  const revenueToday = transactions
    .filter((t) => isToday(t.timestamp) && bookings.some((b) => b.id === t.bookingId))
    .reduce((sum, t) => sum + t.amount, 0);
  const openRequests = conciergeRequests.filter((r) => r.status === 'requested' || r.status === 'in_progress').length;

  const alerts = useMemo(() => generateOperationsAlerts(bookings, guests, rooms).filter((a) => a.hotelId === hotelId), [bookings, guests, rooms, hotelId]);

  const stats = [
    { label: "Today's Arrivals", value: arrivals.length },
    { label: "Today's Departures", value: departures.length },
    { label: 'Occupancy', value: `${occupancy}%` },
    { label: 'Rooms Under Cleaning', value: roomsUnderCleaning },
    { label: 'Pending Check-ins', value: pendingCheckIns },
    { label: 'Pending Check-outs', value: pendingCheckOuts },
    { label: 'Revenue Today', value: formatINR(revenueToday) },
    { label: 'Open Guest Requests', value: openRequests },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xs uppercase tracking-wide text-ink-700/50">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink-950">{s.value}</p>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink-950">AI Alerts</h2>
        {alerts.length === 0 ? (
          <Card className="text-sm text-ink-700/50">No active alerts.</Card>
        ) : (
          <div className="flex flex-col gap-2">
            {alerts.map((a) => (
              <Card key={a.id} className="flex items-center justify-between">
                <span className="text-sm text-ink-900">{a.message}</span>
                <Badge tone={a.type === 'overbooking_warning' || a.type === 'housekeeping_delay' ? 'warning' : 'gold'}>
                  {ALERT_LABEL[a.type]}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
