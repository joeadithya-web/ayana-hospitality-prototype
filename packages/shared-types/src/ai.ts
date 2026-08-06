export type AIRecommendationType =
  | 'room_recommendation'
  | 'upgrade_suggestion'
  | 'dining'
  | 'transport'
  | 'concierge'
  | 'late_checkout_offer';

/** Deterministic, rule-based output — no external AI/LLM service in the PT. */
export interface AIRecommendation {
  id: string;
  type: AIRecommendationType;
  guestId: string;
  bookingId: string | null;
  reasoning: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export type OperationsAlertType =
  | 'vip_guest'
  | 'late_arrival'
  | 'overbooking_warning'
  | 'housekeeping_delay'
  | 'repeat_guest'
  | 'upsell_opportunity';

export interface OperationsAlert {
  id: string;
  hotelId: string;
  type: OperationsAlertType;
  message: string;
  relatedBookingId: string | null;
  createdAt: string;
}
