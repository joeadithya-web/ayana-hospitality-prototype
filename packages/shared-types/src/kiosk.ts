export type KioskStep =
  | 'welcome'
  | 'scan_qr'
  | 'booking_validation'
  | 'identity_verification'
  | 'room_ready'
  | 'key_issued'
  | 'room_directions'
  | 'thank_you'
  | 'failed';

export type KioskFailureReason =
  | 'qr_invalid'
  | 'qr_expired'
  | 'qr_not_yet_valid'
  | 'payment_pending'
  | 'room_not_ready'
  | 'identity_failed'
  | 'network_offline'
  | 'pms_offline'
  | 'duplicate_check_in';

export interface KioskSession {
  id: string;
  hotelId: string;
  bookingId: string | null;
  step: KioskStep;
  failureReason: KioskFailureReason | null;
  startedAt: string;
}
