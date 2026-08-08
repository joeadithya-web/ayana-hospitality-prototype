import type { Booking, CancellationQuote, Room, RoomCategory } from '@ayana/shared-types';

/** Cheapest to most expensive — drives which categories count as an "upgrade". */
export const CATEGORY_ORDER: RoomCategory[] = ['standard', 'deluxe', 'executive', 'suite', 'presidential'];

export const CATEGORY_LABEL: Record<RoomCategory, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  executive: 'Executive',
  suite: 'Suite',
  presidential: 'Presidential',
};

export function nightsBetween(checkInDate: string, checkOutDate: string): number {
  return Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86_400_000));
}

/**
 * Quoted nightly price for a category at a hotel. Mirrors the engine's own booking
 * maths so an upgrade quote shown to the guest matches what actually gets charged.
 */
export function categoryNightlyPrice(rooms: Room[], hotelId: string, category: RoomCategory): number {
  const matches = rooms.filter((r) => r.hotelId === hotelId && r.category === category);
  if (matches.length === 0) return 0;
  const avg = matches.reduce((sum, r) => sum + r.basePrice, 0) / matches.length;
  return Math.round(avg / 100) * 100;
}

export interface UpgradeOffer {
  category: RoomCategory;
  label: string;
  nightlyPrice: number;
  /** Difference per night against what the guest is already paying. */
  extraPerNight: number;
  /** Difference across the remaining nights of the stay. */
  extraTotal: number;
  availableCount: number;
  /** A concrete free room in that category, when one exists right now. */
  room: Room | null;
}

/**
 * Higher categories the guest could move up to, priced against their current category.
 * `nights` is the number of nights the upgrade would apply to — the whole stay when
 * offered at check-in, or just the remaining nights when requested mid-stay.
 */
export function upgradeOffers(
  rooms: Room[],
  hotelId: string,
  currentCategory: RoomCategory,
  nights: number,
  occupiedRoomIds: Set<string> = new Set(),
): UpgradeOffer[] {
  const currentRank = CATEGORY_ORDER.indexOf(currentCategory);
  const currentPrice = categoryNightlyPrice(rooms, hotelId, currentCategory);

  return CATEGORY_ORDER.slice(currentRank + 1)
    .map((category) => {
      const inCategory = rooms.filter((r) => r.hotelId === hotelId && r.category === category);
      const free = inCategory.filter((r) => r.status === 'ready' && !occupiedRoomIds.has(r.id));
      const nightlyPrice = categoryNightlyPrice(rooms, hotelId, category);
      const extraPerNight = Math.max(0, nightlyPrice - currentPrice);
      return {
        category,
        label: CATEGORY_LABEL[category],
        nightlyPrice,
        extraPerNight,
        extraTotal: extraPerNight * Math.max(1, nights),
        availableCount: free.length,
        room: free[0] ?? null,
      };
    })
    .filter((offer) => offer.nightlyPrice > 0);
}

/**
 * The hotel's published cancellation ladder. Cancelling well ahead is free; the closer
 * to arrival, the more the hotel keeps, because the room can no longer be resold.
 * Once the stay has started this returns `cancellable: false` — an in-house guest
 * checks out early instead, which follows the separate early-checkout refund rules.
 */
export function quoteCancellation(booking: Booking, now: Date = new Date()): CancellationQuote {
  const checkIn = new Date(booking.checkInDate);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfCheckIn = new Date(checkIn);
  startOfCheckIn.setHours(0, 0, 0, 0);

  const daysToCheckIn = Math.round((startOfCheckIn.getTime() - startOfToday.getTime()) / 86_400_000);
  const stayStarted = booking.status === 'checked_in' || booking.status === 'checked_out';

  if (stayStarted) {
    return {
      daysToCheckIn,
      refundPercent: 0,
      refundAmount: 0,
      policyLabel: 'Your stay has already begun — use early checkout instead.',
      cancellable: false,
    };
  }

  let refundPercent: CancellationQuote['refundPercent'];
  let policyLabel: string;

  if (daysToCheckIn >= 7) {
    refundPercent = 100;
    policyLabel = `Cancelled ${daysToCheckIn} days ahead — full refund.`;
  } else if (daysToCheckIn >= 3) {
    refundPercent = 50;
    policyLabel = `Cancelled ${daysToCheckIn} days ahead — 50% refund per hotel policy.`;
  } else if (daysToCheckIn >= 1) {
    refundPercent = 25;
    policyLabel = `Cancelled ${daysToCheckIn} day${daysToCheckIn === 1 ? '' : 's'} ahead — 25% refund per hotel policy.`;
  } else {
    refundPercent = 0;
    policyLabel = 'Cancelled on the day of arrival — no refund per hotel policy.';
  }

  return {
    daysToCheckIn,
    refundPercent,
    refundAmount: Math.round((booking.amountPaid * refundPercent) / 100),
    policyLabel,
    cancellable: true,
  };
}
