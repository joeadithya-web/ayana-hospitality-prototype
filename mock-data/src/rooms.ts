import type { BedType, Hotel, Room, RoomCategory, RoomView } from '@ayana/shared-types';
import { pick, randomInt, seededRandom } from '@ayana/shared-utils';

const CATEGORY_WEIGHTS: { category: RoomCategory; weight: number; priceMultiplier: number }[] = [
  { category: 'standard', weight: 5, priceMultiplier: 1 },
  { category: 'deluxe', weight: 4, priceMultiplier: 1.35 },
  { category: 'executive', weight: 2, priceMultiplier: 1.8 },
  { category: 'suite', weight: 1, priceMultiplier: 2.6 },
  { category: 'presidential', weight: 1 / 3, priceMultiplier: 4 },
];

const WEIGHTED_CATEGORIES: RoomCategory[] = CATEGORY_WEIGHTS.flatMap((c) =>
  Array.from({ length: Math.round(c.weight * 3) }, () => c.category),
);

const VIEWS: RoomView[] = ['city', 'garden', 'pool', 'front_facing', 'business_district'];

/** Bigger categories skew to larger beds — keeps the bed-type choice meaningful per category. */
const BED_TYPES_BY_CATEGORY: Record<RoomCategory, BedType[]> = {
  standard: ['twin', 'double'],
  deluxe: ['twin', 'double', 'king'],
  executive: ['double', 'king'],
  suite: ['double', 'king'],
  presidential: ['king'],
};

const SECTIONS = ['A', 'B', 'C', 'D'];
const ROOMS_PER_FLOOR = 6;
const FLOORS_PER_HOTEL = 6;

export function generateRoomsForHotel(hotel: Hotel, seed: number): Room[] {
  const rng = seededRandom(seed);
  const rooms: Room[] = [];

  for (let floor = 1; floor <= FLOORS_PER_HOTEL; floor += 1) {
    for (let unit = 1; unit <= ROOMS_PER_FLOOR; unit += 1) {
      const category = pick(rng, WEIGHTED_CATEGORIES);
      const multiplier = CATEGORY_WEIGHTS.find((c) => c.category === category)?.priceMultiplier ?? 1;
      const roomNumber = `${floor}${String(unit).padStart(2, '0')}`;
      const statusRoll = rng();

      rooms.push({
        id: `${hotel.id}_rm_${roomNumber}`,
        hotelId: hotel.id,
        roomNumber,
        floor,
        section: pick(rng, SECTIONS),
        category,
        view: pick(rng, VIEWS),
        bedType: pick(rng, BED_TYPES_BY_CATEGORY[category]),
        smoking: rng() < 0.12,
        maxOccupancy: category === 'presidential' || category === 'suite' ? 4 : category === 'executive' ? 3 : 2,
        basePrice: Math.round((hotel.priceFloor * multiplier) / 100) * 100,
        upgradePrice: Math.round((hotel.priceFloor * multiplier * 0.35) / 100) * 100,
        status: statusRoll < 0.7 ? 'ready' : statusRoll < 0.85 ? 'occupied' : statusRoll < 0.95 ? 'dirty' : 'cleaning',
        aiScore: randomInt(rng, 55, 98),
      });
    }
  }

  return rooms;
}

export function generateAllRooms(hotels: Hotel[]): Room[] {
  return hotels.flatMap((hotel, index) => generateRoomsForHotel(hotel, 1000 + index * 37));
}
