import { useSimulationStore } from '@ayana/simulation-engine';
import type { StaffUser } from '@ayana/shared-types';
import { useSelectedHotelId } from './HotelContext';

export function useCurrentStaff(): StaffUser | null {
  return useSimulationStore((s) => s.staff.find((st) => st.id === s.currentStaffId) ?? null);
}

export function useHotelBookings() {
  const { hotelId } = useSelectedHotelId();
  return useSimulationStore((s) => s.bookings.filter((b) => b.hotelId === hotelId));
}

export function useHotelRooms() {
  const { hotelId } = useSelectedHotelId();
  return useSimulationStore((s) => s.rooms.filter((r) => r.hotelId === hotelId));
}

export function useHotelHousekeepingTasks() {
  const { hotelId } = useSelectedHotelId();
  return useSimulationStore((s) => s.housekeepingTasks.filter((t) => t.hotelId === hotelId));
}

export function useHotelConciergeRequests() {
  const { hotelId } = useSelectedHotelId();
  return useSimulationStore((s) => s.conciergeRequests.filter((r) => r.hotelId === hotelId));
}
