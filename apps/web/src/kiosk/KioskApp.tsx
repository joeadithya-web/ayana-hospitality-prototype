import { useEffect, useState } from 'react';
import { setActiveSource, useSimulationStore } from '@ayana/simulation-engine';
import { evaluateBookingReadiness, validateKioskCheckIn, type KioskOutcome } from '@ayana/ai-engine';
import type { Booking, KioskFailureReason } from '@ayana/shared-types';
import { Badge, Button } from '@ayana/shared-ui';

type Step = 'welcome' | 'scan' | 'lost-phone' | 'validating' | 'directions' | 'thanks' | 'failed';

const FAILURE_COPY: Record<KioskFailureReason, { title: string; body: string }> = {
  qr_invalid: { title: 'QR Code Not Recognised', body: 'This code doesn’t match a booking at this hotel. Please see Front Office for assistance.' },
  qr_expired: { title: 'QR Code Expired', body: 'Your stay dates have ended, so this code is no longer valid. Please see Front Office for assistance.' },
  qr_not_yet_valid: { title: 'Too Early to Check In', body: 'Your stay hasn’t started yet. Please come back on your check-in date, or see Front Office.' },
  payment_pending: { title: 'Payment Not Yet Verified', body: 'Your payment is still processing. Please see Front Office to complete your check-in.' },
  room_not_ready: { title: 'Room Being Prepared', body: 'Your room isn’t quite ready yet. Please have a seat — we’ll notify you shortly, or see Front Office.' },
  identity_failed: { title: 'Identity Verification Needed', body: 'We couldn’t confirm your identity from this code. Please see Front Office with your ID.' },
  network_offline: { title: 'Network Unavailable', body: 'The kiosk has lost its connection. Please see Front Office to check in.' },
  pms_offline: { title: 'System Temporarily Unavailable', body: 'Our property system is briefly offline. Please see Front Office — your booking is safe.' },
  duplicate_check_in: { title: 'Already Checked In', body: 'This booking has already been checked in. If this seems wrong, please see Front Office.' },
};

