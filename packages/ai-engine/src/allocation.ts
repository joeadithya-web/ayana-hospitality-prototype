import type { Booking, Guest, Room } from '@ayana/shared-types';
import { scoreRoomsForGuest } from './roomRecommendation';
import { overlaps } from './availability';

export type AllocationEvaluation =
  | { kind: 'allocate'; room: Room }
  | { kind: 'delayed' }
  | { kind: 'overbooked' };

/**
 * Decides what happens next for a booking still awaiting its specific room, purely from
 * live capacity vs. demand — never hardcoded. Three outcomes:
 *  - allocate: a matching, ready, uncontested room exists — assign it now.
 *  - delayed: enough physical rooms of the category exist, but none are ready yet
 *    (still being cleaned from a previous stay) — guest waits, resolves automatically
 *    once Housekeeping frees one up.
 *  - overbooked: confirmed demand for the category already meets or exceeds the hotel's
 *    physical room count for overlapping dates — needs Front Office to allocate an
 *    alternate (likely upgraded) room.
 */
export function evaluateRoomAllocation(booking: Booking, allBookings: Booking[], rooms: Room[], guest: Guest): AllocationEvaluation {
  const candidateRooms = rooms.filter((r) => r.hotelId === booking.hotelId && r.category === booking.roomCategory);
  if (candidateRooms.length === 0) return { kind: 'overbooked' };

  const activeCompeting = allBookings.filter(
    (b) =>
      b.id !== booking.id &&
      b.hotelId === booking.hotelId &&
      b.roomCategory === booking.roomCategory &&
      (b.status === 'confirmed' || b.status === 'checked_in') &&
      overlaps(b.checkInDate, b.checkOutDate, booking.checkInDate, booking.checkOutDate),
  );
  const heldRoomIds = new Set(activeCompeting.filter((b) => b.roomId).map((b) => b.roomId));
  const available = candidateRooms.filter((r) => !heldRoomIds.has(r.id));

  if (available.length === 0 || activeCompeting.length >= candidateRooms.length) {
    return { kind: 'overbooked' };
  }

  const readyAvailable = available.filter((r) => r.status === 'ready');
  if (readyAvailable.length === 0) {
    return { kind: 'delayed' };
  }

  const best = scoreRoomsForGuest(guest, readyAvailable)[0];
  return best ? { kind: 'allocate', room: best.room } : { kind: 'delayed' };
}
