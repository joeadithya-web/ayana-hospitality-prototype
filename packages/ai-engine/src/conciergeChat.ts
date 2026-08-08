import type { AyanaMemory, HotelCity, ServiceKind } from '@ayana/shared-types';
import { servicesByKind } from './services';
import { recommendLocalDining, recommendNextTrips, recommendSightseeing } from './travelRecommendations';

export type ConciergeIntent =
  | 'billing'
  | 'spa'
  | 'transport'
  | 'dining'
  | 'sightseeing'
  | 'next_trip'
  | 'room_preferences'
  | 'greeting'
  | 'fallback';

export interface ConciergeChatContext {
  city: HotelCity;
  memory: AyanaMemory;
  /** Live folio balance, so the bot quotes the same number the bill card shows. */
  outstanding: number;
  guestFirstName: string;
}

export interface ConciergeChatReply {
  intent: ConciergeIntent;
  text: string;
  /** Lets a reply open the booking sheet on the right tab instead of just describing it. */
  action?: { label: string; kind: ServiceKind };
}

/**
 * Ordered most-specific first — 'next trip' has to beat the generic travel words in
 * `transport`, and greetings must not swallow a question that merely opens with "hi".
 */
const INTENT_KEYWORDS: { intent: ConciergeIntent; keywords: string[] }[] = [
  { intent: 'next_trip', keywords: ['next trip', 'where next', 'onward', 'after this', 'next destination', 'where should i go', 'weekend trip'] },
  { intent: 'billing', keywords: ['bill', 'balance', 'outstanding', 'owe', 'due', 'invoice', 'charge', 'total', 'how much', 'payment', 'pay'] },
  { intent: 'spa', keywords: ['spa', 'massage', 'wellness', 'relax', 'facial', 'therapy', 'treatment'] },
  { intent: 'dining', keywords: ['food', 'eat', 'dinner', 'lunch', 'breakfast', 'restaurant', 'hungry', 'menu', 'cuisine', 'meal', 'dine', 'drink'] },
  { intent: 'transport', keywords: ['cab', 'taxi', 'transport', 'pickup', 'airport', 'ride', 'car', 'transfer', 'drop'] },
  { intent: 'sightseeing', keywords: ['sightsee', 'visit', 'things to do', 'attraction', 'tour', 'explore', 'nearby', 'landmark', 'see around', 'what to do'] },
  { intent: 'room_preferences', keywords: ['pillow', 'temperature', 'air condition', 'room preference', 'my preference', 'ayana memory', 'housekeeping', 'towel'] },
  { intent: 'greeting', keywords: ['hello', 'hi ', 'hey', 'good morning', 'good evening', 'thanks', 'thank you'] },
];

function detectIntent(message: string): ConciergeIntent {
  const text = ` ${message.toLowerCase().trim()} `;
  for (const { intent, keywords } of INTENT_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) return intent;
  }
  return 'fallback';
}

function inr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Recommendation blurbs already end in a full stop; drop it so joined lists don't double up. */
function trimStop(text: string): string {
  return text.replace(/\.$/, '');
}

function list(items: string[]): string {
  const clean = items.map(trimStop);
  if (clean.length <= 1) return clean[0] ?? '';
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
}

/**
 * Answers a guest message from the same data the rest of the app runs on — the live folio,
 * the bookable service catalog, their AYANA Memory, and the city recommendations. Purely
 * deterministic keyword matching; there is no model behind this.
 */
