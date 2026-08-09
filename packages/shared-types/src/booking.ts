import type { TravellerProfileType } from './guest';
import type { BookingIntent, IntentMatchAssessment } from './intent';
import type { BedType, RoomCategory, RoomView } from './room';

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'rejected';

/** 0% is not accepted as a booking — enforced at creation, not stored as a live state. */
export type PaymentTier = 100 | 50 | 25;

/**
 * A specific room number is hotel-internal allotment information — never known to the guest
 * (or decided by AYANA) at booking time. Only the room category/view is sold at booking.
 * The actual room is allocated later, close to arrival, either automatically (a matching
 * room is clean and free) or manually by Front Office. Extensible beyond these four for
 * future scenarios (e.g. early/VIP allocation, connecting-room requests).
 */
export type RoomAllocationStatus = 'pending' | 'allocated' | 'delayed' | 'overbooked';

export interface ReadyToRoomStatus {
  identityVerified: boolean;
  paymentVerified: boolean;
  roomReady: boolean;
  keyPathReady: boolean;
  pickupConfirmed: boolean;
  qrCode: string | null;
  estimatedArrival: string | null;
}

export interface Booking {
  id: string;
  guestId: string;
  hotelId: string;
  /** Sold at booking time — never a specific room. */
  roomCategory: RoomCategory;
  expectedView: RoomView | null;
  expectedBedType: BedType | null;
  /** Null until allocated; only meaningful once allocationStatus is 'allocated'. */
  roomId: string | null;
  allocationStatus: RoomAllocationStatus;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  status: BookingStatus;
  bookingType: TravellerProfileType;
  paymentTier: PaymentTier;
  /** 6pm hold deadline for 25%/50% tiers; null once fully paid or for 100% bookings. */
  holdUntil: string | null;
  totalAmount: number;
  amountPaid: number;
  readyToRoom: ReadyToRoomStatus;
  /** Set when booked against a signed corporate agreement — drives rates and wire settlement. */
  corporateId: string | null;
  /** Shared by every room booked together for one party; null for single-room bookings. */
  groupRef: string | null;
  /** Why the guest is travelling. Empty for every booking that doesn't opt into the Intent Engine. */
  intents: BookingIntent[];
  /** Free-text answer to "What would make this journey successful?" — captured verbatim, never parsed. */
  journeyGoal: string | null;
  /** The real moment check-in completed (guest self-service or staff-assisted) — null until then. */
  checkedInAt: string | null;
  /** One entry per attached Intent, computed once at booking time from real availability/amenity data. Empty for bookings with no Intent. */
  intentMatch: IntentMatchAssessment[];
  /** The real moment checkout completed — null until then. Used to pace feedback reminders. */
  checkedOutAt: string | null;
  /** How many "please leave feedback" reminders have been sent for this stay — capped at 3. */
  feedbackReminderCount: number;
  /** When the most recent feedback reminder was sent — null until the first one fires. */
  lastFeedbackReminderAt: string | null;
  createdAt: string;
}
