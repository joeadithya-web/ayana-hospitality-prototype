import type { Booking, Invoice } from '@ayana/shared-types';
import { makeId } from '@ayana/shared-utils';

/** Seed a settled invoice for every already-checked-out booking (historical stays). */
export function generateInvoicesForPastBookings(bookings: Booking[]): Invoice[] {
  return bookings
    .filter((b) => b.status === 'checked_out')
    .map((booking) => ({
      id: makeId('inv'),
      bookingId: booking.id,
      lineItems: [
        {
          id: makeId('line'),
          description: 'Room charges',
          category: 'room',
          amount: booking.totalAmount,
          postedAt: booking.checkInDate,
        },
      ],
      totalAmount: booking.totalAmount,
      amountPaid: booking.totalAmount,
      outstandingBalance: 0,
      isMock: true,
      issuedAt: booking.checkOutDate,
    }));
}