export function answerConciergeMessage(message: string, ctx: ConciergeChatContext): ConciergeChatReply {
  const intent = detectIntent(message);

  switch (intent) {
    case 'billing': {
      if (ctx.outstanding <= 0) {
        return { intent, text: `You're all settled — nothing outstanding on your room right now. Anything you add during the stay will show up here straight away.` };
      }
      return {
        intent,
        text: `Your room bill currently stands at ${inr(ctx.outstanding)}. You can settle it any time from the Your Bill card above — no need to wait for checkout.`,
      };
    }

    case 'spa': {
      const treatments = servicesByKind('spa');
      const options = treatments.map((t) => `${t.label} at ${inr(t.price)}`);
      return {
        intent,
        text: `The spa has ${list(options)}. Whichever you pick gets charged to your room, so there's nothing to settle on the day.`,
        action: { label: 'Book a treatment', kind: 'spa' },
      };
    }

    case 'transport': {
      const rides = servicesByKind('transport');
      const options = rides.map((t) => `${t.label} (${inr(t.price)})`);
      const pickupNote = ctx.memory.airportPickupPreferred
        ? ' Your AYANA Memory has airport pickup switched on, so I can arrange the transfer to match your flight.'
        : '';
      return {
        intent,
        text: `I can arrange ${list(options)} from the entrance.${pickupNote}`,
        action: { label: 'Book transport', kind: 'transport' },
      };
    }

    case 'dining': {
      const nearby = recommendLocalDining(ctx.city, ctx.memory, 2);
      const dietNote =
        ctx.memory.dietaryPreference !== 'no_preference'
          ? ` I've kept your ${ctx.memory.dietaryPreference.replace('_', ' ')} preference in mind.`
          : '';
      const picks = nearby.map((t) => `${t.title} (${t.distance}) — ${t.description}`);
      return {
        intent,
        text: `Nearby in ${ctx.city}: ${list(picks)}.${dietNote} I can also reserve a table in-house or send breakfast up to the room.`,
        action: { label: 'Book dining', kind: 'restaurant' },
      };
    }

    case 'sightseeing': {
      const spots = recommendSightseeing(ctx.city, ctx.memory, 2);
      const picks = spots.map((t) => `${t.title} — ${t.description} (${t.distance} away)`);
      return {
        intent,
        text: `Worth your time in ${ctx.city}: ${list(picks)}. Say the word and I'll arrange a cab.`,
        action: { label: 'Book a cab', kind: 'transport' },
      };
    }

    case 'next_trip': {
      const ideas = recommendNextTrips(ctx.city, ctx.memory, 2);
      const picks = ideas.map((i) => `${i.destination} (${i.travelTime}) — ${i.bestFor.toLowerCase()}`);
      return {
        intent,
        text: `From ${ctx.city}, guests most often head to ${list(picks)}. There's more in the Where Next? section below, including properties you can book with the same one-tap check-in.`,
      };
    }

    case 'room_preferences': {
      const bits: string[] = [];
      if (ctx.memory.pillowType !== 'no_preference') bits.push(`${ctx.memory.pillowType} pillows`);
      if (ctx.memory.roomTemperatureC) bits.push(`the room at ${ctx.memory.roomTemperatureC}°C`);
      if (ctx.memory.preferredView) bits.push(`a ${ctx.memory.preferredView.replace('_', ' ')} view`);
      if (ctx.memory.dietaryPreference !== 'no_preference') bits.push(`${ctx.memory.dietaryPreference.replace('_', ' ')} meals`);
      bits.push(ctx.memory.smokingPreference === 'non_smoking' ? 'a non-smoking room' : 'a smoking room');

      return {
        intent,
        text: `Your AYANA Memory has you down for ${list(bits)} — the hotel already has all of it. You can change any of it from AYANA Memory in your profile, and I'll pass it on.`,
      };
    }

    case 'greeting':
      return {
        intent,
        text: `Hello ${ctx.guestFirstName}! I can help with your bill, book the spa, dining or a cab, or suggest what's worth seeing in ${ctx.city}. What would you like?`,
      };

    default:
      return {
        intent: 'fallback',
        text: `I'm not sure I follow — I can help with your room bill, spa and dining bookings, transport, or things to do in ${ctx.city}. For anything else I'll pass this to Front Office and someone will follow up shortly.`,
      };
  }
}
