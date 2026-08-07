import type { BedType, Guest, Room, RoomCategory, RoomView } from '@ayana/shared-types';

/** A specific bed-type + view combination bookable within a category. */
export interface RoomVariant {
  bedType: BedType;
  view: RoomView;
  nightlyPrice: number;
  availableCount: number;
}

export interface CategoryFit {
  category: RoomCategory;
  /** Best-matching view within the category — the one shown on the summary card. */
  view: RoomView;
  bedType: BedType;
  nightlyPrice: number;
  score: number;
  reasons: string[];
  maxOccupancy: number;
  /** Every bookable bed-type/view combination in this category, for the drill-down. */
  variants: RoomVariant[];
}

function priceOf(rooms: Room[]): number {
  return Math.round(rooms.reduce((sum, r) => sum + r.basePrice, 0) / rooms.length / 100) * 100;
}

/**
 * Category-level recommendation for the Room Selection screen. One entry per room category
 * (standard, deluxe, …) rather than per category+view — the guest picks a category first,
 * then drills into bed type and view. Deliberately excludes floor/section preferences: a
 * specific room isn't known until allocation happens near arrival.
 */
export function scoreCategoriesForGuest(guest: Guest, rooms: Room[]): CategoryFit[] {
  const memory = guest.memory;
  const byCategory = new Map<RoomCategory, Room[]>();

  for (const room of rooms) {
    const list = byCategory.get(room.category) ?? [];
    list.push(room);
    byCategory.set(room.category, list);
  }

  const fits: CategoryFit[] = [];
  for (const [category, categoryRooms] of byCategory) {
    const variantGroups = new Map<string, Room[]>();
    for (const room of categoryRooms) {
      const key = `${room.bedType}::${room.view}`;
      const list = variantGroups.get(key) ?? [];
      list.push(room);
      variantGroups.set(key, list);
    }

    const variants: RoomVariant[] = [...variantGroups].map(([key, group]) => {
      const [bedType, view] = key.split('::') as [BedType, RoomView];
      return {
        bedType,
        view,
        nightlyPrice: priceOf(group),
        availableCount: group.filter((r) => r.status === 'ready').length,
      };
    });

    // Surface the preferred view first, then the widest-available combination.
    variants.sort((a, b) => {
      const aPref = memory.preferredView && a.view === memory.preferredView ? 1 : 0;
      const bPref = memory.preferredView && b.view === memory.preferredView ? 1 : 0;
      if (aPref !== bPref) return bPref - aPref;
      return b.availableCount - a.availableCount;
    });

    const anyReady = categoryRooms.some((r) => r.status === 'ready');
    let score = categoryRooms.reduce((sum, r) => sum + r.aiScore, 0) / categoryRooms.length;
    const reasons: string[] = [];

    if (memory.preferredView && variants.some((v) => v.view === memory.preferredView)) {
      score += 20;
      reasons.push(`${memory.preferredView.replace('_', ' ')} view available, as you prefer`);
    }

    if (memory.businessOrLeisure === 'business' && (category === 'executive' || category === 'suite')) {
      score += 10;
      reasons.push('Executive-tier category suited for business travel');
    }

    if (guest.isVip && (category === 'suite' || category === 'presidential')) {
      score += 12;
      reasons.push('VIP-tier category');
    }

    if (!anyReady) score -= 15;
    if (reasons.length === 0) reasons.push('Popular choice for your stay dates');

    const headline = variants[0]!;
    fits.push({
      category,
      view: headline.view,
      bedType: headline.bedType,
      nightlyPrice: priceOf(categoryRooms),
      score: Math.round(score),
      reasons,
      maxOccupancy: Math.max(...categoryRooms.map((r) => r.maxOccupancy)),
      variants,
    });
  }

  return fits.sort((a, b) => b.score - a.score);
}
