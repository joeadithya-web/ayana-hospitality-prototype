import type { CsiScore, GuestFeedback, Hotel } from '@ayana/shared-types';

/**
 * Fixed mapping from the guest-facing 1-10 Customer Satisfaction Index to the internal 1-5
 * star scale hotel management already thinks in. Covers the full 1-10 range with no gap.
 */
export function deriveStarRatingFromCsi(score: CsiScore): 1 | 2 | 3 | 4 | 5 {
  if (score <= 3) return 1;
  if (score <= 5) return 2;
  if (score <= 7) return 3;
  if (score === 8) return 4;
  return 5;
}

/**
 * Standard Net Promoter Score: promoters (9-10) minus detractors (0-6), as a percentage of
 * all respondents. Passives (7-8) count toward the total but neither add nor subtract.
 * Returns null when there's no feedback yet, rather than a misleading 0.
 */
export function calculateNps(feedback: GuestFeedback[]): number | null {
  if (feedback.length === 0) return null;
  const promoters = feedback.filter((f) => f.csiScore >= 9).length;
  const detractors = feedback.filter((f) => f.csiScore <= 6).length;
  return Math.round(((promoters - detractors) / feedback.length) * 100);
}

export interface HotelGuestRating {
  rating: number;
  reviewCount: number;
  /** True when this is computed from real submitted feedback; false when it's the static seed fallback. */
  isLive: boolean;
}

/**
 * The rating guests actually see and hotels get ranked by. Prefers real guest feedback
 * (average derivedStarRating, rounded to the nearest 0.5) once any exists for a hotel;
 * falls back to the hotel's static seeded reviewRating so a brand-new property never shows
 * a blank "no reviews" state.
 */
export function computeHotelGuestRating(hotelId: string, feedback: GuestFeedback[], hotel: Hotel): HotelGuestRating {
  const hotelFeedback = feedback.filter((f) => f.hotelId === hotelId);
  if (hotelFeedback.length === 0) {
    return { rating: hotel.reviewRating, reviewCount: hotel.reviewCount, isLive: false };
  }
  const avg = hotelFeedback.reduce((sum, f) => sum + f.derivedStarRating, 0) / hotelFeedback.length;
  return { rating: Math.round(avg * 2) / 2, reviewCount: hotelFeedback.length, isLive: true };
}
