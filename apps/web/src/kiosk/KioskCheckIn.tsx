import { useState } from 'react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { evaluateRoomAllocation } from '@ayana/ai-engine';
import type { Booking, KioskFailureReason } from '@ayana/shared-types';
import { Badge, Button } from '@ayana/shared-ui';
import { formatDate } from '@ayana/shared-utils';
import { FAILURE_COPY, FaceScanStep, GuestIdentityHeader, KioskPaymentStep, ReservationPicker, RevealableRoom } from './kioskShared';
import { KioskUpsell } from './KioskUpsell';

type Step = 'face' | 'reservation_pick' | 'qr_fallback' | 'payment' | 'waiting' | 'success' | 'upsell' | 'failed';

export function KioskCheckIn({ hotelId, onExit }: { hotelId: string; onExit: () => void }) {
  const bookings = useSimulationStore((s) => s.bookings);
  const rooms = useSimulationStore((s) => s.rooms);
  const guests = useSimulationStore((s) => s.guests);
  const activeFailureScenario = useSimulationStore((s) => s.activeFailureScenario);
  const updateReadyToRoom = useSimulationStore((s) => s.updateReadyToRoom);
  const checkInGuest = useSimulationStore((s) => s.checkInGuest);
  const payBooking = useSimulationStore((s) => s.payBooking);
  const autoAllocateRoom = useSimulationStore((s) => s.autoAllocateRoom);
  const markDelayed = useSimulationStore((s) => s.markDelayed);
  const markOverbooked = useSimulationStore((s) => s.markOverbooked);

  const [step, setStep] = useState<Step>(activeFailureScenario === 'guest_lost_phone' ? 'reservation_pick' : 'face');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [failureReason, setFailureReason] = useState<KioskFailureReason | null>(null);
  const [waitingReason, setWaitingReason] = useState<'delayed' | 'overbooked' | null>(null);

  const activeBooking = bookings.find((b) => b.id === activeBookingId) ?? null;
  const activeGuest = activeBooking ? guests.find((g) => g.id === activeBooking.guestId) : null;
  const activeRoom = activeBooking?.roomId ? rooms.find((r) => r.id === activeBooking.roomId) : null;

  // Excludes bookings that can only ever dead-end at "Reservation Expired" — a guest
  // picking their own name should never be routed to a booking that's already unusable.
  // Sorted so today's/soonest arrival ranks first, ahead of anything further out, so a
  // same-named guest's freshest reservation isn't buried behind older ones by list order.
  const candidates = bookings
    .filter(
      (b) =>
        b.hotelId === hotelId &&
        (b.status === 'pending_payment' || b.status === 'confirmed') &&
        new Date(b.checkOutDate).getTime() >= Date.now(),
    )
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

  function fail(reason: KioskFailureReason) {
    setFailureReason(reason);
    setStep('failed');
  }

  function resolveCheckIn(booking: Booking) {
    if (booking.status === 'checked_in' || booking.status === 'checked_out') return fail('duplicate_check_in');
    const now = new Date();
    if (now < new Date(booking.checkInDate)) return fail('qr_not_yet_valid');
    if (now > new Date(booking.checkOutDate)) return fail('qr_expired');

    setActiveBookingId(booking.id);
    updateReadyToRoom(booking.id, { identityVerified: true });

    // Any outstanding balance is always surfaced — the app has already told the guest it's
    // due at check-in, so the kiosk must never settle or skip it behind their back. VIPs get
    // the option to defer it to the room bill, but only by choosing it themselves.
    const remaining = booking.totalAmount - booking.amountPaid;
    if (remaining > 0) {
      setStep('payment');
    } else {
      allocateAndFinish(booking);
    }
  }

  function allocateAndFinish(booking: Booking) {
    if (booking.allocationStatus === 'allocated' && booking.roomId) {
      finalize(booking.id);
      return;
    }
    const guest = guests.find((g) => g.id === booking.guestId);
    if (!guest) return;
    const result = evaluateRoomAllocation(booking, bookings, rooms, guest);
    if (result.kind === 'allocate') {
      autoAllocateRoom(booking.id, result.room.id);
      finalize(booking.id);
    } else if (result.kind === 'delayed') {
      markDelayed(booking.id);
      setWaitingReason('delayed');
      setStep('waiting');
    } else {
      markOverbooked(booking.id);
      setWaitingReason('overbooked');
      setStep('waiting');
    }
  }

  function finalize(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    updateReadyToRoom(bookingId, { keyPathReady: true, qrCode: `AYANA-${bookingId}`, estimatedArrival: booking?.checkInDate ?? null });
    checkInGuest(bookingId);
    setStep('success');
  }

  function handleQrSubmit() {
    const code = qrInput.trim();
    const booking = bookings.find(
      (b) => b.hotelId === hotelId && (b.readyToRoom.qrCode === code || b.id === code || `AYANA-${b.id}` === code),
    );
    if (!booking) return fail('qr_invalid');
    resolveCheckIn(booking);
  }

  const guestById = new Map(guests.map((g) => [g.id, g]));

  return (
    <div className="flex w-full max-w-sm flex-col items-center text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Check In</p>

      {step === 'face' && (
        <FaceScanStep
          forceNoMatch={activeFailureScenario === 'identity_failure'}
          onMatched={() => setStep('reservation_pick')}
          onNoMatch={() => setStep('qr_fallback')}
          title="Look at the Camera"
          subtitle="We'll match your face to your reservation."
        />
      )}

      {step === 'reservation_pick' && (
        <div className="mt-4 flex w-full flex-col items-center gap-2">
          {activeFailureScenario === 'guest_lost_phone' && <Badge tone="danger">Guest Lost Phone scenario active — skipped face scan</Badge>}
          <ReservationPicker
            candidates={candidates}
            guestNameOf={(b) => guestById.get(b.guestId)?.fullName ?? 'Guest'}
            labelOf={(b) => `${b.roomCategory} · ${formatDate(b.checkInDate)}`}
            onSelect={resolveCheckIn}
          />
        </div>
      )}

      {step === 'qr_fallback' && (
        <div className="mt-8 flex w-full flex-col items-center gap-4">
          <span className="text-4xl">📷</span>
          <p className="text-sm text-cream-50/70">Enter your booking reference or QR code</p>
          <input
            autoFocus
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="AYANA-xxxxxx"
            className="w-full rounded-lg border border-white/15 bg-ink-900 px-4 py-3 text-center text-sm text-cream-50"
          />
          <Button fullWidth size="lg" disabled={!qrInput.trim()} onClick={handleQrSubmit}>
            Validate
          </Button>
        </div>
      )}

      {step === 'payment' && activeBooking && (
        <KioskPaymentStep
          amountDue={activeBooking.totalAmount - activeBooking.amountPaid}
          title="Balance Due Before Check-In"
          helper={
            activeGuest?.isVip
              ? `You paid ${activeBooking.paymentTier}% at booking. Settle the balance now, or as a VIP guest carry it on your room bill and pay any time from the app.`
              : `You paid ${activeBooking.paymentTier}% at booking. Please settle the remaining balance to receive your room key.`
          }
          onPaid={(method) => {
            payBooking(activeBooking.id, method, activeBooking.totalAmount - activeBooking.amountPaid);
            allocateAndFinish({ ...activeBooking, amountPaid: activeBooking.totalAmount });
          }}
          onDefer={activeGuest?.isVip ? () => allocateAndFinish(activeBooking) : undefined}
          deferLabel="VIP — add to my room bill instead"
        />
      )}

      {step === 'waiting' && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <span className="text-4xl">⏳</span>
          <p className="font-display text-lg font-semibold text-amber-300">
            {waitingReason === 'delayed' ? 'Your Room Is Being Prepared' : 'Finalising Your Room'}
          </p>
          <p className="max-w-xs text-sm text-cream-50/60">
            {waitingReason === 'delayed'
              ? "Housekeeping is finishing an outgoing guest's room in your category. Please have a seat — we'll notify you shortly."
              : 'Your category is fully booked for these dates. Please see Front Office — they may arrange a complimentary upgrade.'}
          </p>
          <Button variant="ghost" className="!border-white/20 !text-cream-50 hover:!bg-white/5" onClick={onExit}>
            Back to Menu
          </Button>
        </div>
      )}

      {step === 'success' && activeGuest && (
        <div className="mt-6 flex w-full flex-col items-center gap-4">
          <span className="text-4xl">✅</span>
          <GuestIdentityHeader guest={activeGuest} />
          <p className="font-display text-lg font-semibold text-cream-50">Welcome, {activeGuest.fullName.split(' ')[0]}!</p>
          {activeRoom && <RevealableRoom roomNumber={activeRoom.roomNumber} floor={activeRoom.floor} />}
          <p className="max-w-xs text-sm text-cream-50/70">Your mobile key is already active on your phone. Enjoy your stay!</p>
          <Button size="lg" onClick={() => setStep('upsell')}>
            Continue
          </Button>
          <button className="text-xs text-cream-50/40 underline" onClick={onExit}>
            Skip to menu
          </button>
        </div>
      )}

      {/* Upsell only after identity and room are settled — never before the guest knows they're in. */}
      {step === 'upsell' && activeBooking && activeGuest && (
        <KioskUpsell
          booking={activeBooking}
          guest={activeGuest}
          roomNumber={activeRoom?.roomNumber ?? null}
          onDone={onExit}
        />
      )}

      {step === 'failed' && failureReason && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <span className="text-4xl">⚠️</span>
          <p className="font-display text-lg font-semibold text-red-300">{FAILURE_COPY[failureReason].title}</p>
          <p className="max-w-xs text-sm text-cream-50/60">{FAILURE_COPY[failureReason].body}</p>
          <Button variant="ghost" className="!border-white/20 !text-cream-50 hover:!bg-white/5" onClick={onExit}>
            Back to Menu
          </Button>
        </div>
      )}
    </div>
  );
}
