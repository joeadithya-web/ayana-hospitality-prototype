import type { Booking, ConciergeRequest, ConciergeRequestType, FamilyMember, AyanaMemory } from '@ayana/shared-types';
import { intentTemplateById } from './intentEngine';

export interface AnaIqSuggestion {
  id: string;
  text: string;
  acceptLabel: string;
  requestType: ConciergeRequestType;
  details: string;
}

/**
 * Rule-based, checkout-aware nudges — AnA IQ notices the moment and offers to arrange it, one
 * tap to accept, rather than waiting for the guest to ask. Deterministic and literal (no ML),
 * matching the rest of this prototype. Never suggests something already arranged.
 */
export function buildStaySuggestions(ctx: {
  booking: Booking;
  conciergeRequests: ConciergeRequest[];
  familyMembers?: FamilyMember[];
  memory?: AyanaMemory;
  now?: Date;
}): AnaIqSuggestion[] {
  const now = ctx.now ?? new Date();
  const suggestions: AnaIqSuggestion[] = [];

  const hasRequestType = (type: ConciergeRequestType) =>
    ctx.conciergeRequests.some((r) => r.bookingId === ctx.booking.id && r.type === type && r.status !== 'cancelled');

  const hoursToCheckout = (new Date(ctx.booking.checkOutDate).getTime() - now.getTime()) / 3_600_000;
  if (hoursToCheckout > 0 && hoursToCheckout <= 20 && !hasRequestType('wake_up_call')) {
    suggestions.push({
      id: `${ctx.booking.id}-wake-up`,
      text: "You're checking out soon — want a wake-up call and taxi arranged for the morning?",
      acceptLabel: 'Yes, arrange it',
      requestType: 'wake_up_call',
      details: 'Wake-up call and taxi requested by AnA IQ ahead of checkout',
    });
  }

  const categories = ctx.booking.intents.map((i) => intentTemplateById(i.templateId)?.category);
  if (categories.includes('health_wellness') && !hasRequestType('spa_booking')) {
    suggestions.push({
      id: `${ctx.booking.id}-spa`,
      text: 'Since this stay is about rest and recovery, want AnA IQ to pencil in a spa slot for you?',
      acceptLabel: 'Yes, book it',
      requestType: 'spa_booking',
      details: 'Spa slot suggested by AnA IQ based on your stated purpose',
    });
  }

  // Family Companion — only surfaces for a party actually travelling with children who've
  // said family activities interest them, never assumed from room size alone.
  const travellingWithChild = (ctx.familyMembers ?? []).some((m) => m.relationship === 'Child');
  const interestedInFamilyActivities = (ctx.memory?.interests ?? []).includes('Family Activities');
  if (travellingWithChild && interestedInFamilyActivities && !hasRequestType('experience_booking')) {
    suggestions.push({
      id: `${ctx.booking.id}-family`,
      text: "Travelling with the kids? Want AnA IQ to arrange a supervised kid-friendly activity slot during your stay?",
      acceptLabel: 'Yes, arrange it',
      requestType: 'experience_booking',
      details: 'Kid-friendly activity slot suggested by AnA IQ for the family',
    });
  }

  return suggestions;
}
