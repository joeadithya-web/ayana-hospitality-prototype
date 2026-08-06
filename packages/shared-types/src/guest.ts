import type { RoomView } from './room';
import type { PaymentMethod } from './payment';

export type TravellerProfileType = 'individual' | 'family' | 'corporate' | 'group';

export type LoyaltyTier = 'member' | 'silver' | 'gold' | 'platinum';

/** Static/mock display only — no real cross-hotel loyalty logic in the PT. */
export interface LoyaltyStatus {
  tier: LoyaltyTier;
  points: number;
}

export type DietaryPreference =
  | 'vegetarian'
  | 'non_vegetarian'
  | 'vegan'
  | 'jain'
  | 'no_preference';

export type SmokingPreference = 'smoking' | 'non_smoking';

export type BusinessLeisure = 'business' | 'leisure' | 'mixed';

export type PillowType = 'soft' | 'medium' | 'firm' | 'no_preference';

export interface MemoryConsent {
  sharedWithHotels: boolean;
  lastUpdated: string;
}

/** AYANA Memory™ — the reusable, guest-controlled stay-preference profile. */
export interface AyanaMemory {
  dietaryPreference: DietaryPreference;
  smokingPreference: SmokingPreference;
  preferredView: RoomView | null;
  preferredFloor: number | null;
  roomTemperatureC: number | null;
  pillowType: PillowType;
  accessibilityNeeds: string[];
  airportPickupPreferred: boolean;
  preferredPaymentMethod: PaymentMethod | null;
  favouriteServices: string[];
  businessOrLeisure: BusinessLeisure;
  specialRequests: string[];
  consent: MemoryConsent;
}

export interface Guest {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  nationality: string;
  profileType: TravellerProfileType;
  isVip: boolean;
  isReturning: boolean;
  loyalty: LoyaltyStatus;
  memory: AyanaMemory;
  previousStayIds: string[];
  /** Present only for profileType 'corporate' | 'group'; simplified demo scenario, not full approval workflow. */
  groupOrCorporateContext: GroupCorporateContext | null;
  createdAt: string;
}

/** Simplified per PT scope decision — no expense-approval or per-member verification workflow. */
export interface GroupCorporateContext {
  organisationName: string;
  memberGuestIds: string[];
  billingMode: 'shared' | 'individual';
}
