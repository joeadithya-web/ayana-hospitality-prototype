import type { Booking, Guest, OperationsAlert, Room } from '@ayana/shared-types';

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Rule-based ops alerts for the Hotel Dashboard. Deterministic, no external AI/LLM. */
export function generateOperationsAlerts(bookings: Booking[], guests: Guest[], rooms: Room[] = []): OperationsAlert[] {
  const guestById = new Map(guests.map((g) => [g.id, g]));
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const now = new Date();
  const alerts: OperationsAlert[] = [];

  for (const booking of bookings) {
    const guest = guestById.get(booking.guestId);
    if (!guest) continue;
    const checkIn = new Date(booking.checkInDate);
    const arrivingToday = isSameDay(checkIn, now) && (booking.status === 'confirmed' || booking.status === 'pending_payment');

    if (guest.isVip && booking.status === 'confirmed') {
      alerts.push({
        id: `alert_vip_${booking.id}`,
        hotelId: booking.hotelId,
        type: 'vip_guest',
        message: `${guest.fullName} (VIP) arriving — ensure preferences are honoured.`,
        relatedBookingId: booking.id,
        createdAt: new Date().toISOString(),
      });
    }

    if (guest.isReturning && booking.status === 'confirmed') {
      alerts.push({
        id: `alert_repeat_${booking.id}`,
        hotelId: booking.hotelId,
        type: 'repeat_guest',
        message: `${guest.fullName} is a returning guest.`,
        relatedBookingId: booking.id,
        createdAt: new Date().toISOString(),
      });
    }

    if (arrivingToday && now.getHours() >= 20 && !booking.readyToRoom.roomReady) {
      alerts.push({
        id: `alert_late_${booking.id}`,
        hotelId: booking.hotelId,
        type: 'late_arrival',
        message: `${guest.fullName} has a late arrival tonight and the room isn't marked ready yet.`,
        relatedBookingId: booking.id,
        createdAt: new Date().toISOString(),
      });
    }

    const room = booking.roomId ? roomById.get(booking.roomId) : undefined;
    if (arrivingToday && room && (room.status === 'dirty' || room.status === 'cleaning')) {
      alerts.push({
        id: `alert_hk_${booking.id}`,
        hotelId: booking.hotelId,
        type: 'housekeeping_delay',
        message: `Room ${room.roomNumber} for ${guest.fullName}'s arrival today is still ${room.status}.`,
        relatedBookingId: booking.id,
        createdAt: new Date().toISOString(),
      });
    }

    if (
      arrivingToday &&
      (guest.loyalty.tier === 'gold' || guest.loyalty.tier === 'platinum') &&
      room &&
      (room.category === 'standard' || room.category === 'deluxe')
    ) {
      alerts.push({
        id: `alert_upsell_${booking.id}`,
        hotelId: booking.hotelId,
        type: 'upsell_opportunity',
        message: `${guest.fullName} (${guest.loyalty.tier}) is booked into a ${room.category} room — consider offering an upgrade.`,
        relatedBookingId: booking.id,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const arrivalsByHotel = new Map<string, number>();
  const readyRoomsByHotel = new Map<string, number>();
  for (const booking of bookings) {
    if (isSameDay(new Date(booking.checkInDate), now) && (booking.status === 'confirmed' || booking.status === 'checked_in')) {
      arrivalsByHotel.set(booking.hotelId, (arrivalsByHotel.get(booking.hotelId) ?? 0) + 1);
    }
  }
  for (const room of rooms) {
    if (room.status === 'ready') readyRoomsByHotel.set(room.hotelId, (readyRoomsByHotel.get(room.hotelId) ?? 0) + 1);
  }
  for (const [hotelId, arrivals] of arrivalsByHotel) {
    const ready = readyRoomsByHotel.get(hotelId) ?? 0;
    if (arrivals > ready) {
      alerts.push({
        id: `alert_overbook_${hotelId}`,
        hotelId,
        type: 'overbooking_warning',
        message: `${arrivals} arrivals expected today but only ${ready} rooms currently ready.`,
        relatedBookingId: null,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return alerts;
}
