import type { Booking, FailureScenarioId, KioskFailureReason, Room } from '@ayana/shared-types';

export type KioskOutcome = { kind: 'success'; booking: Booking; room: Room } | { kind: 'failure'; reason: KioskFailureReason };

/** Shared readiness check, used both for QR scans and the "lost phone" name-lookup fallback. */
export function evaluateBookingReadiness(booking: Booking, rooms: Room[]): KioskOutcome {
  if (booking.status === 'checked_in' || booking.status === 'checked_out') {
    return { kind: 'failure', reason: 'duplicate_check_in' };
  }

  // A QR/key is only valid for the guest's actual stay window — not an arbitrary toggle.
  const now = new Date();
  if (now < new Date(booking.checkInDate)) return { kind: 'failure', reason: 'qr_not_yet_valid' };
  if (now > new Date(booking.checkOutDate)) return { kind: 'failure', reason: 'qr_expired' };

  if (!booking.readyToRoom.paymentVerified) return { kind: 'failure', reason: 'payment_pending' };
  if (!booking.readyToRoom.identityVerified) return { kind: 'failure', reason: 'identity_failed' };
  if (!booking.readyToRoom.roomReady || !booking.roomId) return { kind: 'failure', reason: 'room_not_ready' };

  const room = rooms.find((r) => r.id === booking.roomId);
  if (!room) return { kind: 'failure', reason: 'room_not_ready' };

  return { kind: 'success', booking, room };
}

/**
 * Deterministic kiosk check-in validation. The Control Centre's activeFailureScenario can
 * force specific outcomes to demonstrate recovery paths — otherwise this reflects real
 * booking/room state, same as everywhere else in the simulation.
 */
export function validateKioskCheckIn(
  qrCode: string,
  hotelId: string,
  bookings: Booking[],
  rooms: Room[],
  activeFailureScenario: FailureScenarioId | null,
): KioskOutcome {
  if (activeFailureScenario === 'pms_offline') return { kind: 'failure', reason: 'pms_offline' };
  if (activeFailureScenario === 'identity_failure') return { kind: 'failure', reason: 'identity_failed' };

  const booking = bookings.find((b) => b.readyToRoom.qrCode === qrCode.trim() && b.hotelId === hotelId);
  if (!booking) return { kind: 'failure', reason: 'qr_invalid' };

  return evaluateBookingReadiness(booking, rooms);
}
