import type { AyanaMemory, ServiceCatalogItem, ServiceKind } from '@ayana/shared-types';

/**
 * The single source of bookable in-stay services. Both the Traveller App and the Kiosk
 * render from this list, so a spa slot booked at the kiosk and one booked on the phone
 * post identical charges to the same folio.
 */
export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  // Restaurant — the table itself is free; food lands on the folio as consumed.
  {
    id: 'svc_dinner',
    kind: 'restaurant',
    label: 'Dinner Reservation',
    description: 'Reserve a table at the in-house restaurant',
    price: 0,
    icon: '🍽️',
    chargeCategory: 'food_beverage',
    requestType: 'restaurant_booking',
  },
  {
    id: 'svc_breakfast',
    kind: 'restaurant',
    label: 'In-Room Breakfast',
    description: 'Continental or Indian, served to your room',
    price: 900,
    icon: '🥐',
    chargeCategory: 'food_beverage',
    requestType: 'restaurant_booking',
  },

  // Spa
  {
    id: 'svc_swedish',
    kind: 'spa',
    label: 'Swedish Massage (60 min)',
    description: 'Full-body relaxation massage',
    price: 2500,
    icon: '💆',
    chargeCategory: 'add_on',
    requestType: 'spa_booking',
  },
  {
    id: 'svc_deep_tissue',
    kind: 'spa',
    label: 'Deep Tissue Massage (60 min)',
    description: 'Targeted muscle relief after a long journey',
    price: 3200,
    icon: '💆',
    chargeCategory: 'add_on',
    requestType: 'spa_booking',
  },
  {
    id: 'svc_facial',
    kind: 'spa',
    label: 'Rejuvenating Facial (45 min)',
    description: 'Hydrating facial with a signature finish',
    price: 1800,
    icon: '🧖',
    chargeCategory: 'add_on',
    requestType: 'spa_booking',
  },

  // Transport
  {
    id: 'svc_cab_city',
    kind: 'transport',
    label: 'City Cab (Sedan)',
    description: 'On-demand ride from the hotel entrance',
    price: 450,
    icon: '🚕',
    chargeCategory: 'transport',
    requestType: 'taxi',
  },
  {
    id: 'svc_airport_drop',
    kind: 'transport',
    label: 'Airport Transfer',
    description: 'Priority transfer timed to your flight',
    price: 1400,
    icon: '✈️',
    chargeCategory: 'transport',
    requestType: 'airport_pickup',
  },

  // Add-ons
  {
    id: 'svc_late_checkout',
    kind: 'add_on',
    label: 'Late Checkout (until 4 PM)',
    description: 'Keep your room for the afternoon',
    price: 1000,
    icon: '🕓',
    chargeCategory: 'add_on',
    requestType: 'special_request',
  },
  {
    id: 'svc_bouquet',
    kind: 'add_on',
    label: 'Flower Bouquet',
    description: 'Seasonal arrangement delivered to your room',
    price: 800,
    icon: '💐',
    chargeCategory: 'add_on',
    requestType: 'special_request',
  },
  {
    id: 'svc_chocolates',
    kind: 'add_on',
    label: 'Chocolates & Cake',
    description: 'Celebration platter for the room',
    price: 500,
    icon: '🍫',
    chargeCategory: 'add_on',
    requestType: 'special_request',
  },
  {
    id: 'svc_laundry',
    kind: 'add_on',
    label: 'Express Laundry',
    description: 'Same-day wash and press',
    price: 600,
    icon: '👔',
    chargeCategory: 'add_on',
    requestType: 'special_request',
  },

  // Celebrations — AnA IQ's Celebration Manager: birthdays, anniversaries, surprises.
  {
    id: 'svc_birthday_setup',
    kind: 'celebration',
    label: 'Birthday Room Setup',
    description: 'Balloons, cake and a card waiting in the room',
    price: 2200,
    icon: '🎂',
    chargeCategory: 'add_on',
    requestType: 'celebration_arrangement',
  },
  {
    id: 'svc_anniversary_setup',
    kind: 'celebration',
    label: 'Anniversary Decor',
    description: 'Rose petals, candles and a bottle of wine',
    price: 3500,
    icon: '💐',
    chargeCategory: 'add_on',
    requestType: 'celebration_arrangement',
  },
  {
    id: 'svc_surprise_arrangement',
    kind: 'celebration',
    label: 'Surprise Arrangement',
    description: 'Tell us the occasion — AnA IQ coordinates the details with the team',
    price: 0,
    icon: '🎉',
    chargeCategory: 'add_on',
    requestType: 'celebration_arrangement',
  },

  // Experiences — bookable tours and activities around the property.
  {
    id: 'svc_city_tour',
    kind: 'experience',
    label: 'Guided City Tour (Half Day)',
    description: 'Private guide, car included',
    price: 4000,
    icon: '🗺️',
    chargeCategory: 'add_on',
    requestType: 'experience_booking',
  },
  {
    id: 'svc_adventure_trek',
    kind: 'experience',
    label: 'Adventure Trek',
    description: 'Guided half-day trek nearby, gear provided',
    price: 2800,
    icon: '🥾',
    chargeCategory: 'add_on',
    requestType: 'experience_booking',
  },
  {
    id: 'svc_cultural_excursion',
    kind: 'experience',
    label: 'Cultural Excursion',
    description: 'Local heritage sites with a private guide',
    price: 3200,
    icon: '🏛️',
    chargeCategory: 'add_on',
    requestType: 'experience_booking',
  },
];

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  restaurant: 'Dining',
  spa: 'Spa & Wellness',
  transport: 'Transport',
  add_on: 'Room Add-ons',
  celebration: 'Celebrations',
  experience: 'Experiences',
};

export function servicesByKind(kind: ServiceKind): ServiceCatalogItem[] {
  return SERVICE_CATALOG.filter((s) => s.kind === kind);
}

export function findService(id: string): ServiceCatalogItem | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id);
}

/**
 * Ranks services for a specific guest so the app and kiosk lead with the ones most
 * likely to convert — a VIP sees the premium massage first, a business traveller
 * sees the airport transfer.
 */
export function recommendServices(memory: AyanaMemory, isVip: boolean, limit = 3): ServiceCatalogItem[] {
  const scored = SERVICE_CATALOG.map((item) => {
    let score = 0;
    if (isVip && item.price >= 2500) score += 3;
    if (memory.businessOrLeisure === 'business' && item.kind === 'transport') score += 3;
    if (memory.businessOrLeisure === 'leisure' && item.kind === 'spa') score += 2;
    if (memory.airportPickupPreferred && item.id === 'svc_airport_drop') score += 4;
    if (item.kind === 'restaurant') score += 1;
    return { item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}
