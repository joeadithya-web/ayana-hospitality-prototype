import type { Booking, BookingStatus, Guest, Hotel, PaymentTier, Room, RoomCategory, RoomView } from '@ayana/shared-types';
import { makeId, pick, randomInt, seededRandom } from '@ayana/shared-utils';

const TODAY = new Date('2026-08-05T09:00:00+05:30');
const CATEGORIES: RoomCategory[] = ['standard', 'deluxe', 'executive', 'suite', 'presidential'];
const VIEWS: RoomView[] = ['city', 'garden', 'pool', 'front_facing', 'business_district'];

function daysFrom(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

function emptyReadyToRoom() {
  return {
    identityVerified: false,
    paymentVerified: false,
    roomReady: false,
    keyPathReady: false,
    pickupConfirmed: false,
    qrCode: null,
    estimatedArrival: null,
  };
}

function roomForHotel(rooms: Room[], hotelId: string, rng: () => number): Room {
  const hotelRooms = rooms.filter((r) => r.hotelId === hotelId);
  return pick(rng, hotelRooms);
}

/** The quoted price for a category is a hotel-level average — no specific room is known at booking time. */
function categoryPrice(rooms: Room[], hotelId: string, category: RoomCategory): number {
  const matches = rooms.filter((r) => r.hotelId === hotelId && r.category === category);
  if (matches.length === 0) return 0;
  const avg = matches.reduce((sum, r) => sum + r.basePrice, 0) / matches.length;
  return Math.round(avg / 100) * 100;
}

/**
 * Builds a booking. Pass `room` only when the stay is already in progress or finished
 * (checked_in/checked_out) — a specific room is real, hotel-internal information that
 * doesn't exist yet for a future stay. Future stays are sold by category/view only;
 * `roomId` stays null until allocation happens later, near arrival.
 */
function buildBooking(params: {
  guest: Guest;
  hotel: Hotel;
  rooms: Room[];
  room: Room | null;
  category: RoomCategory;
  view: RoomView | null;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  paymentTier: PaymentTier;
  rng: () => number;
}): Booking {
  const { guest, hotel, rooms, room, category, view, checkIn, checkOut, status, paymentTier, rng } = params;
  const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000));
  const nightlyPrice = room ? room.basePrice : categoryPrice(rooms, hotel.id, category);
  const totalAmount = nightlyPrice * nights;
  const amountPaid = status === 'checked_out' || status === 'checked_in' ? totalAmount : Math.round((totalAmount * paymentTier) / 100);

  return {
    id: makeId('bkg'),
    guestId: guest.id,
    hotelId: hotel.id,
    roomCategory: category,
    expectedView: view,
    expectedBedType: room?.bedType ?? null,
    roomId: room?.id ?? null,
    allocationStatus: room ? 'allocated' : 'pending',
    checkInDate: checkIn.toISOString(),
    checkOutDate: checkOut.toISOString(),
    guestsCount: guest.profileType === 'family' ? randomInt(rng, 2, 4) : randomInt(rng, 1, 2),
    status,
    bookingType: guest.profileType,
    paymentTier,
    holdUntil: null,
    totalAmount,
    amountPaid,
    readyToRoom:
      status === 'checked_in' || status === 'checked_out'
        ? {
            identityVerified: true,
            paymentVerified: true,
            roomReady: true,
            keyPathReady: true,
            pickupConfirmed: true,
            qrCode: room ? `QR-${room.id}` : null,
            estimatedArrival: checkIn.toISOString(),
          }
        : status === 'confirmed'
          ? // 'confirmed' only exists in our state machine once payment clears — keep that invariant true in seed data too.
            { ...emptyReadyToRoom(), paymentVerified: true }
          : emptyReadyToRoom(),
    corporateId: null,
    groupRef: null,
    createdAt: daysFrom(checkIn, -randomInt(rng, 3, 30)).toISOString(),
  };
}

function curatedDemoBookings(guests: Guest[], hotels: Hotel[], rooms: Room[], rng: () => number): Booking[] {
  const aditya = guests.find((g) => g.id === 'guest_demo_business');
  const meera = guests.find((g) => g.id === 'guest_demo_family');
  const springs = hotels.find((h) => h.id === 'htl_springs');
  const orchid = hotels.find((h) => h.id === 'htl_orchid_blr');
  const bookings: Booking[] = [];

  if (aditya && springs) {
    // Future stay: category/view sold, room allocation happens later near arrival.
    bookings.push(
      buildBooking({
        guest: aditya,
        hotel: springs,
        rooms,
        room: null,
        category: 'executive',
        view: 'city',
        checkIn: daysFrom(TODAY, 2),
        checkOut: daysFrom(TODAY, 4),
        status: 'confirmed',
        paymentTier: 100,
        rng,
      }),
    );
  }

  if (aditya && orchid) {
    const pastRoom = roomForHotel(rooms, orchid.id, rng);
    const pastBooking = buildBooking({
      guest: aditya,
      hotel: orchid,
      rooms,
      room: pastRoom,
      category: pastRoom.category,
      view: pastRoom.view,
      checkIn: daysFrom(TODAY, -60),
      checkOut: daysFrom(TODAY, -58),
      status: 'checked_out',
      paymentTier: 100,
      rng,
    });
    bookings.push(pastBooking);
    aditya.previousStayIds.push(pastBooking.id);
  }

  if (meera && springs) {
    const pastRoom = roomForHotel(rooms, springs.id, rng);
    const pastBooking = buildBooking({
      guest: meera,
      hotel: springs,
      rooms,
      room: pastRoom,
      category: pastRoom.category,
      view: pastRoom.view,
      checkIn: daysFrom(TODAY, -120),
      checkOut: daysFrom(TODAY, -117),
      status: 'checked_out',
      paymentTier: 100,
      rng,
    });
    bookings.push(pastBooking);
    meera.previousStayIds.push(pastBooking.id);
  }

  return bookings;
}

