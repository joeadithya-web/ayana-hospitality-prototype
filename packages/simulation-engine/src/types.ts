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
  /** Optional Intent Engine fields — absent everywhere the guest doesn't opt in. */
  intents?: import('@ayana/shared-types').BookingIntent[];
  journeyGoal?: string | null;
  /** Hotel-side tasks a deepBuilt blueprint needs at booking time — computed by the app from `intentTaskSeedsForTemplate` in @ayana/ai-engine, kept out of this package so the engine stays business-logic-free. */
  intentTaskSeeds?: { label: string; department: import('@ayana/shared-types').StaffRole }[];
  /** One entry per attached Intent — computed by the app from `assessIntentMatch` in @ayana/ai-engine, stored verbatim. */
  intentMatch?: import('@ayana/shared-types').IntentMatchAssessment[];
  /** Concierge-arranged items a deepBuilt blueprint needs — computed by the app from `autoConciergeSeedsForTemplate` in @ayana/ai-engine. Materialized into real ConciergeRequests at booking time so they're honoured without a guest click. */
  autoConciergeSeeds?: { conciergeRequestType: import('@ayana/shared-types').ConciergeRequestType; label: string }[];
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

export interface RegisterGuestInput {
  guestId: string;
  fullName: string;
  email: string;
  mobile: string;
  familyMembers: import('@ayana/shared-types').FamilyMember[];
  interests: string[];
  dietaryPreference: import('@ayana/shared-types').DietaryPreference;
  businessOrLeisure: import('@ayana/shared-types').BusinessLeisure;
}

/**
 * A guest with no AYANA account and no existing reservation, booked on the spot at the Front
 * Desk. Unlike RegisterGuestInput (which patches an existing account), this creates a brand
 * new Guest record — the walk-in equivalent of downloading the app and signing up, done by
 * staff instead of the guest.
 */
export interface WalkInBookingInput {
  fullName: string;
  email: string;
  mobile: string;
  hotelId: string;
  roomCategory: import('@ayana/shared-types').RoomCategory;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
}
