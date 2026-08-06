import type { DemoScenarioDefinition, DemoScenarioId, FailureScenarioId } from '@ayana/shared-types';

export const DEMO_SCENARIOS: (DemoScenarioDefinition & { id: DemoScenarioId; presenterNote: string })[] = [
  { id: 'normal_guest', label: 'Normal Guest', kind: 'happy_path', description: 'Standard leisure stay.', presenterNote: 'Log into Traveller App as James Carter — fresh guest, no existing bookings.' },
  { id: 'vip_guest', label: 'VIP Guest', kind: 'happy_path', description: 'High-tier loyalty guest.', presenterNote: 'Log in as Aditya Rao (Platinum, VIP) — triggers VIP alerts on the Dashboard automatically.' },
  { id: 'corporate_traveller', label: 'Corporate Traveller', kind: 'happy_path', description: 'Business account booking.', presenterNote: 'Search for any guest with a corporate profile type, or book as Aditya Rao (business).' },
  { id: 'family_stay', label: 'Family Stay', kind: 'happy_path', description: 'Multi-guest leisure booking.', presenterNote: 'Log in as Meera Nair — family profile, garden view preference.' },
  { id: 'repeat_guest', label: 'Repeat Guest', kind: 'happy_path', description: 'Returning guest recognised by AYANA Memory.', presenterNote: 'Aditya Rao or Meera Nair both have previous stays — AI recommendation reflects their saved preferences.' },
  { id: 'airport_pickup', label: 'Airport Pickup', kind: 'happy_path', description: 'Guest with pickup preference set.', presenterNote: 'Aditya Rao has airportPickupPreferred=true — Ready-to-Room will show the pickup milestone.' },
  { id: 'late_night_arrival', label: 'Late Night Arrival', kind: 'happy_path', description: 'Arrival after 8pm.', presenterNote: 'Dashboard AI Alerts surface a Late Arrival alert automatically after 8pm for unready rooms.' },
  { id: 'group_booking', label: 'Group Booking', kind: 'happy_path', description: 'Simplified group profile.', presenterNote: 'Some generated guests have profileType "group" with a shared billing context.' },
  { id: 'long_stay', label: 'Long Stay', kind: 'happy_path', description: 'Extended multi-night booking.', presenterNote: 'Pick a 4-6 night stay in Booking to demo in-stay daily billing.' },
];

export const FAILURE_SCENARIOS: { id: FailureScenarioId; label: string; appliesTo: string }[] = [
  { id: 'payment_failure', label: 'Payment Failure', appliesTo: 'Forces the next Traveller Payment attempt (any hotel) to be declined.' },
  { id: 'otp_failure', label: 'OTP Failure', appliesTo: 'Traveller Login will reject any OTP entered, with a Resend option.' },
  { id: 'identity_failure', label: 'Identity Failed', appliesTo: 'Kiosk will show Identity Verification Needed for any scan.' },
  { id: 'room_occupied', label: 'Room Occupied', appliesTo: 'Immediately marks 3 Standard rooms at Springs by JORA Occupied.' },
  { id: 'room_under_cleaning', label: 'Room Under Cleaning', appliesTo: 'Immediately marks 3 Deluxe rooms Cleaning — book that category to see the guest wait live.' },
  { id: 'housekeeping_delay', label: 'Housekeeping Delay', appliesTo: 'Immediately flags Executive rooms dirty and logs a housekeeping task.' },
  { id: 'pms_offline', label: 'PMS Offline', appliesTo: 'Blocks Kiosk validation entirely — shows System Unavailable.' },
  { id: 'kiosk_offline', label: 'Kiosk Offline', appliesTo: 'Kiosk shows a full offline screen, blocking all check-in.' },
  { id: 'network_failure', label: 'Network Failure', appliesTo: 'Kiosk shows a network-unavailable screen.' },
  { id: 'guest_lost_phone', label: 'Guest Lost Phone', appliesTo: 'Kiosk switches to a real name-lookup check-in flow instead of QR.' },
  { id: 'qr_code_expired', label: 'QR Code Expired', appliesTo: 'Backdates a real booking\'s stay dates so its QR genuinely fails at the Kiosk — every booking\'s QR is now checked against its actual check-in/check-out window, not a global switch.' },
  { id: 'booking_cancelled', label: 'Booking Cancelled', appliesTo: 'Immediately cancels a real pending/confirmed booking at Springs by JORA.' },
  { id: 'refund_required', label: 'Refund Required', appliesTo: 'Immediately issues a ₹1,000 refund on a real checked-out booking.' },
];
