export type DemoScenarioId =
  | 'normal_guest'
  | 'vip_guest'
  | 'corporate_traveller'
  | 'family_stay'
  | 'repeat_guest'
  | 'airport_pickup'
  | 'late_night_arrival'
  | 'group_booking'
  | 'long_stay';

export type FailureScenarioId =
  | 'payment_failure'
  | 'otp_failure'
  | 'identity_failure'
  | 'room_occupied'
  | 'room_under_cleaning'
  | 'housekeeping_delay'
  | 'pms_offline'
  | 'kiosk_offline'
  | 'network_failure'
  | 'guest_lost_phone'
  | 'qr_code_expired'
  | 'booking_cancelled'
  | 'refund_required';

export interface DemoScenarioDefinition {
  id: DemoScenarioId | FailureScenarioId;
  label: string;
  description: string;
  kind: 'happy_path' | 'failure_path';
}
