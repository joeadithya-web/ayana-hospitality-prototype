import { create } from 'zustand';

/**
 * The dates and party size a guest is shopping for, shared across Search → Hotel →
 * Rooms → Confirm so they're entered once and drive what's offered from then on.
 *
 * Deliberately separate from the simulation engine: this is throwaway per-tab UI state,
 * not simulated business data, so it isn't persisted or broadcast between tabs.
 */

/** `yyyy-mm-dd`, the format `<input type="date">` binds to. */
function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000));
}

interface TripSearchState {
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  setCheckInDate: (date: string) => void;
  setCheckOutDate: (date: string) => void;
  setGuestsCount: (count: number) => void;
}

export const useTripSearchStore = create<TripSearchState>((set) => ({
  // Defaults so screens reached without going through Search (a Dashboard card, a
  // shared link) still have usable criteria rather than an empty state.
  checkInDate: isoDate(1),
  checkOutDate: isoDate(3),
  guestsCount: 2,

  setCheckInDate: (date) =>
    set((s) => {
      if (new Date(s.checkOutDate) > new Date(date)) return { checkInDate: date };
      // Moving check-in past check-out would invert the stay — carry the trip length along.
      const nights = nightsBetween(s.checkInDate, s.checkOutDate);
      const nextOut = new Date(date);
      nextOut.setDate(nextOut.getDate() + nights);
      return { checkInDate: date, checkOutDate: nextOut.toISOString().slice(0, 10) };
    }),

  setCheckOutDate: (date) =>
    set((s) => (new Date(date) > new Date(s.checkInDate) ? { checkOutDate: date } : {})),

  setGuestsCount: (count) => set({ guestsCount: Math.min(20, Math.max(1, count)) }),
}));
