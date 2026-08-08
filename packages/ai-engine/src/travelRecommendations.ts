import type { AyanaMemory, Hotel, HotelCity } from '@ayana/shared-types';

export interface LocalTip {
  id: string;
  title: string;
  description: string;
  /** Rough travel time from the hotel, shown so the guest can judge feasibility. */
  distance: string;
  icon: string;
  /** Why the AI surfaced this for *this* guest — shown as the reasoning line. */
  reason: string;
}

export interface NextTripIdea {
  id: string;
  destination: string;
  /** The city an AYANA partner hotel sits in, when we have inventory there. */
  matchedCity: HotelCity | null;
  description: string;
  travelTime: string;
  bestFor: string;
  icon: string;
  reason: string;
}

const SIGHTSEEING: Record<HotelCity, LocalTip[]> = {
  Bengaluru: [
    { id: 'blr_s1', title: 'Lalbagh Botanical Garden', description: 'A 240-acre garden with the glass house and a rock older than the city itself.', distance: '20 min', icon: '🌳', reason: '' },
    { id: 'blr_s2', title: 'Bangalore Palace', description: 'Tudor-revival palace with an audio tour through the Wodeyar collection.', distance: '25 min', icon: '🏰', reason: '' },
    { id: 'blr_s3', title: 'Cubbon Park & State Museum', description: 'Shaded morning walk with the museum and library at its centre.', distance: '15 min', icon: '🏛️', reason: '' },
    { id: 'blr_s4', title: 'Commercial Street', description: 'Dense shopping lanes for textiles, silver and street snacks.', distance: '30 min', icon: '🛍️', reason: '' },
  ],
  Hyderabad: [
    { id: 'hyd_s1', title: 'Charminar & Laad Bazaar', description: 'The 16th-century monument with the bangle market wrapped around it.', distance: '35 min', icon: '🕌', reason: '' },
    { id: 'hyd_s2', title: 'Golconda Fort', description: 'Hilltop fort famous for its acoustics — a clap at the gate carries to the top.', distance: '40 min', icon: '🏯', reason: '' },
    { id: 'hyd_s3', title: 'Hussain Sagar & Necklace Road', description: 'Lakeside promenade with the monolithic Buddha statue mid-water.', distance: '20 min', icon: '🌊', reason: '' },
    { id: 'hyd_s4', title: 'Ramoji Film City', description: "The world's largest film studio complex — a full day out.", distance: '1 hr 15 min', icon: '🎬', reason: '' },
  ],
};

const DINING: Record<HotelCity, LocalTip[]> = {
  Bengaluru: [
    { id: 'blr_d1', title: 'MTR 1924', description: 'Institution-grade South Indian breakfast — the rava idli was invented here.', distance: '20 min', icon: '🍛', reason: '' },
    { id: 'blr_d2', title: 'Toit Brewpub', description: 'Craft brewery in Indiranagar, strong vegetarian small plates.', distance: '15 min', icon: '🍺', reason: '' },
    { id: 'blr_d3', title: 'Nagarjuna', description: 'Andhra thali served on banana leaf — go hungry.', distance: '18 min', icon: '🌶️', reason: '' },
    { id: 'blr_d4', title: 'The Permit Room', description: 'Modern South Indian plates, good for a relaxed business dinner.', distance: '22 min', icon: '🍽️', reason: '' },
  ],
  Hyderabad: [
    { id: 'hyd_d1', title: 'Paradise Biryani', description: 'The name most associated with Hyderabadi dum biryani.', distance: '25 min', icon: '🍚', reason: '' },
    { id: 'hyd_d2', title: 'Chutneys', description: 'All-vegetarian South Indian, famous for its chutney flight.', distance: '15 min', icon: '🥥', reason: '' },
    { id: 'hyd_d3', title: 'Ohri’s Jiva Imperia', description: 'Nizami fine dining with a courtyard setting.', distance: '20 min', icon: '🍽️', reason: '' },
    { id: 'hyd_d4', title: 'Nimrah Café', description: 'Irani chai and Osmania biscuits in the shadow of Charminar.', distance: '35 min', icon: '☕', reason: '' },
  ],
};

