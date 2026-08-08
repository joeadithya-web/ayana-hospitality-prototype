import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { CATEGORY_LABEL, categoryNightlyPrice, nightsBetween } from '@ayana/ai-engine';
import { GROUP_BOOKING_MIN_GUESTS } from '@ayana/shared-types';
import type { PaymentMethod, RoomCategory } from '@ayana/shared-types';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';
import { useCurrentCorporate, useCurrentGuest } from '../hooks';

const CATEGORIES: RoomCategory[] = ['standard', 'deluxe', 'executive', 'suite'];
/** Rooms are sold to a party at this occupancy — the basis for the rooms-needed maths. */
const GUESTS_PER_ROOM = 2;

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Group bookings: a party too large for one room, booked in a single pass. The engine
 * creates one booking per room sharing a group reference, so the hotel can allocate and
 * service each room while the guest still sees and pays for it as one thing.
 */
export function GroupBooking() {
  const navigate = useNavigate();
  const guest = useCurrentGuest();
  const corporate = useCurrentCorporate();
  const hotels = useSimulationStore((s) => s.hotels);
  const rooms = useSimulationStore((s) => s.rooms);
  const createGroupBooking = useSimulationStore((s) => s.createGroupBooking);
  const payBooking = useSimulationStore((s) => s.payBooking);

  const [hotelId, setHotelId] = useState(hotels[0]?.id ?? '');
  const [checkIn, setCheckIn] = useState(isoDaysFromNow(7));
  const [checkOut, setCheckOut] = useState(isoDaysFromNow(9));
  const [totalGuests, setTotalGuests] = useState(GROUP_BOOKING_MIN_GUESTS);
  const [category, setCategory] = useState<RoomCategory>('standard');
  const [tier, setTier] = useState<100 | 50 | 25>(50);
  const [method, setMethod] = useState<PaymentMethod>(corporate?.wireTransferEnabled ? 'wire_transfer' : 'upi');
  const [confirmed, setConfirmed] = useState<{ rooms: number; total: number; wire: boolean } | null>(null);

  const hotel = hotels.find((h) => h.id === hotelId);
  const nights = nightsBetween(checkIn, checkOut);
  const roomsNeeded = Math.max(1, Math.ceil(totalGuests / GUESTS_PER_ROOM));

  const publishedNightly = useMemo(
    () => (hotel ? categoryNightlyPrice(rooms, hotel.id, category) : 0),
    [rooms, hotel, category],
  );
  const contractedNightly = corporate
    ? Math.round((publishedNightly * (100 - corporate.negotiatedDiscountPercent)) / 100)
    : publishedNightly;

  const grandTotal = contractedNightly * nights * roomsNeeded;
  const dueNow = Math.round((grandTotal * tier) / 100);
  const savings = (publishedNightly - contractedNightly) * nights * roomsNeeded;

  const availableInCategory = hotel
    ? rooms.filter((r) => r.hotelId === hotel.id && r.category === category && r.status === 'ready').length
    : 0;
  const enoughRooms = availableInCategory >= roomsNeeded;
  const wireTransfer = method === 'wire_transfer';

  const methods: { id: PaymentMethod; label: string; icon: string }[] = [
    ...(corporate?.wireTransferEnabled
      ? [{ id: 'wire_transfer' as PaymentMethod, label: 'Wire Transfer (on account)', icon: '🏦' }]
      : []),
    { id: 'upi', label: 'UPI', icon: '📲' },
    { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳' },
  ];

  function confirm() {
    if (!guest || !hotel) return;
    const created = createGroupBooking({
      guestId: guest.id,
      hotelId: hotel.id,
      roomCategory: category,
      checkInDate: new Date(checkIn).toISOString(),
      checkOutDate: new Date(checkOut).toISOString(),
      totalGuests,
      roomsCount: roomsNeeded,
      paymentTier: tier,
      corporateId: corporate?.id ?? null,
    });

    // Wire transfer settles on the contract's billing cycle, so nothing is collected now —
    // but the rooms are confirmed against the agreement rather than left pending payment.
    const perRoomDue = wireTransfer
      ? created[0]
        ? created[0].totalAmount
        : 0
      : Math.round(((created[0]?.totalAmount ?? 0) * tier) / 100);
    created.forEach((b) => payBooking(b.id, method, perRoomDue));

    setConfirmed({ rooms: created.length, total: grandTotal, wire: wireTransfer });
  }

  if (!guest) return null;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-cream-50">
        <div className="mx-auto max-w-md">
          <PageHeader title="Group Booking" subtitle={hotel?.name} onBack={() => navigate('/traveller/trips')} />
          <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-springs-500 text-2xl text-white">✓</span>
            <p className="font-display text-lg font-semibold text-ink-950">
              {confirmed.rooms} rooms confirmed
            </p>
            <p className="text-sm text-ink-700/70">
              {totalGuests} guests · {nights} night{nights === 1 ? '' : 's'} at {hotel?.name}.
            </p>
            <Card className="w-full text-left">
              <div className="flex justify-between text-sm">
                <span className="text-ink-700/60">Group total</span>
                <span className="font-semibold text-ink-900">{formatINR(confirmed.total)}</span>
              </div>
              {confirmed.wire ? (
                <p className="mt-2 rounded-lg bg-ink-900/[0.03] px-3 py-2 text-[11px] text-ink-700/70">
                  Billed to {corporate?.name} by wire transfer under {corporate?.contractRef} · {corporate?.settlementTerms}.
                  Nothing was collected at booking.
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-ink-700/50">
                  {tier}% collected now; the balance is due at check-in.
                </p>
              )}
            </Card>
            <Button fullWidth onClick={() => navigate('/traveller/trips')}>
              View in My Trips
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Group Booking" onBack={() => navigate('/traveller/dashboard')} />

        <div className="flex flex-col gap-4 px-5">
          <Card className="bg-ink-950 text-cream-50">
            <p className="font-display text-base font-semibold">Travelling as a group?</p>
            <p className="mt-1 text-xs text-cream-50/60">
              For parties of {GROUP_BOOKING_MIN_GUESTS} or more. We hold the rooms together so everyone checks in
              under one reference.
            </p>
            {corporate && (
              <p className="mt-2 text-[11px] text-gold-400">
                {corporate.logoEmoji} On {corporate.name}’s agreement — {corporate.negotiatedDiscountPercent}% contracted rate applied.
              </p>
            )}
          </Card>

          <Card>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-700/50">Property</span>
              <select
                className="rounded-lg border border-ink-900/15 px-3 py-2.5 text-sm"
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} · {h.city}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-ink-700/50">Check-in</span>
                <input
                  type="date"
                  className="rounded-lg border border-ink-900/15 px-2.5 py-2 text-sm"
                  value={checkIn}
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

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-700/70">Total guests</span>
              <span className="flex items-center gap-3">
                <button
                  className="h-8 w-8 rounded-full border border-ink-900/15 text-ink-900 disabled:opacity-30"
                  disabled={totalGuests <= GROUP_BOOKING_MIN_GUESTS}
                  onClick={() => setTotalGuests((n) => Math.max(GROUP_BOOKING_MIN_GUESTS, n - 1))}
                >
                  −
                </button>
                <span className="w-6 text-center font-display text-lg font-semibold text-ink-950">{totalGuests}</span>
                <button
                  className="h-8 w-8 rounded-full border border-ink-900/15 text-ink-900"
                  onClick={() => setTotalGuests((n) => Math.min(40, n + 1))}
                >
                  +
                </button>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-700/50">
              Minimum {GROUP_BOOKING_MIN_GUESTS} guests — for fewer, book normally from Search.
            </p>
          </Card>

          <Card>
            <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">Room category</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    category === c ? 'border-gold-500 bg-gold-500/10 text-gold-600' : 'border-ink-900/10 text-ink-700/60'
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink-900/10 pt-2.5 text-xs">
              <span className="text-ink-700/60">
                {roomsNeeded} room{roomsNeeded === 1 ? '' : 's'} at {GUESTS_PER_ROOM} guests each
              </span>
              {enoughRooms ? (
                <Badge tone="success">{availableInCategory} available</Badge>
              ) : (
                <Badge tone="warning">Only {availableInCategory} free</Badge>
              )}
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">Quote</p>
            <QuoteRow label={`${formatINR(contractedNightly)} × ${nights} night(s) × ${roomsNeeded} room(s)`} value={formatINR(grandTotal)} />
            {corporate && savings > 0 && (
              <QuoteRow label={`Contracted saving (${corporate.negotiatedDiscountPercent}%)`} value={`−${formatINR(savings)}`} accent />
            )}
            <p className="mt-1 text-[11px] text-ink-700/40">Exclusive of Taxes</p>
          </Card>

          {!wireTransfer && (
            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">Advance payment</p>
              <div className="flex gap-1.5">
                {([100, 50, 25] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
                      tier === t ? 'border-gold-500 bg-gold-500/10 text-gold-600' : 'border-ink-900/10 text-ink-700/60'
                    }`}
                  >
                    {t}%
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">Payment</p>
            <div className="flex flex-col gap-2">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${
                    method === m.id ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/10'
                  }`}
                >
                  <input type="radio" checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <span className="text-lg">{m.icon}</span>
                  <span className="flex-1">{m.label}</span>
                </label>
              ))}
            </div>
            {wireTransfer && corporate && (
              <p className="mt-2 rounded-lg bg-ink-900/[0.03] px-3 py-2 text-[11px] text-ink-700/70">
                Pre-approved under {corporate.contractRef}. The full {formatINR(grandTotal)} is billed to{' '}
                {corporate.billingEmail} on {corporate.settlementTerms} terms — nothing is collected now.
              </p>
            )}
            <Badge tone="neutral">Simulated payment — no real gateway, no real charge</Badge>
          </Card>
        </div>

        <div className="mt-5 px-5">
          <Button fullWidth size="lg" disabled={!enoughRooms || !hotel} onClick={confirm}>
            {wireTransfer
              ? `Confirm ${roomsNeeded} Rooms on Account`
              : `Confirm & Pay ${formatINR(dueNow)}`}
          </Button>
          {!enoughRooms && (
            <p className="mt-2 text-center text-[11px] text-amber-700">
              Not enough {CATEGORY_LABEL[category]} rooms free — try another category or property.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuoteRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between py-0.5 text-sm">
      <span className="text-ink-700/60">{label}</span>
      <span className={`font-medium ${accent ? 'text-springs-600' : 'text-ink-900'}`}>{value}</span>
    </div>
  );
}
