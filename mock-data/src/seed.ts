import type {
  ActivityLogEvent,
  Booking,
  ComplianceBadge,
  CorporateAccount,
  ConciergeRequest,
  Guest,
  GuestFeedback,
  Hotel,
  HousekeepingTask,
  IntentTask,
  Invoice,
  MockNotification,
  MockTransaction,
  OverrideLogEntry,
  RefundRecord,
  Room,
  StaffUser,
} from '@ayana/shared-types';
import { generateHotels } from './hotels';
import { generateAllRooms } from './rooms';
import { generateGuests } from './guests';
import { generateBookings } from './bookings';
import { generateInvoicesForPastBookings } from './invoices';
import { generateStaff } from './staff';
import { generateCorporates } from './corporates';
import { generateFeedbackForPastBookings } from './feedback';

export interface SeedData {
  hotels: Hotel[];
  rooms: Room[];
  guests: Guest[];
  bookings: Booking[];
  invoices: Invoice[];
  transactions: MockTransaction[];
  refunds: RefundRecord[];
  housekeepingTasks: HousekeepingTask[];
  intentTasks: IntentTask[];
  conciergeRequests: ConciergeRequest[];
  notifications: MockNotification[];
  activityLog: ActivityLogEvent[];
  overrideLog: OverrideLogEntry[];
  staff: StaffUser[];
  feedback: GuestFeedback[];
  corporates: CorporateAccount[];
  compliance: ComplianceBadge;
}

export function generateSeedData(): SeedData {
  const hotels = generateHotels();
  const rooms = generateAllRooms(hotels);
  const guests = generateGuests();
  const bookings = generateBookings(guests, hotels, rooms);
  const invoices = generateInvoicesForPastBookings(bookings);
  const staff = generateStaff(hotels);
  const feedback = generateFeedbackForPastBookings(bookings);
  const corporates = generateCorporates();

  return {
    hotels,
    rooms,
    guests,
    bookings,
    invoices,
    transactions: [],
    refunds: [],
    housekeepingTasks: [],
    intentTasks: [],
    conciergeRequests: [],
    notifications: [],
    activityLog: [],
    overrideLog: [],
    staff,
    feedback,
    corporates,
    compliance: {
      consentGiven: true,
      dataEncrypted: true,
      retentionPolicySummary:
        'Your profile and stay data are encrypted and used only to personalise your AYANA journey. You can update or delete it anytime from AYANA Memory.',
      identityVerificationMethod: 'government_id_verification',
    },
  };
}
