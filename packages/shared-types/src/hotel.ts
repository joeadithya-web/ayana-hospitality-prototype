export type StarRating = 3 | 4 | 5;

export type HotelSegment = 'business' | 'airport' | 'leisure';

export type HotelCity = 'Bengaluru' | 'Hyderabad';

export interface Hotel {
  id: string;
  name: string;
  /** e.g. "Springs by JORA" for the flagship demo hotel; undefined for the other 14 mock hotels. */
  brand?: string;
  isFlagship: boolean;
  city: HotelCity;
  starRating: StarRating;
  segment: HotelSegment[];
  address: string;
  amenities: string[];
  images: string[];
  description: string;
  reviewRating: number;
  reviewCount: number;
  priceFloor: number;
  /** Always 'simulated' in the PT — no real PMS connection. */
  pmsIntegration: 'simulated';
}
