export type ActivitySource =
  | 'traveller_app'
  | 'hotel_dashboard'
  | 'kiosk'
  | 'control_centre'
  | 'system';

export interface ActivityLogEvent {
  id: string;
  bookingId: string | null;
  hotelId: string | null;
  label: string;
  timestamp: string;
  source: ActivitySource;
}
