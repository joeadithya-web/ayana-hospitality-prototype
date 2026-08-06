import type { Booking, GuestFeedback } from '@ayana/shared-types';
import { makeId, pick, seededRandom } from '@ayana/shared-utils';

const COMMENTS_BY_RATING: Record<number, string[]> = {
  5: ['Seamless check-in, exactly matched my AYANA Memory preferences.', 'Room was ready before I even arrived — impressive.'],
  4: ['Great stay overall, minor wait for airport pickup.', 'Comfortable room, friendly staff.'],
  3: ['Decent stay, room readiness took a bit longer than expected.'],
};

/** Seed plausible historical feedback for already-checked-out stays, so Reports has real data on day one. */
export function generateFeedbackForPastBookings(bookings: Booking[]): GuestFeedback[] {
  const rng = seededRandom(5150);
  return bookings
    .filter((b) => b.status === 'checked_out')
    .filter(() => rng() < 0.7)
    .map((booking) => {
      const roll = rng();
      const rating = (roll < 0.55 ? 5 : roll < 0.85 ? 4 : 3) as 1 | 2 | 3 | 4 | 5;
      return {
        id: makeId('fb'),
        bookingId: booking.id,
        guestId: booking.guestId,
        hotelId: booking.hotelId,
        rating,
        comment: pick(rng, COMMENTS_BY_RATING[rating] ?? ['Good stay.']),
        submittedAt: booking.checkOutDate,
      };
    });
}
