export type ConciergeRequestType =
  | 'airport_pickup'
  | 'taxi'
  | 'restaurant_booking'
  | 'spa_booking'
  | 'local_recommendation'
  | 'wake_up_call'
  | 'special_request'
  | 'baggage_pickup'
  | 'baggage_delivery'
  | 'luggage_storage'
  | 'vip_arrival_assistance';

export type ConciergeRequestStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ConciergeRequest {
  id: string;
  bookingId: string;
  guestId: string;
  hotelId: string;
  type: ConciergeRequestType;
  details: string;
  status: ConciergeRequestStatus;
  createdAt: string;
}
