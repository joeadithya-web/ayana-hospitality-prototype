import { useMemo, useState } from 'react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { categoryAvailability } from '@ayana/ai-engine';
import type { Booking, RoomCategory } from '@ayana/shared-types';
import { Badge, Button, Card, Sheet } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { useCurrentStaff, useHotelBookings, useHotelRooms } from '../hooks';
import { useSelectedHotelId } from '../HotelContext';

const STATUS_TONE = {
  pending_payment: 'warning',
  confirmed: 'gold',
  checked_in: 'success',
  checked_out: 'neutral',
  cancelled: 'danger',
  rejected: 'danger',
} as const;

const ALLOCATION_TONE = {
  pending: 'neutral',
  delayed: 'warning',
  overbooked: 'danger',
  allocated: 'success',
} as const;

const EMPTY_WALK_IN = { fullName: '', email: '', mobile: '', roomCategory: '' as RoomCategory | '', nights: 1, guestsCount: 1 };

export function FrontOffice() {
  const staff = useCurrentStaff();
  const { hotelId } = useSelectedHotelId();
  const bookings = useHotelBookings();
  const rooms = useHotelRooms();
  const guests = useSimulationStore((s) => s.guests);
  const invoices = useSimulationStore((s) => s.invoices);
  const overrideLog = useSimulationStore((s) => s.overrideLog);

  const manualCheckIn = useSimulationStore((s) => s.manualCheckIn);
  const manualCheckout = useSimulationStore((s) => s.manualCheckout);
  const overridePayment = useSimulationStore((s) => s.overridePayment);
  const reissueKey = useSimulationStore((s) => s.reissueKey);
  const assignRoom = useSimulationStore((s) => s.assignRoom);
  const updateReadyToRoom = useSimulationStore((s) => s.updateReadyToRoom);
  const cancelBooking = useSimulationStore((s) => s.cancelBooking);
  const createWalkIn = useSimulationStore((s) => s.createWalkIn);

  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkIn, setWalkIn] = useState(EMPTY_WALK_IN);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  const guestById = new Map(guests.map((g) => [g.id, g]));
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const readyRooms = rooms.filter((r) => r.status === 'ready');
  const categories = Array.from(new Set(rooms.map((r) => r.category)));

  function submitWalkIn() {
    if (!walkIn.fullName.trim() || !walkIn.roomCategory) {
      setWalkInError('Name and room category are required.');
      return;
    }
    const checkInDate = new Date().toISOString();
    const checkOutDate = new Date(Date.now() + walkIn.nights * 86_400_000).toISOString();
    const availability = categoryAvailability(hotelId, walkIn.roomCategory, checkInDate, checkOutDate, rooms, bookings);
    if (availability.availableRooms <= 0) {
      setWalkInError(`No ${walkIn.roomCategory} rooms available for tonight — try another category.`);
      return;
    }
    createWalkIn({
      fullName: walkIn.fullName.trim(),
      email: walkIn.email.trim(),
      mobile: walkIn.mobile.trim(),
      hotelId,
      roomCategory: walkIn.roomCategory,
      checkInDate,
      checkOutDate,
      guestsCount: walkIn.guestsCount,
    });
    setWalkIn(EMPTY_WALK_IN);
    setWalkInError(null);
    setWalkInOpen(false);
  }

  const active = useMemo(
    () => bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'rejected').sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()),
    [bookings],
  );

  const receiptInvoice = receiptBooking ? invoices.find((i) => i.bookingId === receiptBooking.id) : null;
  const hotelOverrides = overrideLog.filter((o) => bookings.some((b) => b.id === o.bookingId)).slice(-8).reverse();

  if (!staff) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink-950">In-House &amp; Upcoming</h2>
        <Button size="sm" onClick={() => setWalkInOpen(true)}>
          + New Walk-in
        </Button>
      </div>

      <Card padded={false} className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-700/50">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.map((booking) => {
              const guest = guestById.get(booking.guestId);
              const room = booking.roomId ? roomById.get(booking.roomId) : undefined;
              if (!guest) return null;
              const roomsForReassign = readyRooms.filter((r) => r.category === booking.roomCategory);
              const reassignOptions = roomsForReassign.length > 0 ? roomsForReassign : readyRooms;

              return (
                <tr key={booking.id} className="border-t border-ink-900/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{guest.fullName}</p>
                    {guest.isVip && <Badge tone="gold">VIP</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    {room ? (
                      <span>{room.roomNumber}</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize text-ink-700/70">{booking.roomCategory}</span>
                        <Badge tone={ALLOCATION_TONE[booking.allocationStatus]}>{booking.allocationStatus}</Badge>
                      </div>
                    )}
                    {reassigning === booking.id && (
                      <select
                        className="ml-2 mt-1 rounded border border-ink-900/15 px-1.5 py-1 text-xs"
                        onChange={(e) => {
                          assignRoom(
                            booking.id,
                            e.target.value,
                            staff.id,
                            room ? 'Reassigned via Front Office' : 'Manually allocated via Front Office',
                          );
                          setReassigning(null);
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {room ? 'Move to…' : 'Allocate…'}
                        </option>
                        {reassignOptions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.roomNumber} · {r.category}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700/60">
                    {formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[booking.status]}>{booking.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className={booking.readyToRoom.identityVerified ? 'text-springs-600' : 'text-ink-700/40'}>
                        ID {booking.readyToRoom.identityVerified ? '✓' : '—'}
                      </span>
                      <span className={booking.readyToRoom.paymentVerified ? 'text-springs-600' : 'text-ink-700/40'}>
                        Payment {booking.readyToRoom.paymentVerified ? '✓' : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {!booking.readyToRoom.identityVerified && (
                        <button className="btn-mini" onClick={() => updateReadyToRoom(booking.id, { identityVerified: true })}>
                          Verify ID
                        </button>
                      )}
                      {!booking.readyToRoom.paymentVerified && (
                        <button className="btn-mini" onClick={() => overridePayment(booking.id, staff.id, 'Front Office override')}>
                          Override Payment
                        </button>
                      )}
                      {booking.status !== 'checked_in' && booking.status !== 'checked_out' && (
                        <button className="btn-mini" onClick={() => manualCheckIn(booking.id, staff.id)}>
                          Check-in
                        </button>
                      )}
                      {booking.status === 'checked_in' && (
                        <button className="btn-mini" onClick={() => manualCheckout(booking.id, staff.id)}>
                          Checkout
                        </button>
                      )}
                      <button className="btn-mini" onClick={() => setReassigning(booking.id)}>
                        {room ? 'Change Room' : 'Allocate Room'}
                      </button>
                      {room && (
                        <button className="btn-mini" onClick={() => reissueKey(booking.id, staff.id)}>
                          Reissue Key
                        </button>
                      )}
                      <button className="btn-mini" onClick={() => setReceiptBooking(booking)}>
                        Receipt
                      </button>
                      {(booking.status === 'pending_payment' || booking.status === 'confirmed') && (
                        <button
                          className="btn-mini !bg-red-500/10 !text-red-700"
                          onClick={() => cancelBooking(booking.id, staff.id, 'Cancelled via Front Office')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Recent Overrides</h2>
        <div className="flex flex-col gap-1.5">
          {hotelOverrides.length === 0 && <p className="text-sm text-ink-700/50">No overrides logged yet.</p>}
          {hotelOverrides.map((o) => (
            <div key={o.id} className="flex justify-between rounded-lg bg-white px-4 py-2 text-xs text-ink-700/70 shadow-sm">
              <span>{o.action.replaceAll('_', ' ')} — {o.reason}</span>
              <span className="text-ink-700/40">{formatDate(o.timestamp)}</span>
            </div>
          ))}
        </div>
      </section>

      <Sheet open={!!receiptBooking} onClose={() => setReceiptBooking(null)} title="Receipt">
        {receiptBooking && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-700/60">{guestById.get(receiptBooking.guestId)?.fullName}</p>
            {(receiptInvoice?.lineItems ?? [{ id: 'r', description: 'Room charges', amount: receiptBooking.totalAmount }]).map((li) => (
              <div key={li.id} className="flex justify-between text-sm">
                <span>{li.description}</span>
                <span>{formatINR(li.amount)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-ink-900/10 pt-2 font-medium">
              <span>Total</span>
              <span>{formatINR(receiptInvoice?.totalAmount ?? receiptBooking.totalAmount)}</span>
            </div>
            <Badge tone="neutral">Simulated receipt — no real transaction</Badge>
          </div>
        )}
      </Sheet>

      <Sheet
        open={walkInOpen}
        onClose={() => {
          setWalkInOpen(false);
          setWalkInError(null);
        }}
        title="New Walk-in"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-ink-700/50">
            A guest with no AYANA account and no reservation, booked and paid on the spot — the same as anyone who
            downloads the app and signs up, just done by you.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Full name</span>
            <input
              className="rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
              value={walkIn.fullName}
              onChange={(e) => setWalkIn((w) => ({ ...w, fullName: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Email (optional)</span>
            <input
              className="rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
              value={walkIn.email}
              onChange={(e) => setWalkIn((w) => ({ ...w, email: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Mobile (optional)</span>
            <input
              className="rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
              value={walkIn.mobile}
              onChange={(e) => setWalkIn((w) => ({ ...w, mobile: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Room category</span>
            <select
              className="rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
              value={walkIn.roomCategory}
              onChange={(e) => setWalkIn((w) => ({ ...w, roomCategory: e.target.value as RoomCategory }))}
            >
              <option value="" disabled>
                Select…
              </option>
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Guests</span>
              <input
                type="number"
                min={1}
                max={6}
                className="rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
                value={walkIn.guestsCount}
                onChange={(e) => setWalkIn((w) => ({ ...w, guestsCount: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Nights</span>
              <input
                type="number"
                min={1}
                max={14}
                className="rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
                value={walkIn.nights}
                onChange={(e) => setWalkIn((w) => ({ ...w, nights: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </label>
          </div>
          {walkInError && <Badge tone="danger">{walkInError}</Badge>}
          <Badge tone="neutral">Paid on the spot — simulated, no real charge</Badge>
          <Button fullWidth onClick={submitWalkIn}>
            Register &amp; Book
          </Button>
        </div>
      </Sheet>

      <style>{`.btn-mini { border-radius: 0.375rem; background: rgba(15,22,38,0.06); padding: 0.3rem 0.55rem; font-size: 0.72rem; font-weight: 500; color: #0F1626; }`}</style>
    </div>
  );
}
