import type { AIRecommendation, Guest, Room } from '@ayana/shared-types';

export interface RoomFit {
  room: Room;
  score: number;
  reasons: string[];
}

/**
 * Deterministic, rule-based room fit scoring using AYANA Memory + room state.
 * No external AI/LLM service — every reason is explainable.
 */
export function scoreRoomsForGuest(guest: Guest, rooms: Room[]): RoomFit[] {
  const memory = guest.memory;

  return rooms
    .filter((room) => room.status === 'ready')
    .map((room) => {
      let score = room.aiScore * 0.4;
      const reasons: string[] = [];

      if (memory.smokingPreference === 'smoking' && room.smoking) {
        score += 15;
        reasons.push('Smoking room, matching your preference');
      } else if (memory.smokingPreference === 'non_smoking' && !room.smoking) {
        score += 5;
        reasons.push('Non-smoking room');
      } else if (memory.smokingPreference === 'smoking' && !room.smoking) {
        score -= 20;
      }

      if (memory.preferredView && room.view === memory.preferredView) {
        score += 20;
        reasons.push(`${room.view.replace('_', ' ')} view, as you prefer`);
      }

      if (memory.preferredFloor !== null && room.floor === memory.preferredFloor) {
        score += 15;
        reasons.push(`Floor ${room.floor}, your preferred floor`);
      }

      if (memory.businessOrLeisure === 'business' && (room.category === 'executive' || room.category === 'suite')) {
        score += 10;
        reasons.push('Executive-tier room suited for business travel');
      }

      if (guest.isVip && (room.category === 'suite' || room.category === 'presidential')) {
        score += 12;
        reasons.push('VIP-tier room');
      }

      if (reasons.length === 0) {
        reasons.push('Best available match for your stay dates');
      }

      return { room, score: Math.round(score), reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildRoomRecommendation(guest: Guest, bookingId: string | null, best: RoomFit): AIRecommendation {
  return {
    id: `air_room_${best.room.id}_${Date.now()}`,
    type: 'room_recommendation',
    guestId: guest.id,
    bookingId,
    reasoning: best.reasons.join('; '),
    payload: { roomId: best.room.id, score: best.score },
    createdAt: new Date().toISOString(),
  };
}

export function suggestUpgrade(current: RoomFit, alternatives: RoomFit[]): RoomFit | null {
  const categoryRank = ['standard', 'deluxe', 'executive', 'suite', 'presidential'];
  const currentRank = categoryRank.indexOf(current.room.category);

  const better = alternatives
    .filter((alt) => categoryRank.indexOf(alt.room.category) === currentRank + 1)
    .sort((a, b) => b.score - a.score)[0];

  return better ?? null;
}
