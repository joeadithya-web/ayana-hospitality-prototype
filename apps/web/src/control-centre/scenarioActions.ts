import { useSimulationStore } from '@ayana/simulation-engine';
import type { FailureScenarioId } from '@ayana/shared-types';

const FLAGSHIP_HOTEL_ID = 'htl_springs';

/**
 * Five of the thirteen failure scenarios aren't a simple "block everything" toggle —
 * they represent something that has actually happened operationally (a room went
 * out of service, a booking got cancelled, a refund was issued). For those, clicking
 * the tile performs the real mutation immediately, through the same store actions
 * every other screen uses — so it's a genuine simulated event, not just a status flag.
 * Returns a one-line description of what actually happened, or null if this scenario
 * is a pure toggle (handled elsewhere by activeFailureScenario alone).
 */
export function applyScenarioSideEffect(scenarioId: FailureScenarioId, staffId: string): string | null {
  const store = useSimulationStore.getState();

  if (scenarioId === 'room_occupied') {
    const rooms = store.rooms.filter((r) => r.hotelId === FLAGSHIP_HOTEL_ID && r.category === 'standard' && r.status === 'ready').slice(0, 3);
    if (rooms.length === 0) return 'No ready Standard rooms left to mark occupied — try Reset Demo first.';
    rooms.forEach((r) => store.setRoomStatus(r.id, 'occupied'));
    return `Marked ${rooms.length} Standard room(s) at Springs by JORA Occupied — check Room Management or Housekeeping.`;
  }

  if (scenarioId === 'room_under_cleaning') {
    const rooms = store.rooms.filter((r) => r.hotelId === FLAGSHIP_HOTEL_ID && r.category === 'deluxe' && r.status === 'ready').slice(0, 3);
    if (rooms.length === 0) return 'No ready Deluxe rooms left to mark cleaning — try Reset Demo first.';
    rooms.forEach((r) => store.setRoomStatus(r.id, 'cleaning'));
    return `Marked ${rooms.length} Deluxe room(s) at Springs by JORA Cleaning — book a new Deluxe stay and watch the guest wait for Room Ready live.`;
  }

  if (scenarioId === 'housekeeping_delay') {
    const rooms = store.rooms.filter((r) => r.hotelId === FLAGSHIP_HOTEL_ID && r.category === 'executive' && r.status === 'ready').slice(0, 2);
    if (rooms.length === 0) return 'No ready Executive rooms left to flag — try Reset Demo first.';
    rooms.forEach((r) => store.setRoomStatus(r.id, 'dirty'));
    store.requestHousekeeping(rooms[0]!.id, FLAGSHIP_HOTEL_ID);
    return `Flagged ${rooms.length} Executive room(s) dirty and logged a housekeeping task — check Housekeeping and Dashboard Home alerts.`;
  }

  if (scenarioId === 'booking_cancelled') {
    const booking = store.bookings.find((b) => b.hotelId === FLAGSHIP_HOTEL_ID && (b.status === 'confirmed' || b.status === 'pending_payment'));
    if (!booking) return 'No cancellable booking found at Springs by JORA right now.';
    const guest = store.guests.find((g) => g.id === booking.guestId);
    store.cancelBooking(booking.id, staffId, 'Simulated via Control Centre');
    return `Cancelled ${guest?.fullName ?? 'a guest'}'s booking at Springs by JORA — check Front Office and their Notifications.`;
  }

  if (scenarioId === 'qr_code_expired') {
    const booking = store.bookings.find(
      (b) => b.hotelId === FLAGSHIP_HOTEL_ID && (b.status === 'confirmed' || b.status === 'pending_payment') && b.readyToRoom.qrCode,
    );
    if (!booking) return 'No booking with an issued QR code found at Springs by JORA — issue a key on Ready-to-Room first, or try Reset Demo.';
    const guest = store.guests.find((g) => g.id === booking.guestId);
    store.expireBookingWindow(booking.id);
    return `Backdated ${guest?.fullName ?? 'a guest'}'s stay window at Springs by JORA — their QR now genuinely fails as expired (not a blanket block).`;
  }

  if (scenarioId === 'refund_required') {
    const booking = store.bookings.find((b) => b.hotelId === FLAGSHIP_HOTEL_ID && b.status === 'checked_out');
    if (!booking) return 'No checked-out booking found at Springs by JORA to refund.';
    const guest = store.guests.find((g) => g.id === booking.guestId);
    store.issueRefund(booking.id, 1000, 'Service issue — simulated via Control Centre');
    return `Issued a ₹1,000 refund for ${guest?.fullName ?? 'a guest'} — check Finance → Refunds.`;
  }

  return null;
}