const NEXT_TRIPS: Record<HotelCity, NextTripIdea[]> = {
  Bengaluru: [
    { id: 'blr_t1', destination: 'Mysuru', matchedCity: null, description: 'Palace city with Chamundi Hill and the Devaraja market.', travelTime: '3 hr drive', bestFor: 'Weekend heritage break', icon: '🏰', reason: '' },
    { id: 'blr_t2', destination: 'Coorg', matchedCity: null, description: 'Coffee-estate hill country with waterfalls and homestays.', travelTime: '5 hr drive', bestFor: 'Slow nature escape', icon: '☕', reason: '' },
    { id: 'blr_t3', destination: 'Hampi', matchedCity: null, description: 'UNESCO ruins of the Vijayanagara empire across a boulder landscape.', travelTime: '6 hr drive', bestFor: 'History and photography', icon: '🛕', reason: '' },
    { id: 'blr_t4', destination: 'Hyderabad', matchedCity: 'Hyderabad', description: 'Charminar, Golconda and the biryani trail — AYANA partner hotels available.', travelTime: '1 hr flight', bestFor: 'City break with AYANA check-in', icon: '🕌', reason: '' },
  ],
  Hyderabad: [
    { id: 'hyd_t1', destination: 'Warangal', matchedCity: null, description: 'Kakatiya-era temples and the Thousand Pillar Temple complex.', travelTime: '3 hr drive', bestFor: 'Temple architecture', icon: '🛕', reason: '' },
    { id: 'hyd_t2', destination: 'Srisailam', matchedCity: null, description: 'Hill temple town inside a tiger reserve on the Krishna river.', travelTime: '5 hr drive', bestFor: 'Pilgrimage and wildlife', icon: '🌄', reason: '' },
    { id: 'hyd_t3', destination: 'Bidar', matchedCity: null, description: 'Bidriware craft town with a hilltop fort and Bahmani tombs.', travelTime: '2.5 hr drive', bestFor: 'Craft and heritage', icon: '🏯', reason: '' },
    { id: 'hyd_t4', destination: 'Bengaluru', matchedCity: 'Bengaluru', description: 'Gardens, breweries and the tech corridor — AYANA partner hotels available.', travelTime: '1 hr flight', bestFor: 'City break with AYANA check-in', icon: '🌳', reason: '' },
  ],
};

/** Sightseeing near the hotel, ordered so the guest's trip purpose leads. */
export function recommendSightseeing(city: HotelCity, memory: AyanaMemory, limit = 3): LocalTip[] {
  const tips = SIGHTSEEING[city] ?? [];
  const businessFirst = memory.businessOrLeisure === 'business';

  return [...tips]
    .map((tip) => ({
      ...tip,
      reason: businessFirst
        ? 'Close to the hotel — fits a short evening window between meetings.'
        : 'Matches the leisure trip on your AYANA profile.',
    }))
    .sort((a, b) => (businessFirst ? a.distance.length - b.distance.length : 0))
    .slice(0, limit);
}

/** Nearby restaurants, filtered against the guest's stored dietary preference. */
export function recommendLocalDining(city: HotelCity, memory: AyanaMemory, limit = 3): LocalTip[] {
  const tips = DINING[city] ?? [];
  const vegetarian = memory.dietaryPreference === 'vegetarian' || memory.dietaryPreference === 'jain' || memory.dietaryPreference === 'vegan';

  const vegFriendlyIds = new Set(['blr_d1', 'blr_d2', 'blr_d3', 'hyd_d2', 'hyd_d4']);

  return tips
    .filter((tip) => (vegetarian ? vegFriendlyIds.has(tip.id) : true))
    .map((tip) => ({
      ...tip,
      reason: vegetarian
        ? `Strong ${memory.dietaryPreference.replace('_', ' ')} menu — from your AYANA Memory.`
        : 'Popular with AYANA guests staying in this area.',
    }))
    .slice(0, limit);
}

/**
 * Where this guest is statistically likely to head next from the city they're in.
 * Ideas that map onto a city where AYANA has partner inventory are surfaced first —
 * that's the conversion path from one stay into the next booking.
 */
export function recommendNextTrips(city: HotelCity, memory: AyanaMemory, limit = 3): NextTripIdea[] {
  const ideas = NEXT_TRIPS[city] ?? [];
  const leisure = memory.businessOrLeisure !== 'business';

  return [...ideas]
    .map((idea) => ({
      ...idea,
      reason: idea.matchedCity
        ? 'AYANA partner hotels here — book with the same one-tap check-in.'
        : leisure
          ? `Popular onward trip from ${city} for leisure travellers.`
          : `A common add-on weekend for business guests visiting ${city}.`,
    }))
    .sort((a, b) => Number(Boolean(b.matchedCity)) - Number(Boolean(a.matchedCity)))
    .slice(0, limit);
}

/** Partner hotels AYANA can actually sell in a destination city, best-rated first. */
export function hotelsInCity(hotels: Hotel[], city: HotelCity, limit = 3): Hotel[] {
  return hotels
    .filter((h) => h.city === city)
    .sort((a, b) => b.reviewRating - a.reviewRating)
    .slice(0, limit);
}
