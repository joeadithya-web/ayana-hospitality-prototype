import { useState } from 'react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { AnaIqMark, Badge, Button } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';
import { GuestIdentityHeader, ReservationPicker } from './kioskShared';

type Step = 'reservation_pick' | 'hub' | 'restaurant' | 'spa' | 'cab' | 'confirmed';

const TIME_SLOTS = ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];

const SPA_TREATMENTS = [
  { id: 'swedish', label: 'Swedish Massage (60 min)', price: 2500 },
  { id: 'deep_tissue', label: 'Deep Tissue Massage (60 min)', price: 3200 },
  { id: 'facial', label: 'Rejuvenating Facial (45 min)', price: 1800 },
];

const CAB_TYPES = [
  { id: 'hatchback', label: 'Hatchback', price: 300 },
  { id: 'sedan', label: 'Sedan', price: 450 },
  { id: 'suv', label: 'SUV', price: 650 },
];

export function KioskServices({ hotelId, onExit }: { hotelId: string; onExit: () => void }) {
  const bookings = useSimulationStore((s) => s.bookings);
  const guests = useSimulationStore((s) => s.guests);
  const requestConcierge = useSimulationStore((s) => s.requestConcierge);
  const postCharge = useSimulationStore((s) => s.postCharge);

  const [step, setStep] = useState<Step>('reservation_pick');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const activeBooking = bookings.find((b) => b.id === activeBookingId) ?? null;
  const activeGuest = activeBooking ? guests.find((g) => g.id === activeBooking.guestId) : null;
  const candidates = bookings.filter((b) => b.hotelId === hotelId && b.status === 'checked_in');
  const guestById = new Map(guests.map((g) => [g.id, g]));

  if (!activeBooking || !activeGuest) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Other Services</p>
        <p className="mt-3 text-sm text-cream-50/70">Which reservation should we charge these to?</p>
        <ReservationPicker
          candidates={candidates}
          guestNameOf={(b) => guestById.get(b.guestId)?.fullName ?? 'Guest'}
          labelOf={(b) => b.roomCategory}
          onSelect={(b) => {
            setActiveBookingId(b.id);
            setStep('hub');
          }}
          emptyLabel="No checked-in guests found at this hotel."
        />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Other Services</p>
      <GuestIdentityHeader guest={activeGuest} />

      {step === 'hub' && (
        <div className="mt-6 flex w-full flex-col gap-3">
          <ServiceCard icon="🍽️" title="Reserve a Table" subtitle="Book the in-house restaurant" onClick={() => setStep('restaurant')} />
          <ServiceCard icon="💆" title="Spa & Wellness" subtitle="Book a massage or treatment" onClick={() => setStep('spa')} />
          <ServiceCard icon="🚕" title="Hire a Cab" subtitle="Book a ride from the hotel" onClick={() => setStep('cab')} />
          <button className="mt-2 text-xs text-cream-50/40 underline" onClick={onExit}>
            Back to Menu
          </button>
        </div>
      )}

      {step === 'restaurant' && (
        <RestaurantFlow
          dietaryPreference={activeGuest.memory.dietaryPreference}
          onBack={() => setStep('hub')}
          onConfirm={(time, partySize) => {
            requestConcierge({
              bookingId: activeBooking.id,
              guestId: activeGuest.id,
              hotelId,
              type: 'restaurant_booking',
              details: `Table for ${partySize} at ${time}`,
            });
            setConfirmation(`Table for ${partySize} reserved at ${time}. AnA IQ has shared your dining preferences with the restaurant.`);
            setStep('confirmed');
          }}
        />
      )}

      {step === 'spa' && (
        <SpaFlow
          isVip={activeGuest.isVip}
          onBack={() => setStep('hub')}
          onConfirm={(treatment, time) => {
            requestConcierge({
              bookingId: activeBooking.id,
              guestId: activeGuest.id,
              hotelId,
              type: 'spa_booking',
              details: `${treatment.label} at ${time}`,
            });
            postCharge({ bookingId: activeBooking.id, description: `Spa — ${treatment.label}`, category: 'add_on', amount: treatment.price });
            setConfirmation(`${treatment.label} booked for ${time}. ${formatINR(treatment.price)} has been charged to your room.`);
            setStep('confirmed');
          }}
        />
      )}

      {step === 'cab' && (
        <CabFlow
          onBack={() => setStep('hub')}
          onConfirm={(destination, carType, chargeToRoom) => {
            if (chargeToRoom) {
              postCharge({ bookingId: activeBooking.id, description: `Cab to ${destination} (${carType.label})`, category: 'transport', amount: carType.price });
            }
            requestConcierge({
              bookingId: activeBooking.id,
              guestId: activeGuest.id,
              hotelId,
              type: 'taxi',
              details: `${carType.label} to ${destination} — ${chargeToRoom ? 'charged to room' : 'pay driver'}`,
            });
            setConfirmation(
              `Your ${carType.label} to ${destination} is on its way. ${
                chargeToRoom ? `${formatINR(carType.price)} charged to your room.` : `Pay the driver ${formatINR(carType.price)} directly.`
              }`,
            );
            setStep('confirmed');
          }}
        />
      )}

      {step === 'confirmed' && (
        <div className="mt-8 flex w-full flex-col items-center gap-4">
          <span className="text-4xl">✅</span>
          <p className="font-display text-lg font-semibold text-cream-50">Request Confirmed</p>
          <p className="max-w-xs text-sm text-cream-50/70">{confirmation}</p>
          <Button variant="secondary" onClick={() => setStep('hub')}>
            Book Another Service
          </Button>
          <button className="text-xs text-cream-50/40 underline" onClick={onExit}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl2 border border-white/10 bg-white/5 px-4 py-3.5 text-left hover:bg-white/10"
    >
      <span className="text-3xl">{icon}</span>
      <span>
        <p className="font-display text-sm font-semibold text-cream-50">{title}</p>
        <p className="text-xs text-cream-50/50">{subtitle}</p>
      </span>
    </button>
  );
}

function RestaurantFlow({
  dietaryPreference,
  onBack,
  onConfirm,
}: {
  dietaryPreference: string;
  onBack: () => void;
  onConfirm: (time: string, partySize: number) => void;
}) {
  const [time, setTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-4">
      <p className="text-sm text-cream-50/70">Reserve a table at the in-house restaurant</p>
      {dietaryPreference !== 'no_preference' && (
        <Badge tone="gold">AYANA Memory: {dietaryPreference.replace('_', ' ')} noted for the restaurant</Badge>
      )}
      <div className="flex w-full flex-wrap justify-center gap-2">
        {TIME_SLOTS.map((t) => (
          <button
            key={t}
            onClick={() => setTime(t)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              time === t ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-white/15 text-cream-50/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-cream-50/60">Party size</span>
        <button className="h-8 w-8 rounded-full border border-white/20 text-cream-50" onClick={() => setPartySize((n) => Math.max(1, n - 1))}>
          −
        </button>
        <span className="font-display text-lg font-semibold text-cream-50">{partySize}</span>
        <button className="h-8 w-8 rounded-full border border-white/20 text-cream-50" onClick={() => setPartySize((n) => Math.min(10, n + 1))}>
          +
        </button>
      </div>
      <Button fullWidth size="lg" disabled={!time} onClick={() => time && onConfirm(time, partySize)}>
        Reserve Table
      </Button>
      <button className="text-xs text-cream-50/40 underline" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function SpaFlow({
  isVip,
  onBack,
  onConfirm,
}: {
  isVip: boolean;
  onBack: () => void;
  onConfirm: (treatment: (typeof SPA_TREATMENTS)[number], time: string) => void;
}) {
  const [treatment, setTreatment] = useState<(typeof SPA_TREATMENTS)[number] | null>(null);
  const [time, setTime] = useState<string | null>(null);

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-4">
      <p className="text-sm text-cream-50/70">Book a spa treatment</p>
      <div className="flex w-full flex-col gap-2">
        {SPA_TREATMENTS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTreatment(t)}
            className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm ${
              treatment?.id === t.id ? 'border-gold-500 bg-gold-500/10 text-cream-50' : 'border-white/15 text-cream-50/70'
            }`}
          >
            <span>
              {t.label}
              {isVip && t.id === 'deep_tissue' && <AnaIqMark className="ml-2 !bg-gold-500/10 !text-gold-300" />}
            </span>
            <span className="text-xs text-cream-50/50">{formatINR(t.price)}</span>
          </button>
        ))}
      </div>
      <div className="flex w-full flex-wrap justify-center gap-2">
        {TIME_SLOTS.map((t) => (
          <button
            key={t}
            onClick={() => setTime(t)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              time === t ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-white/15 text-cream-50/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <Button fullWidth size="lg" disabled={!treatment || !time} onClick={() => treatment && time && onConfirm(treatment, time)}>
        Book Treatment
      </Button>
      <button className="text-xs text-cream-50/40 underline" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function CabFlow({
  onBack,
  onConfirm,
}: {
  onBack: () => void;
  onConfirm: (destination: string, carType: (typeof CAB_TYPES)[number], chargeToRoom: boolean) => void;
}) {
  const [stage, setStage] = useState<'destination' | 'car' | 'payment'>('destination');
  const [destination, setDestination] = useState('');
  const [carType, setCarType] = useState<(typeof CAB_TYPES)[number] | null>(null);

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-4">
      {stage === 'destination' && (
        <>
          <p className="text-sm text-cream-50/70">Where would you like to go?</p>
          <input
            autoFocus
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Kempegowda International Airport"
            className="w-full rounded-lg border border-white/15 bg-ink-900 px-4 py-3 text-center text-sm text-cream-50"
          />
          <p className="text-[11px] text-cream-50/40">📍 Locating pickup point at the hotel entrance…</p>
          <Button fullWidth size="lg" disabled={!destination.trim()} onClick={() => setStage('car')}>
            Continue
          </Button>
        </>
      )}

      {stage === 'car' && (
        <>
          <p className="text-sm text-cream-50/70">Choose your car</p>
          <div className="flex w-full flex-col gap-2">
            {CAB_TYPES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCarType(c)}
                className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm ${
                  carType?.id === c.id ? 'border-gold-500 bg-gold-500/10 text-cream-50' : 'border-white/15 text-cream-50/70'
                }`}
              >
                <span>🚗 {c.label}</span>
                <span className="text-xs text-cream-50/50">{formatINR(c.price)} est.</span>
              </button>
            ))}
          </div>
          <Button fullWidth size="lg" disabled={!carType} onClick={() => setStage('payment')}>
            Book {carType?.label ?? 'Cab'}
          </Button>
        </>
      )}

      {stage === 'payment' && carType && (
        <>
          <p className="text-sm text-cream-50/70">How would you like to pay?</p>
          <div className="flex w-full flex-col gap-2">
            <Button fullWidth onClick={() => onConfirm(destination, carType, true)}>
              Charge {formatINR(carType.price)} to Room
            </Button>
            <Button fullWidth variant="secondary" onClick={() => onConfirm(destination, carType, false)}>
              Pay Driver in Cash
            </Button>
          </div>
        </>
      )}

      <button className="text-xs text-cream-50/40 underline" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
