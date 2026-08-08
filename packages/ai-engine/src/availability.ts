import type { Booking, Room, RoomCategory } from '@ayana/shared-types';

/** True when two date ranges intersect. Half-open: a checkout on the day of another check-in doesn't clash. */
export function overlaps(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return new Date(aIn).getTime() < new Date(bOut).getTime() && new Date(bIn).getTime() < new Date(aOut).getTime();
}

export interface CategoryAvailability {
  category: RoomCategory;
  totalRooms: number;
  availableRooms: number;
}

/** Bookings that hold inventory. A pending_payment booking hasn't secured anything yet. */
function holdsInventory(status: Booking['status']): boolean {
  return status === 'confirmed' || status === 'checked_in';
}

/**
 * How many rooms of a category can still be sold for a date range.
 *
 * Counts competing *bookings*, not the specific rooms they hold: at browse time almost
 * every future booking has `roomId: null` because AYANA sells a category and allocates
 * the physical room close to arrival. Counting held room IDs — the approach
 * `evaluateRoomAllocation` uses near arrival, where rooms are assigned — would report
 * everything as free here.
 *
 * Deliberately ignores `room.status`: ready/dirty/cleaning describes a room *today*, not
 * its capacity next week. A room being cleaned right now is still sellable for a future stay.
 */
export function categoryAvailability(
  hotelId: string,
  category: RoomCategory,
  checkInDate: string,
  checkOutDate: string,
  rooms: Room[],
  bookings: Booking[],
): CategoryAvailability {
  const totalRooms = rooms.filter((r) => r.hotelId === hotelId && r.category === category).length;

  const competing = bookings.filter(
    (b) =>
      b.hotelId === hotelId &&
      b.roomCategory === category &&
      holdsInventory(b.status) &&
      overlaps(b.checkInDate, b.checkOutDate, checkInDate, checkOutDate),
  ).length;

  return { category, totalRooms, availableRooms: Math.max(0, totalRooms - competing) };
}

/** Every category at a hotel, with live availability for the requested dates. */
export function hotelAvailability(
  hotelId: string,
  checkInDate: string,
  checkOutDate: string,
  rooms: Room[],
  bookings: Booking[],
): CategoryAvailability[] {
  const categories = [...new Set(rooms.filter((r) => r.hotelId === hotelId).map((r) => r.category))];
  return categories.map((category) => categoryAvailability(hotelId, category, checkInDate, checkOutDate, rooms, bookings));
}

/** Whether anything at all can be sold at this hotel for the requested dates. */
export function hotelHasAvailability(
  hotelId: string,
  checkInDate: string,
  checkOutDate: string,
  rooms: Room[],
  bookings: Booking[],
): boolean {
  return hotelAvailability(hotelId, checkInDate, checkOutDate, rooms, bookings).some((a) => a.availableRooms > 0);
}

/**
 * Whether a hotel can host a party of this size for these dates — a room must be both
 * free and big enough. Used to keep a 4-guest search off properties whose only free
 * rooms sleep two.
 */
export function hotelCanHostParty(
  hotelId: string,
  checkInDate: string,
  checkOutDate: string,
  guestsCount: number,
  rooms: Room[],
  bookings: Booking[],
): boolean {
  return hotelAvailability(hotelId, checkInDate, checkOutDate, rooms, bookings).some((a) => {
    if (a.availableRooms <= 0) return false;
    const maxOccupancy = Math.max(
      0,
      ...rooms.filter((r) => r.hotelId === hotelId && r.category === a.category).map((r) => r.maxOccupancy),
    );
    return maxOccupancy >= guestsCount;
  });
}
