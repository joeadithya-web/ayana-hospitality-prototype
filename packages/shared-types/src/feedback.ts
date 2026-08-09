export type CsiScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface GuestFeedback {
  id: string;
  bookingId: string;
  guestId: string;
  hotelId: string;
  /** Guest-selected Customer Satisfaction Index, 1-10 — the only score the guest ever picks. */
  csiScore: CsiScore;
  /** Derived from csiScore via a fixed mapping — never guest-input. Feeds hotel search ranking. */
  derivedStarRating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  /** Answer to the conditional improvement question shown for scores <= 9; absent for a 10. */
  followUpAnswer?: string;
  submittedAt: string;
}
