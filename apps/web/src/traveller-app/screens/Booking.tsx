import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSimulationStore } from '@ayana/simulation-engine';
import { categoryAvailability, INTENT_CATALOG, INTENT_CATEGORY_LABEL, intentTaskSeedsForTemplate, intentTemplateById } from '@ayana/ai-engine';
import type { BedType, BookingIntent, IntentCategory, RoomCategory, RoomView } from '@ayana/shared-types';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { useCurrentCorporate, useCurrentGuest, useHotel, useRoomsForHotelAndCategory } from '../hooks';
import { useTripSearchStore } from '../tripSearchStore';

const INTENT_CATEGORIES = Array.from(new Set(INTENT_CATALOG.map((t) => t.category))) as IntentCategory[];

const schema = z.object({
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
  guestsCount: z.coerce.number().min(1).max(6),
  paymentTier: z.coerce.number().refine((v): v is 100 | 50 | 25 => v === 100 || v === 50 || v === 25),
});

type FormValues = z.infer<typeof schema>;

const BED_LABEL: Record<string, string> = { twin: 'Twin beds', double: 'Double bed', king: 'King bed' };

export function Booking() {
  const { hotelId, category, view, bedType } = useParams<{
    hotelId: string;
    category: RoomCategory;
    view: RoomView;
    bedType: BedType;
  }>();
  const navigate = useNavigate();
  const hotel = useHotel(hotelId);
  const guest = useCurrentGuest();
  const corporate = useCurrentCorporate();
  const matchingRooms = useRoomsForHotelAndCategory(hotelId, category);
  const allRooms = useSimulationStore((s) => s.rooms);
  const bookings = useSimulationStore((s) => s.bookings);
  const createBooking = useSimulationStore((s) => s.createBooking);
  const trip = useTripSearchStore();
  const [soldOut, setSoldOut] = useState(false);

  // Intent Engine — entirely optional. A guest who never touches this still books exactly
  // as before: intents stays [] and journeyGoal stays null.
  const [primaryIntentId, setPrimaryIntentId] = useState<string | null>(null);
  const [secondaryIntentId, setSecondaryIntentId] = useState<string | null>(null);
  const [journeyGoal, setJourneyGoal] = useState('');

  function toggleIntent(id: string) {
    if (primaryIntentId === id) {
      setPrimaryIntentId(secondaryIntentId);
      setSecondaryIntentId(null);
    } else if (secondaryIntentId === id) {
      setSecondaryIntentId(null);
    } else if (!primaryIntentId) {
      setPrimaryIntentId(id);
    } else {
      setSecondaryIntentId(id);
    }
  }

  const { register, handleSubmit, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // Carried through from Search rather than re-asked — the guest already chose these.
    defaultValues: {
      checkInDate: trip.checkInDate,
      checkOutDate: trip.checkOutDate,
      guestsCount: trip.guestsCount,
      paymentTier: 100,
    },
  });

  const values = watch();
  const nights = useMemo(() => {
    const inD = new Date(values.checkInDate);
    const outD = new Date(values.checkOutDate);
    const diff = Math.round((outD.getTime() - inD.getTime()) / 86_400_000);
    return diff > 0 ? diff : 1;
  }, [values.checkInDate, values.checkOutDate]);

  const publishedNightly = useMemo(() => {
    const exact = matchingRooms.filter((r) => r.view === view && r.bedType === bedType);
    const pool = exact.length > 0 ? exact : matchingRooms;
    if (pool.length === 0) return 0;
    const avg = pool.reduce((sum, r) => sum + r.basePrice, 0) / pool.length;
    return Math.round(avg / 100) * 100;
  }, [matchingRooms, view, bedType]);

  // A corporate booker pays their agreement's contracted rate, not the published one.
  const nightlyPrice = corporate
    ? Math.round((publishedNightly * (100 - corporate.negotiatedDiscountPercent)) / 100)
    : publishedNightly;

  const maxOccupancy = Math.max(2, ...matchingRooms.map((r) => r.maxOccupancy));

  if (!hotel || !guest || !category || !view || !bedType) return null;

  const total = nightlyPrice * nights;
  const dueNow = Math.round((total * values.paymentTier) / 100);

  function onSubmit(data: FormValues) {
    if (!guest || !hotel || !category || !view || !bedType) return;

    // Re-check against live state: dates are editable here, and another tab could have
    // taken the last room since this screen loaded.
    const availability = categoryAvailability(
      hotel.id,
      category,
      new Date(data.checkInDate).toISOString(),
      new Date(data.checkOutDate).toISOString(),
      allRooms,
      bookings,
    );
    if (availability.availableRooms <= 0) {
      setSoldOut(true);
      return;
    }
    setSoldOut(false);

    const intents: BookingIntent[] = [];
    if (primaryIntentId) intents.push({ templateId: primaryIntentId, role: 'primary', weightPercent: secondaryIntentId ? 70 : 100 });
    if (secondaryIntentId) intents.push({ templateId: secondaryIntentId, role: 'secondary', weightPercent: 30 });
    const primaryTemplate = primaryIntentId ? intentTemplateById(primaryIntentId) : undefined;

    const booking = createBooking({
      guestId: guest.id,
      hotelId: hotel.id,
      roomCategory: category,
      expectedView: view,
      expectedBedType: bedType,
      checkInDate: new Date(data.checkInDate).toISOString(),
      checkOutDate: new Date(data.checkOutDate).toISOString(),
      guestsCount: data.guestsCount,
      paymentTier: data.paymentTier as 100 | 50 | 25,
      corporateId: corporate?.id ?? null,
      intents,
      journeyGoal: journeyGoal.trim() || null,
      intentTaskSeeds: primaryTemplate?.deepBuilt ? intentTaskSeedsForTemplate(primaryTemplate.id) : [],
    });
    navigate(`/traveller/payment/${booking.id}`);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-28">
      <div className="mx-auto max-w-md">
        <PageHeader title="Confirm Stay" subtitle={hotel.name} onBack={() => navigate(-1)} />

        <form className="flex flex-col gap-4 px-5" onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <div className="flex items-start justify-between">
              <p className="font-medium capitalize text-ink-900">{category}</p>
              <div className="text-right">
                {corporate && publishedNightly > nightlyPrice && (
                  <p className="text-[11px] text-ink-700/40 line-through">₹{publishedNightly.toLocaleString('en-IN')}</p>
                )}
                <p className="text-sm font-semibold text-ink-900">₹{nightlyPrice.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-ink-700/40">Exclusive of Taxes</p>
              </div>
            </div>
            <p className="text-xs capitalize text-ink-700/50">
              {BED_LABEL[bedType]} · {view.replace('_', ' ')} view
            </p>
            {corporate && (
              <p className="mt-1.5 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-[11px] text-gold-600">
                {corporate.logoEmoji} {corporate.negotiatedDiscountPercent}% contracted rate — billed to {corporate.name}
              </p>
            )}
            <p className="mt-1 text-[11px] text-ink-700/40">
              Your exact room is assigned closer to arrival — not decided at booking.
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Check-in</span>
              <input type="date" className="rounded-lg border border-ink-900/15 px-3 py-2.5 text-sm" {...register('checkInDate')} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Check-out</span>
              <input type="date" className="rounded-lg border border-ink-900/15 px-3 py-2.5 text-sm" {...register('checkOutDate')} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Guests</span>
            <input type="number" min={1} max={maxOccupancy} className="rounded-lg border border-ink-900/15 px-3 py-2.5 text-sm" {...register('guestsCount')} />
          </label>

          <Card>
            <p className="text-sm font-medium text-ink-900">What's this trip for? (optional)</p>
            <p className="text-xs text-ink-700/50">
              Pick a primary purpose — and a secondary one if this trip is about more than one thing — and AYANA
              builds you a journey checklist for it.
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {INTENT_CATEGORIES.map((cat) => (
                <div key={cat} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-ink-700/40">{INTENT_CATEGORY_LABEL[cat]}</span>
                  <div className="flex flex-wrap gap-2">
                    {INTENT_CATALOG.filter((t) => t.category === cat).map((t) => {
                      const isPrimary = primaryIntentId === t.id;
                      const isSecondary = secondaryIntentId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleIntent(t.id)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            isPrimary
                              ? 'border-ink-950 bg-ink-950 text-cream-50'
                              : isSecondary
                                ? 'border-gold-500 bg-gold-500/15 text-gold-600'
                                : 'border-ink-900/15 text-ink-700/60'
                          }`}
                        >
                          {t.label}
                          {isPrimary && ' · Primary'}
                          {isSecondary && ' · Secondary'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {primaryIntentId && (
              <label className="mt-3 flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
                  What would make this journey successful?
                </span>
                <textarea
                  value={journeyGoal}
                  onChange={(e) => setJourneyGoal(e.target.value)}
                  rows={2}
                  placeholder="e.g. I have the biggest presentation of my career tomorrow."
                  className="rounded-lg border border-ink-900/15 px-3 py-2.5 text-sm"
                />
              </label>
            )}
          </Card>

          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Advance payment</span>
            <div className="mt-2 flex flex-col gap-2">
              {[
                { tier: 100, label: '100% — Room guaranteed for full stay' },
                { tier: 50, label: '50% — Held until 6 PM, up to 25% refund if released' },
                { tier: 25, label: '25% — Held until 6 PM, no refund if released' },
              ].map((opt) => (
                <label key={opt.tier} className="flex items-center gap-2 rounded-lg border border-ink-900/10 px-3 py-2.5 text-sm">
                  <input type="radio" value={opt.tier} {...register('paymentTier')} defaultChecked={opt.tier === 100} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <Card>
            <div className="flex justify-between text-sm text-ink-700/70">
              <span>{nights} night(s) × ₹{nightlyPrice.toLocaleString('en-IN')}</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-1 flex justify-between font-medium text-ink-900">
              <span>Due now ({values.paymentTier}%)</span>
              <span>₹{dueNow.toLocaleString('en-IN')}</span>
            </div>
            <Badge tone="neutral">All amounts simulated — no real charge</Badge>
          </Card>

          {soldOut && (
            <Card className="border-red-300 bg-red-50">
              <p className="text-sm font-medium text-red-700">No longer available</p>
              <p className="text-xs text-red-600/80">
                This category just sold out for the dates you picked. Change your dates, or go back and choose another
                category.
              </p>
            </Card>
          )}

          <Button type="submit" size="lg" fullWidth disabled={formState.isSubmitting}>
            Proceed to Payment
          </Button>
        </form>
      </div>
    </div>
  );
}
