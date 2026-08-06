import type { Guest, Room, RoomCategory, RoomView } from '@ayana/shared-types';

export interface CategoryFit {
  category: RoomCategory;
  view: RoomView;
  nightlyPrice: number;
  score: number;
  reasons: string[];
}

/**
 * Category+view level recommendation for the Room Selection screen — this is what's sold
 * at booking time. Deliberately excludes floor/section preferences: a specific room (and
 * therefore floor) isn't known until allocation happens near arrival, so floor-matching
 * belongs to the allocation algorithm, not category selection.
 */
export function scoreCategoriesForGuest(guest: Guest, rooms: Room[]): CategoryFit[] {
  const memory = guest.memory;
  const groups = new Map<string, Room[]>();

  for (const room of rooms) {
    const key = `${room.category}::${room.view}`;
    const list = groups.get(key) ?? [];
    list.push(room);
    groups.set(key, list);
  }

  const fits: CategoryFit[] = [];
  for (const [key, groupRooms] of groups) {
    const [category, view] = key.split('::') as [RoomCategory, RoomView];
    const nightlyPrice = Math.round(groupRooms.reduce((sum, r) => sum + r.basePrice, 0) / groupRooms.length / 100) * 100;
    const anyReady = groupRooms.some((r) => r.status === 'ready');

    let score = groupRooms.reduce((sum, r) => sum + r.aiScore, 0) / groupRooms.length;
    const reasons: string[] = [];

    if (memory.preferredView && view === memory.preferredView) {
      score += 20;
      reasons.push(`${view.replace('_', ' ')} view, as you prefer`);
    }

    if (memory.businessOrLeisure === 'business' && (category === 'executive' || category === 'suite')) {
      score += 10;
      reasons.push('Executive-tier category suited for business travel');
    }

    if (guest.isVip && (category === 'suite' || category === 'presidential')) {
      score += 12;
      reasons.push('VIP-tier category');
    }

    if (!anyReady) {
      score -= 15;
    }

    if (reasons.length === 0) {
      reasons.push('Popular choice for your stay dates');
    }

    fits.push({ category, view, nightlyPrice, score: Math.round(score), reasons });
  }

  return fits.sort((a, b) => b.score - a.score);
}
