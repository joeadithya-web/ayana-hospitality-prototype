export type StaffRole =
  | 'front_office'
  | 'duty_manager'
  | 'housekeeping'
  | 'concierge'
  | 'bell_desk'
  | 'finance'
  | 'administrator';

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  hotelId: string;
}

export type OverrideAction =
  | 'force_check_in'
  | 'force_checkout'
  | 'alternate_room'
  | 'approve_late_checkout'
  | 'waive_charges'
  | 'override_verification'
  | 'replace_qr'
  | 'reissue_key'
  | 'cancel_booking';

export interface OverrideLogEntry {
  id: string;
  staffId: string;
  action: OverrideAction;
  bookingId: string;
  reason: string;
  timestamp: string;
}
