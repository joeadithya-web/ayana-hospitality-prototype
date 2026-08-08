import { useSimulationStore } from '@ayana/simulation-engine';
import type { Booking, CorporateAccount, Guest, Hotel, Room } from '@ayana/shared-types';

export function useCurrentGuest(): Guest | null {
  return useSimulationStore((s) => s.guests.find((g) => g.id === s.currentGuestId) ?? null);
}

/** The signed corporate agreement the traveller is currently booking against, if any. */
export function useCurrentCorporate(): CorporateAccount | null {
  return useSimulationStore((s) => s.corporates.find((c) => c.id === s.currentCorporateId) ?? null);
}

export function useHotel(hotelId: string | undefined): Hotel | null {
  return useSimulationStore((s) => (hotelId ? s.hotels.find((h) => h.id === hotelId) ?? null : null));
}

export function useRoomsForHotel(hotelId: string | undefined): Room[] {
  return useSimulationStore((s) => (hotelId ? s.rooms.filter((r) => r.hotelId === hotelId) : []));
}

export function useBooking(bookingId: string | undefined): Booking | null {
  return useSimulationStore((s) => (bookingId ? s.bookings.find((b) => b.id === bookingId) ?? null : null));
}

export function useRoom(roomId: string | null | undefined): Room | null {
  return useSimulationStore((s) => (roomId ? s.rooms.find((r) => r.id === roomId) ?? null : null));
}

export function useRoomsForHotelAndCategory(hotelId: string | undefined, category: Room['category'] | undefined): Room[] {
  return useSimulationStore((s) =>
    hotelId && category ? s.rooms.filter((r) => r.hotelId === hotelId && r.category === category) : [],
  );
}
