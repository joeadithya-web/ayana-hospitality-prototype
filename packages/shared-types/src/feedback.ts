export interface GuestFeedback {
  id: string;
  bookingId: string;
  guestId: string;
  hotelId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  submittedAt: string;
}
