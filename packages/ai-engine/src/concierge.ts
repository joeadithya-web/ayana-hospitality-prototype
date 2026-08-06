import type { AyanaMemory } from '@ayana/shared-types';

export interface SuggestionCard {
  id: string;
  title: string;
  description: string;
}

/** Deterministic dining suggestions, filtered by dietary preference. */
export function recommendDining(memory: AyanaMemory, hotelCity: string): SuggestionCard[] {
  const base: (SuggestionCard & { diet: AyanaMemory['dietaryPreference'][] })[] = [
    { id: 'din_1', title: 'Rooftop Grill', description: `Skyline dining in ${hotelCity} — known for kebabs and grills.`, diet: ['non_vegetarian', 'no_preference'] },
    { id: 'din_2', title: 'Saffron Leaf', description: 'Refined vegetarian and Jain thali experience.', diet: ['vegetarian', 'jain', 'no_preference'] },
    { id: 'din_3', title: 'Green Bowl Cafe', description: 'Plant-based menu with global vegan options.', diet: ['vegan', 'no_preference'] },
    { id: 'din_4', title: 'The Local Table', description: 'Regional specialities, all dietary styles available.', diet: ['vegetarian', 'non_vegetarian', 'vegan', 'jain', 'no_preference'] },
  ];

  return base.filter((item) => item.diet.includes(memory.dietaryPreference)).map(({ diet: _diet, ...card }) => card);
}

export function recommendTransport(memory: AyanaMemory): SuggestionCard[] {
  const cards: SuggestionCard[] = [];
  if (memory.airportPickupPreferred) {
    cards.push({ id: 'trn_1', title: 'Airport Pickup', description: 'Pre-book your pickup so a driver is waiting on arrival.' });
  }
  cards.push({ id: 'trn_2', title: 'City Cab on Demand', description: 'Book a cab for local commute anytime during your stay.' });
  if (memory.businessOrLeisure === 'business') {
    cards.push({ id: 'trn_3', title: 'Airport Express Transfer', description: 'Priority transfer timed to your flight schedule.' });
  }
  return cards;
}

export function recommendConcierge(memory: AyanaMemory, isVip: boolean): SuggestionCard[] {
  const cards: SuggestionCard[] = [
    { id: 'con_1', title: 'Local Recommendations', description: 'Curated nearby attractions and shopping.' },
  ];
  if (memory.businessOrLeisure === 'business' || memory.businessOrLeisure === 'mixed') {
    cards.push({ id: 'con_2', title: 'Business Centre Access', description: 'Meeting rooms and printing on request.' });
  }
  if (isVip) {
    cards.push({ id: 'con_3', title: 'Priority Concierge Line', description: 'Direct line to your dedicated concierge.' });
  }
  return cards;
}
