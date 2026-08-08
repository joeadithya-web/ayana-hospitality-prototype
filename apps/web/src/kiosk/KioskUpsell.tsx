import { useMemo, useState } from 'react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { SERVICE_KIND_LABEL, servicesByKind, upgradeOffers } from '@ayana/ai-engine';
import type { UpgradeOffer } from '@ayana/ai-engine';
import type { Booking, Guest, PaymentMethod, ServiceCatalogItem, ServiceKind } from '@ayana/shared-types';
import { Badge, Button } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';
import { KioskPaymentStep } from './kioskShared';

type Step = 'offer' | 'upgrade_pick' | 'upgrade_pay' | 'upgraded' | 'services' | 'service_done';

const SERVICE_KINDS: ServiceKind[] = ['restaurant', 'spa', 'transport', 'add_on'];
const TIME_SLOTS = ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];

/**
 * The upsell moment: the guest is verified, their room is confirmed, and they're standing
 * at the machine. Offers a category upgrade they can pay for on the spot (walking away
 * with a new room number) plus dinner/spa bookings. Everything here lands on the same
 * folio the app reads, so it all shows on their phone before they reach the lift.
 */
export function KioskUpsell({
  booking,
  guest,
  roomNumber,
  onDone,
}: {
  booking: Booking;
  guest: Guest;
  roomNumber: string | null;
  onDone: () => void;
}) {
  const rooms = useSimulationStore((s) => s.rooms);
  const bookings = useSimulationStore((s) => s.bookings);
  const upgradeRoomNow = useSimulationStore((s) => s.upgradeRoomNow);
  const bookService = useSimulationStore((s) => s.bookService);

  const [step, setStep] = useState<Step>('offer');
  const [chosen, setChosen] = useState<UpgradeOffer | null>(null);
  const [newRoomNumber, setNewRoomNumber] = useState<string | null>(null);
  // Captured at the moment of upgrade: the `roomNumber` prop re-reads the booking, which
  // by the next render already points at the new room.
  const [previousRoomNumber, setPreviousRoomNumber] = useState<string | null>(null);
  const [kind, setKind] = useState<ServiceKind>('restaurant');
  const [service, setService] = useState<ServiceCatalogItem | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const nights = Math.max(
    1,
    Math.round((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86_400_000),
  );

  const occupiedRoomIds = useMemo(
    () =>
      new Set(
        bookings
          .filter((b) => b.id !== booking.id && b.status === 'checked_in' && b.roomId)
          .map((b) => b.roomId as string),
      ),
    [bookings, booking.id],
  );

  // Only categories with a genuinely free room can be sold at the machine — the guest
  // walks away with a real room number, so we never offer one we can't hand over.
  const offers = useMemo(
    () => upgradeOffers(rooms, booking.hotelId, booking.roomCategory, nights, occupiedRoomIds).filter((o) => o.room !== null),
    [rooms, booking.hotelId, booking.roomCategory, nights, occupiedRoomIds],
  );

  function completeUpgrade(method: PaymentMethod) {
    if (!chosen?.room) return;
    setPreviousRoomNumber(roomNumber);
    upgradeRoomNow(booking.id, chosen.category, chosen.room.id, chosen.extraTotal, method);
    setNewRoomNumber(chosen.room.roomNumber);
    setStep('upgraded');
  }

  function confirmService() {
    if (!service) return;
    const timing = slot ? ` at ${slot}` : '';
    bookService({
      bookingId: booking.id,
      guestId: guest.id,
      hotelId: booking.hotelId,
      requestType: service.requestType,
      details: `${service.label}${timing}`,
      description: service.label,
      amount: service.price,
      chargeCategory: service.chargeCategory,
    });
    setConfirmation(
      service.price > 0
        ? `${service.label}${timing} booked — ${formatINR(service.price)} charged to your room.`
        : `${service.label}${timing} booked.`,
    );
    setStep('service_done');
  }

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-4">
      {step === 'offer' && (
        <>
          <Badge tone="gold">Before you go up</Badge>
          <p className="font-display text-lg font-semibold text-cream-50">Make it a better stay?</p>
          <p className="max-w-xs text-center text-sm text-cream-50/60">
            {offers.length > 0
              ? `We have ${offers[0]?.label ?? 'higher-category'} rooms free tonight, and the restaurant and spa are taking bookings.`
              : 'The restaurant and spa are taking bookings for tonight.'}
          </p>

          <div className="flex w-full flex-col gap-2.5">
            {offers.length > 0 && (
              <button
                onClick={() => setStep('upgrade_pick')}
                className="flex items-center gap-4 rounded-xl2 border border-gold-500/40 bg-gold-500/10 px-4 py-3.5 text-left"
              >
                <span className="text-3xl">⬆️</span>
                <span className="flex-1">
                  <span className="block font-display text-sm font-semibold text-cream-50">Upgrade Your Room</span>
                  <span className="block text-xs text-cream-50/60">
                    From +{formatINR(Math.min(...offers.map((o) => o.extraTotal)))} for {nights} night{nights === 1 ? '' : 's'}
                  </span>
                </span>
                <span className="text-gold-300">›</span>
              </button>
            )}

            <button
              onClick={() => {
                setKind('restaurant');
                setStep('services');
              }}
              className="flex items-center gap-4 rounded-xl2 border border-white/10 bg-white/5 px-4 py-3.5 text-left hover:bg-white/10"
            >
              <span className="text-3xl">🍽️</span>
              <span className="flex-1">
                <span className="block font-display text-sm font-semibold text-cream-50">Reserve Dinner</span>
                <span className="block text-xs text-cream-50/50">Book a table for tonight</span>
              </span>
              <span className="text-cream-50/40">›</span>
            </button>

            <button
              onClick={() => {
                setKind('spa');
                setStep('services');
              }}
              className="flex items-center gap-4 rounded-xl2 border border-white/10 bg-white/5 px-4 py-3.5 text-left hover:bg-white/10"
            >
              <span className="text-3xl">💆</span>
              <span className="flex-1">
                <span className="block font-display text-sm font-semibold text-cream-50">Book the Spa</span>
                <span className="block text-xs text-cream-50/50">Massages and treatments</span>
              </span>
              <span className="text-cream-50/40">›</span>
            </button>
          </div>

          <button className="mt-1 text-xs text-cream-50/40 underline" onClick={onDone}>
            No thanks, take me to my room
          </button>
        </>
      )}

      {step === 'upgrade_pick' && (
        <>
          <p className="font-display text-lg font-semibold text-cream-50">Available Upgrades</p>
          <p className="text-xs text-cream-50/50">
            Currently in {booking.roomCategory} · {nights} night{nights === 1 ? '' : 's'}
          </p>
          <div className="flex w-full flex-col gap-2">
            {offers.map((offer) => (
              <button
                key={offer.category}
                onClick={() => setChosen(offer)}
                className={`flex items-center justify-between rounded-xl2 border px-4 py-3 text-left ${
                  chosen?.category === offer.category ? 'border-gold-500 bg-gold-500/10' : 'border-white/15'
                }`}
              >
                <span>
                  <span className="block text-sm font-medium text-cream-50">{offer.label}</span>
                  <span className="block text-xs text-cream-50/50">
                    {offer.availableCount} free · {offer.room?.view.replace('_', ' ')} view
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold text-gold-300">+{formatINR(offer.extraTotal)}</span>
                  <span className="block text-[10px] text-cream-50/40">+{formatINR(offer.extraPerNight)}/night</span>
                </span>
              </button>
            ))}
          </div>
          <Button fullWidth size="lg" disabled={!chosen} onClick={() => setStep('upgrade_pay')}>
            {chosen ? `Upgrade for ${formatINR(chosen.extraTotal)}` : 'Select an upgrade'}
          </Button>
          <button className="text-xs text-cream-50/40 underline" onClick={() => setStep('offer')}>
            Back
          </button>
        </>
      )}

      {step === 'upgrade_pay' && chosen && (
        <KioskPaymentStep
          amountDue={chosen.extraTotal}
          title={`Upgrade to ${chosen.label}`}
          helper={`${nights} night${nights === 1 ? '' : 's'} at +${formatINR(chosen.extraPerNight)} per night. Your new room is assigned as soon as this is paid.`}
          onPaid={completeUpgrade}
        />
      )}

      {step === 'upgraded' && (
        <div className="flex w-full flex-col items-center gap-4">
          <span className="text-4xl">🎉</span>
          <p className="font-display text-lg font-semibold text-gold-300">You’ve Been Upgraded</p>
          <p className="max-w-xs text-center text-sm text-cream-50/70">
            Enjoy your {chosen?.label} room. Your key and the updated bill are already on your phone.
          </p>
          <div className="w-full rounded-xl2 border border-gold-500/40 bg-gold-500/10 px-6 py-5 text-center">
            <p className="text-xs uppercase tracking-widest text-gold-300">Your new room</p>
            <p className="font-display text-4xl font-semibold text-cream-50">{newRoomNumber}</p>
            {previousRoomNumber && previousRoomNumber !== newRoomNumber && (
              <p className="mt-1 text-[11px] text-cream-50/40">Replaces room {previousRoomNumber}</p>
            )}
          </div>
          <Button fullWidth variant="secondary" onClick={() => setStep('offer')}>
            Add Dinner or Spa
          </Button>
          <button className="text-xs text-cream-50/40 underline" onClick={onDone}>
            Done
          </button>
        </div>
      )}

      {step === 'services' && (
        <>
          <p className="font-display text-lg font-semibold text-cream-50">{SERVICE_KIND_LABEL[kind]}</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {SERVICE_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => {
                  setKind(k);
                  setService(null);
                }}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                  kind === k ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-white/15 text-cream-50/60'
                }`}
              >
                {SERVICE_KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-2">
            {servicesByKind(kind).map((item) => (
              <button
                key={item.id}
                onClick={() => setService(item)}
                className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm ${
                  service?.id === item.id ? 'border-gold-500 bg-gold-500/10 text-cream-50' : 'border-white/15 text-cream-50/70'
                }`}
              >
                <span>
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </span>
                <span className="text-xs text-cream-50/50">{item.price > 0 ? formatINR(item.price) : 'Free'}</span>
              </button>
            ))}
          </div>

          {service && (
            <div className="flex w-full flex-wrap justify-center gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSlot(t)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                    slot === t ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-white/15 text-cream-50/70'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {guest.memory.dietaryPreference !== 'no_preference' && kind === 'restaurant' && (
            <Badge tone="gold">AYANA Memory: {guest.memory.dietaryPreference.replace('_', ' ')} shared with the kitchen</Badge>
          )}

          <Button fullWidth size="lg" disabled={!service} onClick={confirmService}>
            {service && service.price > 0 ? `Book — ${formatINR(service.price)} to room` : 'Confirm Booking'}
          </Button>
          <button className="text-xs text-cream-50/40 underline" onClick={() => setStep('offer')}>
            Back
          </button>
        </>
      )}

      {step === 'service_done' && (
        <div className="flex w-full flex-col items-center gap-4">
          <span className="text-4xl">✅</span>
          <p className="font-display text-lg font-semibold text-cream-50">Booked</p>
          <p className="max-w-xs text-center text-sm text-cream-50/70">{confirmation}</p>
          <p className="text-[11px] text-cream-50/40">It’s already showing on your phone.</p>
          <Button fullWidth variant="secondary" onClick={() => setStep('offer')}>
            Book Something Else
          </Button>
          <button className="text-xs text-cream-50/40 underline" onClick={onDone}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
