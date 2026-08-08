import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { hotelCanHostParty, hotelHasAvailability } from '@ayana/ai-engine';
import { Badge, Card, PageHeader } from '@ayana/shared-ui';
import type { HotelCity, HotelSegment, StarRating } from '@ayana/shared-types';
import { TravellerShell } from '../TravellerShell';
import { TripCriteriaBar } from '../components/TripCriteriaBar';
import { useTripSearchStore } from '../tripSearchStore';

const CITIES: HotelCity[] = ['Bengaluru', 'Hyderabad'];
const STAR_OPTIONS: StarRating[] = [3, 4, 5];
const SEGMENT_OPTIONS: HotelSegment[] = ['business', 'airport', 'leisure'];

export function Search() {
  const navigate = useNavigate();
  const hotels = useSimulationStore((s) => s.hotels);
  const rooms = useSimulationStore((s) => s.rooms);
  const bookings = useSimulationStore((s) => s.bookings);
  const { checkInDate, checkOutDate, guestsCount } = useTripSearchStore();

  const [nameQuery, setNameQuery] = useState('');
  const [city, setCity] = useState<HotelCity | 'all'>('all');
  const [stars, setStars] = useState<Set<StarRating>>(new Set());
  const [segments, setSegments] = useState<Set<HotelSegment>>(new Set());
  const [maxPrice, setMaxPrice] = useState(10000);

  const query = nameQuery.trim().toLowerCase();
  const isNameSearch = query.length > 0;

  /**
   * Two modes. Browsing by filters only surfaces what's actually bookable — showing a
   * hotel that can't take the booking wastes the guest's time. But a guest who names a
   * specific hotel is asking about *that* hotel, so it's always shown, marked unavailable
   * rather than silently missing, which would read as a broken search.
   */
  const results = useMemo(() => {
    if (isNameSearch) {
      return hotels.filter((h) => h.name.toLowerCase().includes(query));
    }
    return hotels.filter((hotel) => {
      if (city !== 'all' && hotel.city !== city) return false;
      if (stars.size > 0 && !stars.has(hotel.starRating)) return false;
      if (segments.size > 0 && !hotel.segment.some((s) => segments.has(s))) return false;
      if (hotel.priceFloor > maxPrice) return false;
      return hotelCanHostParty(hotel.id, checkInDate, checkOutDate, guestsCount, rooms, bookings);
    });
  }, [hotels, rooms, bookings, isNameSearch, query, city, stars, segments, maxPrice, checkInDate, checkOutDate, guestsCount]);

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  return (
    <TravellerShell active="search">
      <PageHeader
        title="Search Hotels"
        subtitle={isNameSearch ? `${results.length} matching "${nameQuery.trim()}"` : `${results.length} available for your dates`}
      />

      <div className="flex flex-col gap-4 px-5">
        <TripCriteriaBar />

        <input
          className="rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm"
          placeholder="🔍 Search a hotel by name"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
        />

        {isNameSearch ? (
          <p className="-mt-2 text-[11px] text-ink-700/50">
            Showing every match by name, including properties with no rooms for these dates.{' '}
            <button className="underline" onClick={() => setNameQuery('')}>
              Clear to browse
            </button>
          </p>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', ...CITIES] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`flex-none rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                    city === c ? 'border-ink-950 bg-ink-950 text-cream-50' : 'border-ink-900/15 text-ink-700/70'
                  }`}
                >
                  {c === 'all' ? 'All Cities' : c}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {STAR_OPTIONS.map((star) => (
                <button
                  key={star}
                  onClick={() => toggle(stars, star, setStars)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    stars.has(star) ? 'border-gold-500 bg-gold-500/15 text-gold-600' : 'border-ink-900/15 text-ink-700/60'
                  }`}
                >
                  {star}★
                </button>
              ))}
              {SEGMENT_OPTIONS.map((segment) => (
                <button
                  key={segment}
                  onClick={() => toggle(segments, segment, setSegments)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                    segments.has(segment) ? 'border-springs-500 bg-springs-500/10 text-springs-600' : 'border-ink-900/15 text-ink-700/60'
                  }`}
                >
                  {segment}
                </button>
              ))}
            </div>

            <label className="flex flex-col gap-1 text-xs text-ink-700/60">
              Max price per night: ₹{maxPrice.toLocaleString('en-IN')}
              <input type="range" min={2500} max={12000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
            </label>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 px-5 py-5">
        {results.map((hotel) => {
          const available = hotelHasAvailability(hotel.id, checkInDate, checkOutDate, rooms, bookings);
          const fitsParty = hotelCanHostParty(hotel.id, checkInDate, checkOutDate, guestsCount, rooms, bookings);
          const bookable = available && fitsParty;

          return (
            <Card
              key={hotel.id}
              className={`overflow-hidden !p-0 ${bookable ? 'cursor-pointer' : 'opacity-60'}`}
              onClick={() => bookable && navigate(`/traveller/hotel/${hotel.id}`)}
            >
              <img src={hotel.images[0]} alt={hotel.name} className={`h-36 w-full object-cover ${bookable ? '' : 'grayscale'}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-semibold text-ink-950">{hotel.name}</p>
                    <p className="text-xs text-ink-700/50">{hotel.address}</p>
                  </div>
                  {hotel.isFlagship && <Badge tone="gold">Flagship</Badge>}
                </div>

                {!bookable && (
                  <div className="mt-2">
                    <Badge tone="warning">
                      {available ? `No rooms for ${guestsCount} guests on these dates` : 'Unavailable for these dates'}
                    </Badge>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-ink-700/60">
                    <Badge tone="neutral">{hotel.starRating}★</Badge>
                    <span>{hotel.reviewRating} ({hotel.reviewCount})</span>
                  </div>
                  <p className="text-sm font-semibold text-ink-900">from ₹{hotel.priceFloor.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </Card>
          );
        })}

        {results.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-700/50">
            {isNameSearch
              ? `No hotel matches "${nameQuery.trim()}".`
              : 'No hotels available for these dates and party size — try different dates.'}
          </p>
        )}
      </div>
    </TravellerShell>
  );
}
