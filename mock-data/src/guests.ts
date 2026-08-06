import type {
  AyanaMemory,
  DietaryPreference,
  Guest,
  LoyaltyTier,
  TravellerProfileType,
} from '@ayana/shared-types';
import { pick, randomInt, seededRandom } from '@ayana/shared-utils';

const FIRST_NAMES = [
  'Aditya', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Meera', 'Arjun', 'Kavya',
  'Rahul', 'Sneha', 'Karthik', 'Divya', 'Sanjay', 'Neha', 'Aakash', 'Ishita',
  'Manish', 'Pooja', 'Varun', 'Ritu', 'James', 'Sarah', 'Ahmed', 'Fatima',
  'Wei', 'Hans', 'Lena', 'Carlos',
];
const LAST_NAMES = [
  'Rao', 'Sharma', 'Iyer', 'Nair', 'Gupta', 'Reddy', 'Menon', 'Kumar',
  'Verma', 'Joshi', 'Pillai', 'Chatterjee', 'Bose', 'Desai', 'Malhotra',
  'Carter', 'Khan', 'Chen', 'Muller', 'Silva',
];
const NATIONALITIES = ['India', 'India', 'India', 'India', 'USA', 'UK', 'UAE', 'Singapore', 'Germany'];
const DIETARY: DietaryPreference[] = ['vegetarian', 'non_vegetarian', 'vegan', 'jain', 'no_preference'];
const PROFILE_TYPES: TravellerProfileType[] = ['individual', 'individual', 'individual', 'family', 'corporate', 'group'];
const TIERS: LoyaltyTier[] = ['member', 'member', 'silver', 'gold', 'platinum'];

function buildMemory(rng: () => number): AyanaMemory {
  return {
    dietaryPreference: pick(rng, DIETARY),
    smokingPreference: rng() < 0.15 ? 'smoking' : 'non_smoking',
    preferredView: rng() < 0.7 ? pick(rng, ['city', 'garden', 'pool', 'front_facing', 'business_district'] as const) : null,
    preferredFloor: rng() < 0.4 ? randomInt(rng, 1, 6) : null,
    roomTemperatureC: rng() < 0.5 ? randomInt(rng, 20, 24) : null,
    pillowType: pick(rng, ['soft', 'medium', 'firm', 'no_preference'] as const),
    accessibilityNeeds: rng() < 0.08 ? ['Wheelchair-accessible room'] : [],
    airportPickupPreferred: rng() < 0.45,
    preferredPaymentMethod: rng() < 0.6 ? pick(rng, ['upi', 'credit_card', 'wallet'] as const) : null,
    favouriteServices: rng() < 0.3 ? ['Airport Pickup', 'Late Checkout'] : [],
    businessOrLeisure: pick(rng, ['business', 'leisure', 'mixed'] as const),
    specialRequests: [],
    consent: { sharedWithHotels: true, lastUpdated: new Date('2026-06-01').toISOString() },
  };
}

/** Fixed demo personas so the presenter always has predictable logins. */
const DEMO_PERSONAS: Guest[] = [
  {
    id: 'guest_demo_business',
    fullName: 'Aditya Rao',
    email: 'aditya.rao@example.com',
    mobile: '+91 98450 11234',
    nationality: 'India',
    profileType: 'individual',
    isVip: true,
    isReturning: true,
    loyalty: { tier: 'platinum', points: 18450 },
    memory: {
      dietaryPreference: 'vegetarian',
      smokingPreference: 'non_smoking',
      preferredView: 'city',
      preferredFloor: 5,
      roomTemperatureC: 22,
      pillowType: 'firm',
      accessibilityNeeds: [],
      airportPickupPreferred: true,
      preferredPaymentMethod: 'upi',
      favouriteServices: ['Airport Pickup', 'Late Checkout', 'Business Centre Access'],
      businessOrLeisure: 'business',
      specialRequests: ['Early check-in when available'],
      consent: { sharedWithHotels: true, lastUpdated: new Date('2026-07-20').toISOString() },
    },
    previousStayIds: [],
    groupOrCorporateContext: null,
    createdAt: new Date('2024-03-11').toISOString(),
  },
  {
    id: 'guest_demo_family',
    fullName: 'Meera Nair',
    email: 'meera.nair@example.com',
    mobile: '+91 98220 55678',
    nationality: 'India',
    profileType: 'family',
    isVip: false,
    isReturning: true,
    loyalty: { tier: 'gold', points: 6200 },
    memory: {
      dietaryPreference: 'vegetarian',
      smokingPreference: 'non_smoking',
      preferredView: 'garden',
      preferredFloor: null,
      roomTemperatureC: 23,
      pillowType: 'soft',
      accessibilityNeeds: [],
      airportPickupPreferred: false,
      preferredPaymentMethod: 'credit_card',
      favouriteServices: ['Kids Menu'],
      businessOrLeisure: 'leisure',
      specialRequests: ['Connecting rooms preferred'],
      consent: { sharedWithHotels: true, lastUpdated: new Date('2026-05-02').toISOString() },
    },
    previousStayIds: [],
    groupOrCorporateContext: null,
    createdAt: new Date('2023-11-02').toISOString(),
  },
  {
    id: 'guest_demo_international',
    fullName: 'James Carter',
    email: 'james.carter@example.com',
    mobile: '+1 415 555 0142',
    nationality: 'USA',
    profileType: 'individual',
    isVip: false,
    isReturning: false,
    loyalty: { tier: 'member', points: 0 },
    memory: {
      dietaryPreference: 'non_vegetarian',
      smokingPreference: 'non_smoking',
      preferredView: 'city',
      preferredFloor: null,
      roomTemperatureC: 21,
      pillowType: 'medium',
      accessibilityNeeds: [],
      airportPickupPreferred: true,
      preferredPaymentMethod: 'credit_card',
      favouriteServices: [],
      businessOrLeisure: 'business',
      specialRequests: [],
      consent: { sharedWithHotels: true, lastUpdated: new Date('2026-08-01').toISOString() },
    },
    previousStayIds: [],
    groupOrCorporateContext: null,
    createdAt: new Date('2026-08-01').toISOString(),
  },
];

export function generateGuests(count = 117): Guest[] {
  const rng = seededRandom(7331);
  const generated: Guest[] = Array.from({ length: count }, (_, i) => {
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const profileType = pick(rng, PROFILE_TYPES);
    const isVip = rng() < 0.08;
    const isReturning = rng() < 0.35;

    return {
      id: `guest_gen_${i}`,
      fullName: `${first} ${last}`,
      email: `${first}.${last}.${i}@example.com`.toLowerCase(),
      mobile: `+91 9${randomInt(rng, 100000000, 999999999)}`,
      nationality: pick(rng, NATIONALITIES),
      profileType,
      isVip,
      isReturning,
      loyalty: { tier: pick(rng, TIERS), points: randomInt(rng, 0, 22000) },
      memory: buildMemory(rng),
      previousStayIds: [],
      groupOrCorporateContext:
        profileType === 'corporate' || profileType === 'group'
          ? {
              organisationName: profileType === 'corporate' ? 'Nexora Systems Pvt Ltd' : 'College Reunion Group',
              memberGuestIds: [],
              billingMode: profileType === 'corporate' ? 'individual' : 'shared',
            }
          : null,
      createdAt: new Date(2024, randomInt(rng, 0, 11), randomInt(rng, 1, 28)).toISOString(),
    };
  });

  return [...DEMO_PERSONAS, ...generated];
}