export function KioskApp() {
  const hotels = useSimulationStore((s) => s.hotels);
  const bookings = useSimulationStore((s) => s.bookings);
  const rooms = useSimulationStore((s) => s.rooms);
  const guests = useSimulationStore((s) => s.guests);
  const activeFailureScenario = useSimulationStore((s) => s.activeFailureScenario);
  const checkInGuest = useSimulationStore((s) => s.checkInGuest);
  const updateReadyToRoom = useSimulationStore((s) => s.updateReadyToRoom);

  const [hotelId, setHotelId] = useState('htl_springs');
  const [step, setStep] = useState<Step>('welcome');
  const [qrInput, setQrInput] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [outcome, setOutcome] = useState<KioskOutcome | null>(null);

  useEffect(() => {
    setActiveSource('kiosk');
  }, []);

  const hotel = hotels.find((h) => h.id === hotelId);
  const globalOffline = activeFailureScenario === 'kiosk_offline' || activeFailureScenario === 'network_failure';
  const lostPhoneMode = activeFailureScenario === 'guest_lost_phone';

  function reset() {
    setStep('welcome');
    setQrInput('');
    setNameQuery('');
    setOutcome(null);
  }

  function finalizeOutcome(result: KioskOutcome) {
    setOutcome(result);
    if (result.kind === 'success') {
      if (!result.booking.readyToRoom.keyPathReady) {
        updateReadyToRoom(result.booking.id, { keyPathReady: true, qrCode: result.booking.readyToRoom.qrCode });
      }
      checkInGuest(result.booking.id);
      setStep('directions');
    } else {
      setStep('failed');
    }
  }

  function handleScan() {
    setStep('validating');
    setTimeout(() => {
      finalizeOutcome(validateKioskCheckIn(qrInput, hotelId, bookings, rooms, activeFailureScenario));
    }, 1200);
  }

  function handleLostPhoneSelect(booking: Booking) {
    setStep('validating');
    setTimeout(() => {
      finalizeOutcome(evaluateBookingReadiness(booking, rooms));
    }, 1200);
  }

  const guestById = new Map(guests.map((g) => [g.id, g]));
  const nameMatches =
    nameQuery.trim().length >= 2
      ? bookings
          .filter((b) => b.hotelId === hotelId && (b.status === 'confirmed' || b.status === 'pending_payment'))
          .filter((b) => guestById.get(b.guestId)?.fullName.toLowerCase().includes(nameQuery.trim().toLowerCase()))
          .slice(0, 5)
      : [];

  const guestName = outcome?.kind === 'success' ? guests.find((g) => g.id === outcome.booking.guestId)?.fullName : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-8 py-12 text-cream-50">
      <div className="absolute right-6 top-6">
        <select
          value={hotelId}
          onChange={(e) => {
            setHotelId(e.target.value);
            reset();
          }}
          className="rounded-lg border border-white/15 bg-ink-900 px-2 py-1.5 text-xs text-cream-50"
        >
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-400">AYANA Self-Service Kiosk</p>
        <p className="mt-1 font-display text-lg font-semibold">{hotel?.name}</p>

        {globalOffline ? (
          <div className="mt-10 flex flex-col items-center gap-3">
            <span className="text-4xl">📡</span>
            <p className="font-display text-xl font-semibold text-red-300">
              {activeFailureScenario === 'kiosk_offline' ? 'Kiosk Temporarily Offline' : 'Network Unavailable'}
            </p>
            <p className="text-sm text-cream-50/60">Please proceed to Front Office — our team can check you in manually.</p>
          </div>
        ) : (
          <>
            {step === 'welcome' && (
              <div className="mt-10 flex flex-col items-center gap-5">
                <span className="text-5xl">🔑</span>
                <p className="text-sm text-cream-50/70">Scan your AYANA QR code to check in and collect your key.</p>
                <Button size="lg" variant="secondary" onClick={() => setStep(lostPhoneMode ? 'lost-phone' : 'scan')}>
                  Tap to Begin
                </Button>
              </div>
            )}

            {step === 'scan' && (
              <div className="mt-10 flex w-full flex-col items-center gap-4">
                <span className="text-4xl">📷</span>
                <p className="text-sm text-cream-50/70">Enter or scan your QR code</p>
                <input
                  autoFocus
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="AYANA-xxxxxx"
                  className="w-full rounded-lg border border-white/15 bg-ink-900 px-4 py-3 text-center text-sm text-cream-50"
                />
                <Button fullWidth size="lg" disabled={!qrInput.trim()} onClick={handleScan}>
                  Validate
                </Button>
                <button className="text-xs text-cream-50/40 underline" onClick={() => setStep('lost-phone')}>
                  Lost your phone? Look up by name
                </button>
              </div>
            )}

            {step === 'lost-phone' && (
              <div className="mt-10 flex w-full flex-col items-center gap-4">
                <span className="text-4xl">🪪</span>
                <p className="text-sm text-cream-50/70">No phone? Search your booking by name instead.</p>
                {lostPhoneMode && <Badge tone="danger">Guest Lost Phone scenario active</Badge>}
                <input
                  autoFocus
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder="Type your full name…"
                  className="w-full rounded-lg border border-white/15 bg-ink-900 px-4 py-3 text-center text-sm text-cream-50"
                />
                <div className="flex w-full flex-col gap-2">
                  {nameQuery.trim().length >= 2 && nameMatches.length === 0 && (
                    <p className="text-xs text-cream-50/40">No matching booking found at this hotel.</p>
                  )}
                  {nameMatches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleLostPhoneSelect(b)}
                      className="rounded-lg border border-white/15 bg-ink-900 px-4 py-2.5 text-left text-sm hover:bg-white/5"
                    >
                      {guestById.get(b.guestId)?.fullName}
                      <span className="ml-2 text-xs text-cream-50/40 capitalize">{b.roomCategory}</span>
                    </button>
                  ))}
                </div>
                <button className="text-xs text-cream-50/40 underline" onClick={() => setStep('scan')}>
                  Back to QR scan
                </button>
              </div>
            )}

            {step === 'validating' && (
              <div className="mt-16 flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
                <p className="text-sm text-cream-50/60">Validating your booking…</p>
              </div>
            )}

            {step === 'directions' && outcome?.kind === 'success' && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <span className="text-4xl">✅</span>
                <p className="font-display text-xl font-semibold">Welcome, {guestName?.split(' ')[0]}!</p>
                <Badge tone="gold">
                  Room {outcome.room.roomNumber} · Floor {outcome.room.floor}
                </Badge>
                <p className="max-w-xs text-sm text-cream-50/70">
                  Take the elevator to Floor {outcome.room.floor}, Section {outcome.room.section}. Your room is on the
                  right. Your mobile key is already active on your phone.
                </p>
                <Button size="lg" variant="secondary" onClick={() => setStep('thanks')}>
                  Continue
                </Button>
              </div>
            )}

            {step === 'thanks' && (
              <div className="mt-16 flex flex-col items-center gap-3">
                <span className="text-4xl">🙏</span>
                <p className="font-display text-xl font-semibold">Enjoy your stay!</p>
                <Button variant="ghost" className="!border-white/20 !text-cream-50 hover:!bg-white/5" onClick={reset}>
                  Done
                </Button>
              </div>
            )}

            {step === 'failed' && outcome?.kind === 'failure' && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <span className="text-4xl">⚠️</span>
                <p className="font-display text-lg font-semibold text-red-300">{FAILURE_COPY[outcome.reason].title}</p>
                <p className="max-w-xs text-sm text-cream-50/60">{FAILURE_COPY[outcome.reason].body}</p>
                <Button variant="ghost" className="!border-white/20 !text-cream-50 hover:!bg-white/5" onClick={reset}>
                  Try Again
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