/** A hotel with no room left at all, and one category sold out at the flagship. */
const SOLD_OUT_HOTEL_ID = 'htl_windsor_blr';
const SOLD_OUT_CATEGORY_HOTEL_ID = 'htl_springs';
const SOLD_OUT_CATEGORY: RoomCategory = 'suite';
/** Wide enough that any near-term dates a guest picks land inside it. */
const SOLD_OUT_WINDOW_DAYS = 14;

/**
 * Fills specific hotels/categories to capacity so "no availability" is reachable on demand.
 * Without this the seeded data is far too sparse to ever sell out — a category holds ~15
 * rooms against a handful of overlapping bookings — and the unavailable states would never
 * appear in a demo.
 *
 * Anchored to the real current date rather than the fixed TODAY constant the rest of this
 * file uses, because the blackout has to cover whatever dates a guest actually picks today.
 * One booking is created per physical room, so `categoryAvailability` sees genuine capacity
 * exhaustion rather than a special-cased flag.
 */
function soldOutFixtures(guests: Guest[], hotels: Hotel[], rooms: Room[], rng: () => number): Booking[] {
  const now = new Date();
  const generatedGuests = guests.filter((g) => g.id.startsWith('guest_gen_'));
  if (generatedGuests.length === 0) return [];

  const bookings: Booking[] = [];

  function fill(hotel: Hotel, categories: RoomCategory[]) {
    categories.forEach((category) => {
      const roomsInCategory = rooms.filter((r) => r.hotelId === hotel.id && r.category === category);
      roomsInCategory.forEach(() => {
        bookings.push(
          buildBooking({
            guest: pick(rng, generatedGuests),
            hotel,
            rooms,
            room: null,
            category,
            view: pick(rng, VIEWS),
            checkIn: daysFrom(now, 0),
            checkOut: daysFrom(now, SOLD_OUT_WINDOW_DAYS),
            status: 'confirmed',
            paymentTier: 100,
            rng,
          }),
        );
      });
    });
  }

  const soldOutHotel = hotels.find((h) => h.id === SOLD_OUT_HOTEL_ID);
  if (soldOutHotel) {
    const allCategories = [...new Set(rooms.filter((r) => r.hotelId === soldOutHotel.id).map((r) => r.category))];
    fill(soldOutHotel, allCategories);
  }

  const flagship = hotels.find((h) => h.id === SOLD_OUT_CATEGORY_HOTEL_ID);
  if (flagship) fill(flagship, [SOLD_OUT_CATEGORY]);

  return bookings;
}

export function generateBookings(guests: Guest[], hotels: Hotel[], rooms: Room[], count = 260): Booking[] {
  const rng = seededRandom(9042);
  const curated = curatedDemoBookings(guests, hotels, rooms, rng);

  const generatedGuests = guests.filter((g) => g.id.startsWith('guest_gen_'));
  const background: Booking[] = Array.from({ length: count }, () => {
    const guest = pick(rng, generatedGuests);
    const hotel = pick(rng, hotels);
    const offsetRoll = rng();
    // Weighted toward the next few weeks so live availability counts look occupied rather
    // than empty — most of the demand a guest searching today would actually compete with.
    const offset =
      offsetRoll < 0.2
        ? -randomInt(rng, 3, 180)
        : offsetRoll < 0.3
          ? 0
          : offsetRoll < 0.75
            ? randomInt(rng, 1, 30)
            : randomInt(rng, 31, 90);
    const nights = randomInt(rng, 1, 5);
    const status: BookingStatus = offset < 0 ? 'checked_out' : offset === 0 ? 'checked_in' : 'confirmed';
    const paymentTier = pick(rng, [100, 100, 50, 25] as const);

    // Already-arrived stays have a real, already-allocated room. Future stays are category-only.
    const isAlreadyAllocated = status === 'checked_in' || status === 'checked_out';
    const room = isAlreadyAllocated ? roomForHotel(rooms, hotel.id, rng) : null;
    const category = room?.category ?? pick(rng, CATEGORIES);
    const view = room?.view ?? pick(rng, VIEWS);

    return buildBooking({
      guest,
      hotel,
      rooms,
      room,
      category,
      view,
      checkIn: daysFrom(TODAY, offset),
      checkOut: daysFrom(TODAY, offset + nights),
      status,
      paymentTier,
      rng,
    });
  });

  return [...curated, ...soldOutFixtures(guests, hotels, rooms, rng), ...background];
}
