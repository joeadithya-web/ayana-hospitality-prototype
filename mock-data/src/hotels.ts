import type { Hotel, HotelCity, HotelSegment, StarRating } from '@ayana/shared-types';

interface HotelSeed {
  id: string;
  name: string;
  brand?: string;
  isFlagship?: boolean;
  city: HotelCity;
  starRating: StarRating;
  segment: HotelSegment[];
  area: string;
  priceFloor: number;
}

const HOTEL_SEEDS: HotelSeed[] = [
  { id: 'htl_springs', name: 'Springs', brand: 'Springs by JORA', isFlagship: true, city: 'Bengaluru', starRating: 5, segment: ['business', 'airport'], area: 'Whitefield', priceFloor: 8500 },
  { id: 'htl_meridian_blr', name: 'Meridian Grand Bengaluru', city: 'Bengaluru', starRating: 5, segment: ['business', 'leisure'], area: 'MG Road', priceFloor: 9200 },
  { id: 'htl_orchid_blr', name: 'Orchid Business Suites', city: 'Bengaluru', starRating: 4, segment: ['business'], area: 'Koramangala', priceFloor: 5400 },
  { id: 'htl_windsor_blr', name: 'Windsor Airport Inn', city: 'Bengaluru', starRating: 3, segment: ['airport'], area: 'Devanahalli', priceFloor: 3200 },
  { id: 'htl_palladian_blr', name: 'The Palladian Bengaluru', city: 'Bengaluru', starRating: 5, segment: ['leisure', 'business'], area: 'Lavelle Road', priceFloor: 9800 },
  { id: 'htl_cedar_blr', name: 'Cedar Park Residency', city: 'Bengaluru', starRating: 3, segment: ['business'], area: 'HSR Layout', priceFloor: 3600 },
  { id: 'htl_lakeview_blr', name: 'Lakeview Business Hotel', city: 'Bengaluru', starRating: 4, segment: ['business'], area: 'Hebbal', priceFloor: 5800 },
  { id: 'htl_skyline_blr', name: 'Skyline Tech Park Hotel', city: 'Bengaluru', starRating: 4, segment: ['business', 'airport'], area: 'Electronic City', priceFloor: 5600 },
  { id: 'htl_pearl_hyd', name: 'Pearl Crescent Hyderabad', city: 'Hyderabad', starRating: 5, segment: ['business'], area: 'Banjara Hills', priceFloor: 9000 },
  { id: 'htl_hitec_hyd', name: 'HITEC Grand Hotel', city: 'Hyderabad', starRating: 4, segment: ['business'], area: 'HITEC City', priceFloor: 5500 },
  { id: 'htl_nizam_hyd', name: 'Nizam Heritage Suites', city: 'Hyderabad', starRating: 5, segment: ['leisure'], area: 'Old City', priceFloor: 8800 },
  { id: 'htl_airport_hyd', name: 'Airport Gateway Hyderabad', city: 'Hyderabad', starRating: 3, segment: ['airport'], area: 'Shamshabad', priceFloor: 3100 },
  { id: 'htl_cyber_hyd', name: 'Cyber Towers Residency', city: 'Hyderabad', starRating: 4, segment: ['business'], area: 'Gachibowli', priceFloor: 5700 },
  { id: 'htl_golconda_hyd', name: 'Golconda Business Hotel', city: 'Hyderabad', starRating: 3, segment: ['business'], area: 'Begumpet', priceFloor: 3300 },
  { id: 'htl_banjara_hyd', name: 'Banjara Hills Boutique', city: 'Hyderabad', starRating: 4, segment: ['leisure', 'business'], area: 'Banjara Hills', priceFloor: 6200 },
];

const AMENITIES_BY_STAR: Record<StarRating, string[]> = {
  3: ['Free Wi-Fi', 'Restaurant', '24-hour Front Desk', 'Airport Shuttle', 'Parking'],
  4: ['Free Wi-Fi', 'Rooftop Restaurant', 'Fitness Centre', 'Business Centre', 'Bar', 'Parking', 'Airport Shuttle'],
  5: ['Free Wi-Fi', 'Spa & Wellness', 'Multiple Dining Options', 'Infinity Pool', 'Concierge', 'Valet Parking', 'Executive Lounge', 'Banquet Halls'],
};

export function generateHotels(): Hotel[] {
  return HOTEL_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.brand ?? seed.name,
    brand: seed.brand,
    isFlagship: Boolean(seed.isFlagship),
    city: seed.city,
    starRating: seed.starRating,
    segment: seed.segment,
    address: `${seed.area}, ${seed.city}`,
    amenities: AMENITIES_BY_STAR[seed.starRating],
    images: [0, 1, 2, 3, 4, 5].map((i) => `https://picsum.photos/seed/${seed.id}-${i}/900/600`),
    description: seed.isFlagship
      ? `Springs by JORA in ${seed.area}, ${seed.city} is AYANA's flagship partner property — a ${seed.starRating}-star ${seed.segment.join('/')} hotel built around the full Home-to-Room journey.`
      : `A ${seed.starRating}-star ${seed.segment.join('/')} hotel in ${seed.area}, ${seed.city}, partnered with AYANA for a seamless guest journey.`,
    reviewRating: Math.round((3.6 + seed.starRating * 0.25) * 10) / 10,
    reviewCount: 120 + seed.starRating * 87,
    priceFloor: seed.priceFloor,
    pmsIntegration: 'simulated',
  }));
}
