import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Badge, Button, Card, MockTag } from '@ayana/shared-ui';
import { formatDate, formatDateTime, formatINR } from '@ayana/shared-utils';
import { useHotelBookings } from '../hooks';

const COMMISSION_RATE = 0.12;

export function Finance() {
  const bookings = useHotelBookings();
  const guests = useSimulationStore((s) => s.guests);
  const transactions = useSimulationStore((s) => s.transactions);
  const invoices = useSimulationStore((s) => s.invoices);
  const refunds = useSimulationStore((s) => s.refunds);
  const issueRefund = useSimulationStore((s) => s.issueRefund);

  const [refundBookingId, setRefundBookingId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const bookingIds = new Set(bookings.map((b) => b.id));
  const guestById = new Map(guests.map((g) => [g.id, g]));
  const hotelTransactions = transactions.filter((t) => bookingIds.has(t.bookingId)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const hotelRefunds = refunds.filter((r) => bookingIds.has(r.bookingId));

  const totalRevenue = hotelTransactions.reduce((sum, t) => sum + t.amount, 0);
  const commission = Math.round(totalRevenue * COMMISSION_RATE);
  const settlement = totalRevenue - commission;

  const pendingBalances = bookings
    .map((b) => {
      const invoice = invoices.find((i) => i.bookingId === b.id);
      const outstanding = invoice ? invoice.outstandingBalance : b.totalAmount - b.amountPaid;
      return { booking: b, outstanding };
    })
    .filter((x) => x.outstanding > 0);

  const revenueByDay = useMemo(() => {
    const days: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const dayTotal = hotelTransactions
        .filter((t) => new Date(t.timestamp).toDateString() === d.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
      days.push({ date: label, revenue: dayTotal });
    }
    return days;
  }, [hotelTransactions]);

  function handleRefund() {
    const amount = Number(refundAmount);
    if (!refundBookingId || !amount || !refundReason) return;
    issueRefund(refundBookingId, amount, refundReason);
    setRefundBookingId('');
    setRefundAmount('');
    setRefundReason('');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Total Payments</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">{formatINR(totalRevenue)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Commission (12%)</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">{formatINR(commission)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Settlement Due to Hotel</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">{formatINR(settlement)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Pending Balances</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">{pendingBalances.length}</p>
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink-950">Revenue — Last 7 Days</h2>
          <MockTag />
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,22,38,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Bar dataKey="revenue" fill="#C6A15B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Pending Balances</h2>
        <div className="flex flex-col gap-2">
          {pendingBalances.length === 0 && <p className="text-sm text-ink-700/50">No outstanding balances.</p>}
          {pendingBalances.map(({ booking, outstanding }) => (
            <Card key={booking.id} className="flex items-center justify-between">
              <span className="text-sm text-ink-900">{guestById.get(booking.guestId)?.fullName}</span>
              <span className="text-sm font-medium text-ink-900">{formatINR(outstanding)}</span>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Recent Payments</h2>
        <div className="flex flex-col gap-1.5">
          {hotelTransactions.slice(0, 8).map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2 text-sm shadow-sm">
              <span className="text-ink-700/70">{t.method.replaceAll('_', ' ')} · {t.id}</span>
              <span className="font-medium text-ink-900">{formatINR(t.amount)}</span>
              <span className="text-xs text-ink-700/40">{formatDateTime(t.timestamp)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Refunds</h2>
        <Card className="mb-3 flex flex-wrap items-end gap-2">
          <select className="rounded-lg border border-ink-900/15 px-2 py-2 text-sm" value={refundBookingId} onChange={(e) => setRefundBookingId(e.target.value)}>
            <option value="">Select booking…</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {guestById.get(b.guestId)?.fullName} — {b.id}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            className="w-28 rounded-lg border border-ink-900/15 px-2 py-2 text-sm"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <input
            placeholder="Reason"
            className="flex-1 rounded-lg border border-ink-900/15 px-2 py-2 text-sm"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
          <Button size="sm" onClick={handleRefund}>Issue Refund</Button>
        </Card>
        <div className="flex flex-col gap-1.5">
          {hotelRefunds.length === 0 && <p className="text-sm text-ink-700/50">No refunds issued.</p>}
          {hotelRefunds.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2 text-sm shadow-sm">
              <span className="text-ink-700/70">{r.reason}</span>
              <Badge tone="warning">{formatINR(r.amount)}</Badge>
              <span className="text-xs text-ink-700/40">{formatDate(r.timestamp)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
