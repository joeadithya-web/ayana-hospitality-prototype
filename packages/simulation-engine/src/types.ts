import type { SeedData } from '@ayana/mock-data';

/** The full data shape owned by the Simulation Engine — every app reads/writes only this. */
export interface EngineData extends SeedData {
  currentGuestId: string | null;
  currentStaffId: string | null;
  /** Set when the traveller is booking against a signed corporate agreement. */
  currentCorporateId: string | null;
  /** Set by the Simulation Control Centre to demonstrate a failure/recovery path live across apps. */
  activeFailureScenario: import('@ayana/shared-types').FailureScenarioId | null;
}

export interface CreateBookingInput {
  guestId: string;
  hotelId: string;
  /** Category/view is what's sold at booking time — no specific room exists yet. */
  roomCategory: import('@ayana/shared-types').RoomCategory;
  expectedView: import('@ayana/shared-types').RoomView | null;
  expectedBedType: import('@ayana/shared-types').BedType | null;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  paymentTier: 100 | 50 | 25;
  /** Present when booked on a corporate agreement — applies its negotiated rate. */
  corporateId?: string | null;
}

export interface CreateGroupBookingInput {
  guestId: string;
  hotelId: string;
  roomCategory: import('@ayana/shared-types').RoomCategory;
  checkInDate: string;
  checkOutDate: string;
  /** Total party size across all rooms. */
  totalGuests: number;
  roomsCount: number;
  paymentTier: 100 | 50 | 25;
  corporateId?: string | null;
}

export interface PostChargeInput {
  bookingId: string;
  description: string;
  category: 'room' | 'food_beverage' | 'transport' | 'add_on' | 'other';
  amount: number;
}

export interface RequestConciergeInput {
  bookingId: string;
  guestId: string;
  hotelId: string;
  type: import('@ayana/shared-types').ConciergeRequestType;
  details: string;
}
