import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Card, MockTag } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';
import { useHotelBookings, useHotelHousekeepingTasks, useHotelRooms } from '../hooks';
import { useSelectedHotelId } from '../HotelContext';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function Reports() {
  const { hotelId } = useSelectedHotelId();
  const bookings = useHotelBookings();
  const rooms = useHotelRooms();
  const tasks = useHotelHousekeepingTasks();
  const guests = useSimulationStore((s) => s.guests);
  const invoices = useSimulationStore((s) => s.invoices);
  const transactions = useSimulationStore((s) => s.transactions);
  const feedback = useSimulationStore((s) => s.feedback);
  const activityLog = useSimulationStore((s) => s.activityLog);

  const guestById = new Map(guests.map((g) => [g.id, g]));
  const bookingIds = new Set(bookings.map((b) => b.id));

  const trend = useMemo(() => {
    const days: { date: string; occupancy: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = daysAgo(i);
      const label = day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const occupied = bookings.filter(
        (b) =>
          (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out') &&
          new Date(b.checkInDate) <= day &&
          day < new Date(b.checkOutDate),
      ).length;
      const occupancy = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;
      const revenue = transactions
        .filter((t) => bookingIds.has(t.bookingId) && new Date(t.timestamp).toDateString() === day.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
      days.push({ date: label, occupancy, revenue });
    }
    return days;
  }, [bookings, rooms, transactions, bookingIds]);

  const hotelFeedback = feedback.filter((f) => f.hotelId === hotelId);
  const avgSatisfaction = hotelFeedback.length > 0 ? hotelFeedback.reduce((s, f) => s + f.rating, 0) / hotelFeedback.length : null;

  const activeBookings = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'rejected');
  const repeatCount = activeBookings.filter((b) => guestById.get(b.guestId)?.isReturning).length;
  const repeatRate = activeBookings.length > 0 ? Math.round((repeatCount / activeBookings.length) * 100) : 0;

  const hotelInvoices = invoices.filter((i) => bookingIds.has(i.bookingId));
  const upsellRevenue = hotelInvoices.reduce(
    (sum, inv) => sum + inv.lineItems.filter((li) => li.category === 'add_on').reduce((s, li) => s + li.amount, 0),
    0,
  );
  const outstandingCount = hotelInvoices.filter((i) => i.outstandingBalance > 0).length;
  const outstandingTotal = hotelInvoices.reduce((sum, i) => sum + i.outstandingBalance, 0);

  const doneTasks = tasks.filter((t) => t.status === 'done' && t.completedAt);
  const hkPerformance = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : null;
  const avgHkMinutes =
    doneTasks.length > 0
      ? Math.round(doneTasks.reduce((sum, t) => sum + (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()), 0) / doneTasks.length / 60000)
      : null;

  const checkInTimes = activeBookings
    .map((b) => {
      const paid = activityLog.find((a) => a.bookingId === b.id && a.label === 'Payment received');
      const entered = activityLog.find((a) => a.bookingId === b.id && a.label === 'Guest entered room');
      if (!paid || !entered) return null;
      return (new Date(entered.timestamp).getTime() - new Date(paid.timestamp).getTime()) / 60000;
    })
    .filter((v): v is number => v !== null && v >= 0);
  const avgCheckInMinutes = checkInTimes.length > 0 ? Math.round(checkInTimes.reduce((s, v) => s + v, 0) / checkInTimes.length) : null;

  const stats = [
    { label: 'Guest Satisfaction', value: avgSatisfaction !== null ? `${avgSatisfaction.toFixed(1)} ★` : 'No data yet', sub: `${hotelFeedback.length} reviews` },
    { label: 'Repeat Guest Rate', value: `${repeatRate}%`, sub: `${repeatCount} of ${activeBookings.length} bookings` },
    { label: 'Upsell Revenue', value: formatINR(upsellRevenue), sub: 'From add-on charges' },
    { label: 'Outstanding Balances', value: outstandingCount, sub: formatINR(outstandingTotal) },
    { label: 'Housekeeping Performance', value: hkPerformance !== null ? `${hkPerformance}%` : 'No data yet', sub: avgHkMinutes !== null ? `Avg ${avgHkMinutes} min to complete` : 'No completed tasks yet' },
    { label: 'Avg Check-in Time', value: avgCheckInMinutes !== null ? `${avgCheckInMinutes} min` : 'No data yet', sub: 'Payment verified → room entered' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xs uppercase tracking-wide text-ink-700/50">{s.label}</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink-950">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-ink-700/40">{s.sub}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink-950">Occupancy — Last 7 Days</h2>
          <MockTag />
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,22,38,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="occupancy" stroke="#2F6F62" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
