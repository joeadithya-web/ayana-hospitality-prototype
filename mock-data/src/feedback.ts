import type { Booking, CsiScore, GuestFeedback } from '@ayana/shared-types';
import { makeId, pick, seededRandom } from '@ayana/shared-utils';

const COMMENTS_BY_SCORE: Record<number, string[]> = {
  10: ['Seamless check-in, exactly matched my AYANA Memory preferences.', 'Room was ready before I even arrived — impressive.'],
  9: ['Great stay overall, minor wait for airport pickup.', 'Comfortable room, friendly staff.'],
  7: ['Decent stay, room readiness took a bit longer than expected.'],
};

/** Same fixed mapping as `deriveStarRatingFromCsi` in @ayana/ai-engine, duplicated here so
 * mock-data doesn't need a dependency on that package for one small derivation. */
function starRatingForCsi(score: CsiScore): 1 | 2 | 3 | 4 | 5 {
  if (score <= 3) return 1;
  if (score <= 5) return 2;
  if (score <= 7) return 3;
  if (score === 8) return 4;
  return 5;
}

/** Seed plausible historical feedback for already-checked-out stays, so Reports has real data on day one. */
export function generateFeedbackForPastBookings(bookings: Booking[]): GuestFeedback[] {
  const rng = seededRandom(5150);
  return bookings
    .filter((b) => b.status === 'checked_out')
    // Deliberately left unrated — see the 'bkg_demo_overdue_feedback' seed in bookings.ts,
    // which exists specifically to demonstrate the feedback-reminder flow.
    .filter((b) => b.id !== 'bkg_demo_overdue_feedback')
    .filter(() => rng() < 0.7)
    .map((booking) => {
      const roll = rng();
      const csiScore = (roll < 0.55 ? 10 : roll < 0.85 ? 9 : 7) as CsiScore;
      return {
        id: makeId('fb'),
        bookingId: booking.id,
        guestId: booking.guestId,
        hotelId: booking.hotelId,
        csiScore,
        derivedStarRating: starRatingForCsi(csiScore),
        comment: pick(rng, COMMENTS_BY_SCORE[csiScore] ?? ['Good stay.']),
        submittedAt: booking.checkOutDate,
      };
    });
}
