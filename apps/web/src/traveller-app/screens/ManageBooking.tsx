import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { CATEGORY_LABEL, nightsBetween, quoteCancellation, upgradeOffers } from '@ayana/ai-engine';
import type { RoomCategory } from '@ayana/shared-types';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { useBooking, useHotel } from '../hooks';

type Panel = 'none' | 'dates' | 'upgrade' | 'cancel';

function toDateInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * Everything a guest can change about a booking themselves: dates and party size, moving
 * up a room category (including mid-stay), or cancelling. Cancellation is available at any
 * point before the stay starts — never only on the day of arrival — and always shows the
 * refund the hotel's policy actually gives before anything is confirmed.
 */
export function ManageBooking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(bookingId);
  const hotel = useHotel(booking?.hotelId);
  const rooms = useSimulationStore((s) => s.rooms);
  const bookings = useSimulationStore((s) => s.bookings);
  const modifyBooking = useSimulationStore((s) => s.modifyBooking);
  const requestRoomUpgrade = useSimulationStore((s) => s.requestRoomUpgrade);
  const cancelBookingByGuest = useSimulationStore((s) => s.cancelBookingByGuest);

  const [panel, setPanel] = useState<Panel>('none');
  const [checkIn, setCheckIn] = useState(() => (booking ? toDateInput(booking.checkInDate) : ''));
  const [checkOut, setCheckOut] = useState(() => (booking ? toDateInput(booking.checkOutDate) : ''));
  const [guests, setGuests] = useState(booking?.guestsCount ?? 1);
  const [chosenUpgrade, setChosenUpgrade] = useState<RoomCategory | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const occupiedRoomIds = useMemo(
    () => new Set(bookings.filter((b) => b.status === 'checked_in' && b.roomId).map((b) => b.roomId as string)),
    [bookings],
  );

  if (!booking || !hotel) return null;

  const inHouse = booking.status === 'checked_in';
  const closed = booking.status === 'cancelled' || booking.status === 'checked_out';
  const quote = quoteCancellation(booking);

  // Mid-stay upgrades are priced only for the nights that are actually left.
  const nightsTotal = nightsBetween(booking.checkInDate, booking.checkOutDate);
  const nightsRemaining = inHouse
    ? Math.max(1, Math.round((new Date(booking.checkOutDate).getTime() - Date.now()) / 86_400_000))
    : nightsTotal;
  const offers = upgradeOffers(rooms, booking.hotelId, booking.roomCategory, nightsRemaining, occupiedRoomIds);

  const newNights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : nightsTotal;
  const nightlyRate = Math.round(booking.totalAmount / nightsTotal);
  const dateDelta = nightlyRate * (newNights - nightsTotal);
  const datesChanged =
    checkIn !== toDateInput(booking.checkInDate) ||
    checkOut !== toDateInput(booking.checkOutDate) ||
    guests !== booking.guestsCount;

  if (done) {
    return (
      <div className="min-h-screen bg-cream-50">
        <div className="mx-auto max-w-md">
          <PageHeader title="Manage Booking" subtitle={hotel.name} onBack={() => navigate('/traveller/trips')} />
          <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-springs-500 text-2xl text-white">✓</span>
            <p className="text-sm text-ink-800">{done}</p>
            <Button fullWidth onClick={() => navigate('/traveller/trips')}>
              Back to My Trips
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Manage Booking" subtitle={hotel.name} onBack={() => navigate(-1)} />

        <div className="flex flex-col gap-4 px-5">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium capitalize text-ink-900">{booking.roomCategory} room</p>
                <p className="mt-0.5 text-xs text-ink-700/60">
                  {formatDate(booking.checkInDate)} — {formatDate(booking.checkOutDate)} · {nightsTotal} night
                  {nightsTotal === 1 ? '' : 's'} · {booking.guestsCount} guest{booking.guestsCount === 1 ? '' : 's'}
                </p>
              </div>
              <Badge tone={inHouse ? 'success' : closed ? 'neutral' : 'gold'}>
                {inHouse ? 'In stay' : closed ? booking.status.replace('_', ' ') : 'Confirmed'}
              </Badge>
            </div>
            <div className="mt-2.5 flex justify-between border-t border-ink-900/10 pt-2.5 text-xs">
              <span className="text-ink-700/60">Paid so far</span>
              <span className="font-medium text-ink-900">{formatINR(booking.amountPaid)} of {formatINR(booking.totalAmount)}</span>
            </div>
          </Card>

          {closed ? (
            <Card className="text-center text-sm text-ink-700/60">
              This booking is {booking.status.replace('_', ' ')} and can no longer be changed.
            </Card>
          ) : (
            <>
              {/* Change dates / guests */}
              <Card>
                <button className="flex w-full items-center justify-between" onClick={() => setPanel(panel === 'dates' ? 'none' : 'dates')}>
                  <span className="text-left">
                    <span className="block text-sm font-medium text-ink-900">Change dates or guests</span>
                    <span className="block text-xs text-ink-700/50">
                      {inHouse ? 'Extend or shorten your remaining stay' : 'Shift your stay or update the party size'}
                    </span>
                  </span>
                  <span className="text-xs text-gold-600">{panel === 'dates' ? '▲' : '▼'}</span>
                </button>

                {panel === 'dates' && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-ink-900/10 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-700/50">Check-in</span>
                        <input
                          type="date"
                          className="rounded-lg border border-ink-900/15 px-2.5 py-2 text-sm disabled:bg-ink-900/5 disabled:text-ink-700/40"
                          value={checkIn}
                          disabled={inHouse}
                          onChange={(e) => setCheckIn(e.target.value)}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-700/50">Check-out</span>
                        <input
                          type="date"
                          className="rounded-lg border border-ink-900/15 px-2.5 py-2 text-sm"
                          value={checkOut}
                          min={checkIn}
                          onChange={(e) => setCheckOut(e.target.value)}
                        />
                      </label>
                    </div>
                    {inHouse && (
                      <p className="text-[11px] text-ink-700/50">
                        You’re already checked in, so the arrival date is fixed — you can still change your departure.
                      </p>
                    )}

                    <label className="flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-700/70">Guests</span>
                      <span className="flex items-center gap-3">
                        <button
                          className="h-8 w-8 rounded-full border border-ink-900/15 text-ink-900"
                          onClick={() => setGuests((n) => Math.max(1, n - 1))}
                        >
                          −
                        </button>
                        <span className="w-5 text-center font-display text-lg font-semibold text-ink-950">{guests}</span>
                        <button
                          className="h-8 w-8 rounded-full border border-ink-900/15 text-ink-900"
                          onClick={() => setGuests((n) => Math.min(6, n + 1))}
                        >
                          +
                        </button>
                      </span>
                    </label>

                    {dateDelta !== 0 && (
                      <div
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${
                          dateDelta > 0 ? 'bg-amber-50 text-amber-800' : 'bg-springs-500/10 text-springs-600'
                        }`}
                      >
                        {dateDelta > 0
                          ? `${newNights} nights — ${formatINR(dateDelta)} will be added to your bill.`
                          : `${newNights} nights — ${formatINR(Math.abs(dateDelta))} credited back to your bill.`}
                      </div>
                    )}

                    <Button
                      fullWidth
                      disabled={!datesChanged || newNights < 1}
                      onClick={() => {
                        modifyBooking(booking.id, new Date(checkIn).toISOString(), new Date(checkOut).toISOString(), guests);
                        setDone(
                          `Your booking is updated to ${newNights} night(s) for ${guests} guest(s). The hotel has been notified.`,
                        );
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </Card>

              {/* Upgrade */}
              <Card>
                <button className="flex w-full items-center justify-between" onClick={() => setPanel(panel === 'upgrade' ? 'none' : 'upgrade')}>
                  <span className="text-left">
                    <span className="block text-sm font-medium text-ink-900">Upgrade your room</span>
                    <span className="block text-xs text-ink-700/50">
                      {inHouse ? 'Move up a category for the rest of your stay' : 'Move up a category before you arrive'}
                    </span>
                  </span>
                  <span className="text-xs text-gold-600">{panel === 'upgrade' ? '▲' : '▼'}</span>
                </button>

                {panel === 'upgrade' && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-ink-900/10 pt-3">
                    {offers.length === 0 && (
                      <p className="text-xs text-ink-700/50">You’re already in the highest category at this hotel.</p>
                    )}
                    {offers.map((offer) => (
                      <button
                        key={offer.category}
                        onClick={() => setChosenUpgrade(offer.category)}
                        disabled={offer.availableCount === 0}
                        className={`flex items-center justify-between rounded-xl2 border px-3.5 py-3 text-left disabled:opacity-40 ${
                          chosenUpgrade === offer.category ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/10'
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-medium text-ink-900">{offer.label}</span>
                          <span className="block text-xs text-ink-700/50">
                            {offer.availableCount > 0 ? `${offer.availableCount} available` : 'None free right now'}
                            {inHouse ? ` · ${nightsRemaining} night(s) left` : ''}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block text-sm font-medium text-ink-900">+{formatINR(offer.extraTotal)}</span>
                          <span className="block text-[11px] text-ink-700/40">+{formatINR(offer.extraPerNight)}/night</span>
                        </span>
                      </button>
                    ))}

                    {chosenUpgrade && (
                      <>
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                          {inHouse
                            ? 'Front Office will prepare the new room and contact you to move. The difference is added to your bill.'
                            : 'The difference is added to your bill and your new room is assigned before arrival.'}
                        </p>
                        <Button
                          fullWidth
                          onClick={() => {
                            const offer = offers.find((o) => o.category === chosenUpgrade);
                            if (!offer) return;
                            requestRoomUpgrade(booking.id, chosenUpgrade, offer.extraTotal);
                            setDone(
                              `Upgrade to ${CATEGORY_LABEL[chosenUpgrade]} requested. ${formatINR(
                                offer.extraTotal,
                              )} added to your bill — the hotel will confirm your new room shortly.`,
                            );
                          }}
                        >
                          Request {CATEGORY_LABEL[chosenUpgrade]} Upgrade
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </Card>

              {/* Cancel */}
              <Card>
                <button className="flex w-full items-center justify-between" onClick={() => setPanel(panel === 'cancel' ? 'none' : 'cancel')}>
                  <span className="text-left">
                    <span className="block text-sm font-medium text-ink-900">Cancel booking</span>
                    <span className="block text-xs text-ink-700/50">
                      {quote.cancellable ? 'See your refund before you confirm' : 'Not available once your stay has started'}
                    </span>
                  </span>
                  <span className="text-xs text-gold-600">{panel === 'cancel' ? '▲' : '▼'}</span>
                </button>

                {panel === 'cancel' && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-ink-900/10 pt-3">
                    {quote.cancellable ? (
                      <>
                        <div className="rounded-xl2 bg-ink-900/[0.03] p-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-ink-700/60">Paid so far</span>
                            <span className="font-medium text-ink-900">{formatINR(booking.amountPaid)}</span>
                          </div>
                          <div className="mt-1 flex justify-between text-xs">
                            <span className="text-ink-700/60">Refund ({quote.refundPercent}%)</span>
                            <span
                              className={`font-semibold ${quote.refundAmount > 0 ? 'text-springs-600' : 'text-ink-700/50'}`}
                            >
                              {formatINR(quote.refundAmount)}
                            </span>
                          </div>
                          <p className="mt-2 border-t border-ink-900/10 pt-2 text-[11px] text-ink-700/60">
                            {quote.policyLabel}
                          </p>
                        </div>

                        <details className="text-[11px] text-ink-700/50">
                          <summary className="cursor-pointer">Hotel cancellation policy</summary>
                          <ul className="mt-1.5 flex flex-col gap-0.5 pl-4">
                            <li>7+ days before check-in — full refund</li>
                            <li>3–6 days before — 50% refund</li>
                            <li>1–2 days before — 25% refund</li>
                            <li>On the day of arrival — no refund</li>
                          </ul>
                        </details>

                        <Button
                          fullWidth
                          variant="secondary"
                          onClick={() => {
                            cancelBookingByGuest(booking.id, quote.refundAmount, quote.policyLabel);
                            setDone(
                              quote.refundAmount > 0
                                ? `Booking cancelled. ${formatINR(quote.refundAmount)} will be refunded to your original payment method.`
                                : 'Booking cancelled. No refund applies under the hotel’s policy for same-day cancellation.',
                            );
                          }}
                        >
                          Cancel This Booking
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-ink-700/60">
                        Your stay has already started. Use <span className="font-medium">Checkout</span> to leave early —
                        early-checkout refunds are calculated there.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
