import type {
  ActivityLogEvent,
  ActivitySource,
  AyanaMemory,
  Booking,
  ConciergeRequest,
  ConciergeRequestStatus,
  ConciergeRequestType,
  GuestFeedback,
  HousekeepingTask,
  HousekeepingTaskStatus,
  Invoice,
  InvoiceLineItemCategory,
  MockNotification,
  MockTransaction,
  NotificationChannel,
  OverrideAction,
  OverrideLogEntry,
  PaymentMethod,
  ReadyToRoomStatus,
  RefundRecord,
  Room,
  RoomCategory,
  RoomStatus,
} from '@ayana/shared-types';
import { makeId, makeMockRef } from '@ayana/shared-utils';
import type { CreateBookingInput, CreateGroupBookingInput, EngineData, PostChargeInput, RequestConciergeInput } from './types';

function logEntry(
  source: ActivitySource,
  label: string,
  bookingId: string | null = null,
  hotelId: string | null = null,
): ActivityLogEvent {
  return { id: makeId('log'), bookingId, hotelId, label, timestamp: new Date().toISOString(), source };
}

function pushNotification(data: EngineData, guestId: string, title: string, body: string): MockNotification[] {
  const notification: MockNotification = {
    id: makeId('ntf'),
    guestId,
    channel: 'in_app',
    title,
    body,
    isMock: true,
    sentAt: new Date().toISOString(),
    read: false,
  };
  return [...data.notifications, notification];
}

function emptyReadyToRoom(): ReadyToRoomStatus {
  return {
    identityVerified: false,
    paymentVerified: false,
    roomReady: false,
    keyPathReady: false,
    pickupConfirmed: false,
    qrCode: null,
    estimatedArrival: null,
  };
}

function nightsOf(checkInDate: string, checkOutDate: string): number {
  return Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86_400_000));
}

/** Quoted price for a category/hotel — no specific room is known yet at booking time. */
function categoryPrice(rooms: Room[], hotelId: string, category: Booking['roomCategory']): number {
  const matches = rooms.filter((r) => r.hotelId === hotelId && r.category === category);
  if (matches.length === 0) return 0;
  const avg = matches.reduce((sum, r) => sum + r.basePrice, 0) / matches.length;
  return Math.round(avg / 100) * 100;
}

/**
 * Nightly rate for a booking, with the corporate agreement's negotiated discount applied
 * when one is in play. Kept in one place so a single room and a 12-room group are always
 * priced off the same contract terms.
 */
function corporateNightlyPrice(
  data: EngineData,
  hotelId: string,
  category: Booking['roomCategory'],
  corporateId: string | null,
): number {
  const published = categoryPrice(data.rooms, hotelId, category);
  if (!corporateId) return published;
  const account = data.corporates.find((c) => c.id === corporateId);
  if (!account) return published;
  return Math.round((published * (100 - account.negotiatedDiscountPercent)) / 100);
}

export function withBookingCreated(
  data: EngineData,
  input: CreateBookingInput,
  source: ActivitySource,
): { data: EngineData; booking: Booking } {
  const nights = Math.max(
    1,
    Math.round((new Date(input.checkOutDate).getTime() - new Date(input.checkInDate).getTime()) / 86_400_000),
  );
  const nightlyPrice = corporateNightlyPrice(data, input.hotelId, input.roomCategory, input.corporateId ?? null);
  const totalAmount = nightlyPrice * nights;
  const amountPaid = 0;
  const holdUntil =
    input.paymentTier === 100
      ? null
      : (() => {
          const d = new Date();
          d.setHours(18, 0, 0, 0);
          return d.toISOString();
        })();

  const booking: Booking = {
    id: makeId('bkg'),
    guestId: input.guestId,
    hotelId: input.hotelId,
    roomCategory: input.roomCategory,
    expectedView: input.expectedView,
    expectedBedType: input.expectedBedType,
    roomId: null,
    allocationStatus: 'pending',
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    guestsCount: input.guestsCount,
    status: 'pending_payment',
    bookingType: data.guests.find((g) => g.id === input.guestId)?.profileType ?? 'individual',
    paymentTier: input.paymentTier,
    holdUntil,
    totalAmount,
    amountPaid,
    readyToRoom: emptyReadyToRoom(),
    corporateId: input.corporateId ?? null,
    groupRef: null,
    createdAt: new Date().toISOString(),
  };

  const hotelName = data.hotels.find((h) => h.id === booking.hotelId)?.name ?? 'your hotel';

  return {
    booking,
    data: {
      ...data,
      bookings: [...data.bookings, booking],
      activityLog: [...data.activityLog, logEntry(source, 'Booking created', booking.id, booking.hotelId)],
      notifications: pushNotification(
        data,
        booking.guestId,
        'Booking created',
        `Your ${booking.roomCategory} stay at ${hotelName} is booked — complete payment to confirm.`,
      ),
    },
  };
}

/**
 * One booking per room, all sharing a group reference. A party of ten can't sleep in one
 * room, so the hotel has to allocate and service each room independently — but the guest
 * booked once and should see, pay and manage it as a single thing.
 */
export function withGroupBookingCreated(
  data: EngineData,
  input: CreateGroupBookingInput,
  source: ActivitySource,
): { data: EngineData; bookings: Booking[]; groupRef: string } {
  const nights = Math.max(
    1,
    Math.round((new Date(input.checkOutDate).getTime() - new Date(input.checkInDate).getTime()) / 86_400_000),
  );
  const nightlyPrice = corporateNightlyPrice(data, input.hotelId, input.roomCategory, input.corporateId ?? null);
  const groupRef = makeId('grp');
  const holdUntil =
    input.paymentTier === 100
      ? null
      : (() => {
          const d = new Date();
          d.setHours(18, 0, 0, 0);
          return d.toISOString();
        })();

  const roomsCount = Math.max(1, input.roomsCount);
  // Spread the party across rooms as evenly as possible — the remainder rides on the first
  // rooms rather than leaving a last room holding everyone.
  const base = Math.floor(input.totalGuests / roomsCount);
  const remainder = input.totalGuests % roomsCount;

  const bookings: Booking[] = Array.from({ length: roomsCount }, (_, i) => ({
    id: makeId('bkg'),
    guestId: input.guestId,
    hotelId: input.hotelId,
    roomCategory: input.roomCategory,
    expectedView: null,
    expectedBedType: null,
    roomId: null,
    allocationStatus: 'pending' as const,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    guestsCount: base + (i < remainder ? 1 : 0),
    status: 'pending_payment' as const,
    bookingType: 'group' as const,
    paymentTier: input.paymentTier,
    holdUntil,
    totalAmount: nightlyPrice * nights,
    amountPaid: 0,
    readyToRoom: emptyReadyToRoom(),
    corporateId: input.corporateId ?? null,
    groupRef,
    createdAt: new Date().toISOString(),
  }));

  const hotelName = data.hotels.find((h) => h.id === input.hotelId)?.name ?? 'your hotel';

  return {
    bookings,
    groupRef,
    data: {
      ...data,
      bookings: [...data.bookings, ...bookings],
      activityLog: [
        ...data.activityLog,
        logEntry(source, `Group booking created — ${roomsCount} rooms for ${input.totalGuests} guests`, bookings[0]?.id ?? null, input.hotelId),
      ],
      notifications: pushNotification(
        data,
        input.guestId,
        'Group booking created',
        `${roomsCount} ${input.roomCategory} rooms held at ${hotelName} for ${input.totalGuests} guests — complete payment to confirm.`,
      ),
    },
  };
}

export function withPaymentReceived(
  data: EngineData,
  payload: { bookingId: string; method: PaymentMethod; amount: number },
  source: ActivitySource,
): { data: EngineData; transaction: MockTransaction } {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) throw new Error(`Unknown booking ${payload.bookingId}`);

  const transaction: MockTransaction = {
    id: makeMockRef('TXN'),
    bookingId: booking.id,
    amount: payload.amount,
    method: payload.method,
    status: 'success',
    isMock: true,
    timestamp: new Date().toISOString(),
  };

  const newAmountPaid = booking.amountPaid + payload.amount;
  const paidTierAmount = Math.round((booking.totalAmount * booking.paymentTier) / 100);
  const updatedBooking: Booking = {
    ...booking,
    amountPaid: newAmountPaid,
    status: newAmountPaid >= paidTierAmount ? 'confirmed' : booking.status,
    readyToRoom: { ...booking.readyToRoom, paymentVerified: newAmountPaid >= paidTierAmount },
  };

  return {
    transaction,
    data: {
      ...data,
      bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
      transactions: [...data.transactions, transaction],
      activityLog: [...data.activityLog, logEntry(source, 'Payment received', booking.id, booking.hotelId)],
      notifications: pushNotification(
        data,
        booking.guestId,
        'Payment received',
        updatedBooking.status === 'confirmed'
          ? 'Your booking is confirmed. We\'ll notify you as your room is prepared.'
          : `Payment of ₹${payload.amount.toLocaleString('en-IN')} received.`,
      ),
    },
  };
}

export function withRoomStatus(
  data: EngineData,
  payload: { roomId: string; status: RoomStatus },
  source: ActivitySource,
): EngineData {
  const room = data.rooms.find((r) => r.id === payload.roomId);
  if (!room) return data;
  const updated: Room = { ...room, status: payload.status };
  return {
    ...data,
    rooms: data.rooms.map((r) => (r.id === payload.roomId ? updated : r)),
    activityLog: [
      ...data.activityLog,
      logEntry(source, `Room ${room.roomNumber} marked ${payload.status.replace('_', ' ')}`, null, room.hotelId),
    ],
  };
}

export function withReadyToRoomPatch(
  data: EngineData,
  payload: { bookingId: string; patch: Partial<ReadyToRoomStatus> },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const updated: Booking = { ...booking, readyToRoom: { ...booking.readyToRoom, ...payload.patch } };

  const labels: string[] = [];
  if (payload.patch.identityVerified) labels.push('Identity verified');
  if (payload.patch.roomReady) labels.push('Room ready');
  if (payload.patch.keyPathReady) labels.push('Key issued');
  if (payload.patch.pickupConfirmed) labels.push('Pickup confirmed');

  let notifications = data.notifications;
  if (payload.patch.roomReady) {
    notifications = pushNotification(data, booking.guestId, 'Room ready', 'Your room is ready ahead of your arrival.');
  }
  if (payload.patch.keyPathReady) {
    notifications = pushNotification({ ...data, notifications }, booking.guestId, 'Mobile key issued', 'Your QR key is ready — show it at the kiosk or access point.');
  }

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updated : b)),
    activityLog: [
      ...data.activityLog,
      ...labels.map((label) => logEntry(source, label, booking.id, booking.hotelId)),
    ],
    notifications,
  };
}

function findOrCreateInvoice(data: EngineData, booking: Booking): Invoice {
  const existing = data.invoices.find((inv) => inv.bookingId === booking.id);
  if (existing) return existing;
  return {
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
    amountPaid: booking.amountPaid,
    outstandingBalance: booking.totalAmount - booking.amountPaid,
    isMock: true,
    issuedAt: null,
  };
}

export function withCharge(data: EngineData, input: PostChargeInput, source: ActivitySource): EngineData {
  const booking = data.bookings.find((b) => b.id === input.bookingId);
  if (!booking) return data;
  const invoice = findOrCreateInvoice(data, booking);
  const lineItem = { id: makeId('line'), description: input.description, category: input.category, amount: input.amount, postedAt: new Date().toISOString() };
  const updatedInvoice: Invoice = {
    ...invoice,
    lineItems: [...invoice.lineItems, lineItem],
    totalAmount: invoice.totalAmount + input.amount,
    outstandingBalance: invoice.outstandingBalance + input.amount,
  };
  const updatedBooking: Booking = { ...booking, totalAmount: booking.totalAmount + input.amount };

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    invoices: data.invoices.some((i) => i.id === invoice.id)
      ? data.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i))
      : [...data.invoices, updatedInvoice],
    activityLog: [...data.activityLog, logEntry(source, `${input.description} charged`, booking.id, booking.hotelId)],
  };
}

export function withOutstandingPayment(
  data: EngineData,
  payload: { bookingId: string; method: PaymentMethod; amount: number },
  source: ActivitySource,
): { data: EngineData; transaction: MockTransaction } {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) throw new Error(`Unknown booking ${payload.bookingId}`);
  const invoice = findOrCreateInvoice(data, booking);

  const transaction: MockTransaction = {
    id: makeMockRef('TXN'),
    bookingId: booking.id,
    amount: payload.amount,
    method: payload.method,
    status: 'success',
    isMock: true,
    timestamp: new Date().toISOString(),
  };

  const updatedInvoice: Invoice = {
    ...invoice,
    amountPaid: invoice.amountPaid + payload.amount,
    outstandingBalance: Math.max(0, invoice.outstandingBalance - payload.amount),
  };
  const updatedBooking: Booking = { ...booking, amountPaid: booking.amountPaid + payload.amount };

  return {
    transaction,
    data: {
      ...data,
      bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
      invoices: data.invoices.some((i) => i.id === invoice.id)
        ? data.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i))
        : [...data.invoices, updatedInvoice],
      transactions: [...data.transactions, transaction],
      activityLog: [...data.activityLog, logEntry(source, 'Outstanding balance paid', booking.id, booking.hotelId)],
    },
  };
}

/** Pushes a booking's checkout date forward and charges the extra nights at its existing nightly rate. */
export function withStayExtended(data: EngineData, payload: { bookingId: string; newCheckOutDate: string }, source: ActivitySource): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;

  const nights = Math.max(1, Math.round((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86_400_000));
  const addedNights = Math.round((new Date(payload.newCheckOutDate).getTime() - new Date(booking.checkOutDate).getTime()) / 86_400_000);
  if (addedNights <= 0) return data;
  const nightlyRate = Math.round(booking.totalAmount / nights);
  const extraAmount = nightlyRate * addedNights;

  const withCharged = withCharge(
    data,
    { bookingId: booking.id, description: `Stay extended by ${addedNights} night(s)`, category: 'room', amount: extraAmount },
    source,
  );
  const updatedBooking: Booking = { ...withCharged.bookings.find((b) => b.id === booking.id)!, checkOutDate: payload.newCheckOutDate };

  return {
    ...withCharged,
    bookings: withCharged.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    activityLog: [...withCharged.activityLog, logEntry(source, `Stay extended to ${new Date(payload.newCheckOutDate).toLocaleDateString()}`, booking.id, booking.hotelId)],
  };
}

export function withCheckoutCompleted(data: EngineData, payload: { bookingId: string }, source: ActivitySource): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const invoice = findOrCreateInvoice(data, booking);
  const updatedBooking: Booking = { ...booking, status: 'checked_out' };
  const updatedInvoice: Invoice = { ...invoice, issuedAt: new Date().toISOString() };

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    invoices: data.invoices.some((i) => i.id === invoice.id)
      ? data.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i))
      : [...data.invoices, updatedInvoice],
    activityLog: [...data.activityLog, logEntry(source, 'Guest checked out, invoice issued', booking.id, booking.hotelId)],
    notifications: pushNotification(data, booking.guestId, 'Checkout complete', 'Thank you for staying with us — your invoice and voucher are ready.'),
  };
}

export function withGuestCheckedIn(data: EngineData, payload: { bookingId: string }, source: ActivitySource): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const updatedBooking: Booking = { ...booking, status: 'checked_in' };
  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    activityLog: [...data.activityLog, logEntry(source, 'Guest entered room', booking.id, booking.hotelId)],
  };
}

export function withHousekeepingRequest(
  data: EngineData,
  payload: { roomId: string; hotelId: string },
  source: ActivitySource,
): { data: EngineData; task: HousekeepingTask } {
  const task: HousekeepingTask = {
    id: makeId('hk'),
    roomId: payload.roomId,
    hotelId: payload.hotelId,
    assignedStaffId: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  return {
    task,
    data: {
      ...data,
      housekeepingTasks: [...data.housekeepingTasks, task],
      activityLog: [...data.activityLog, logEntry(source, 'Housekeeping requested', null, payload.hotelId)],
    },
  };
}

/**
 * Cross-tab replication for entities created with a fresh id (bookings, concierge
 * requests, housekeeping tasks). The originating tab already generated the id and
 * broadcasts the full entity — remote tabs must insert that exact object rather than
 * generating their own id, or later events referencing it would silently no-op.
 */
export function withRemoteBookingInserted(data: EngineData, booking: Booking, source: ActivitySource): EngineData {
  if (data.bookings.some((b) => b.id === booking.id)) return data;
  return {
    ...data,
    bookings: [...data.bookings, booking],
    activityLog: [...data.activityLog, logEntry(source, 'Booking created', booking.id, booking.hotelId)],
  };
}

export function withRemoteConciergeRequestInserted(data: EngineData, request: ConciergeRequest, source: ActivitySource): EngineData {
  if (data.conciergeRequests.some((r) => r.id === request.id)) return data;
  return {
    ...data,
    conciergeRequests: [...data.conciergeRequests, request],
    activityLog: [...data.activityLog, logEntry(source, `Concierge request: ${request.type.replaceAll('_', ' ')}`, request.bookingId, request.hotelId)],
  };
}

export function withRemoteHousekeepingTaskInserted(data: EngineData, task: HousekeepingTask, source: ActivitySource): EngineData {
  if (data.housekeepingTasks.some((t) => t.id === task.id)) return data;
  return {
    ...data,
    housekeepingTasks: [...data.housekeepingTasks, task],
    activityLog: [...data.activityLog, logEntry(source, 'Housekeeping requested', null, task.hotelId)],
  };
}

export function withMemoryUpdate(
  data: EngineData,
  payload: { guestId: string; patch: Partial<AyanaMemory> },
  source: ActivitySource,
): EngineData {
  const guest = data.guests.find((g) => g.id === payload.guestId);
  if (!guest) return data;
  return {
    ...data,
    guests: data.guests.map((g) =>
      g.id === guest.id ? { ...g, memory: { ...g.memory, ...payload.patch } } : g,
    ),
    activityLog: [...data.activityLog, logEntry(source, 'AYANA Memory updated', null, null)],
  };
}

export function withConciergeRequest(
  data: EngineData,
  input: RequestConciergeInput,
  source: ActivitySource,
): { data: EngineData; request: ConciergeRequest } {
  const request: ConciergeRequest = {
    id: makeId('con'),
    bookingId: input.bookingId,
    guestId: input.guestId,
    hotelId: input.hotelId,
    type: input.type,
    details: input.details,
    status: 'requested',
    createdAt: new Date().toISOString(),
  };
  return {
    request,
    data: {
      ...data,
      conciergeRequests: [...data.conciergeRequests, request],
      activityLog: [...data.activityLog, logEntry(source, `Concierge request: ${input.type.replace('_', ' ')}`, input.bookingId, input.hotelId)],
    },
  };
}

/**
 * One guest-facing service booking. The request the hotel team acts on and the charge on
 * the folio are created together, so a spa slot can never end up as a request nobody
 * billed — or a charge nobody was asked to deliver. Used by the app and the kiosk alike,
 * which is why the same booking shows on the phone whichever surface placed it.
 */
export function withServiceBooked(
  data: EngineData,
  payload: {
    bookingId: string;
    guestId: string;
    hotelId: string;
    requestType: ConciergeRequestType;
    details: string;
    description: string;
    /** 0 for services settled elsewhere, e.g. a free table reservation or cash to the driver. */
    amount: number;
    chargeCategory: InvoiceLineItemCategory;
  },
  source: ActivitySource,
): { data: EngineData; request: ConciergeRequest } {
  const { data: withRequest, request } = withConciergeRequest(
    data,
    {
      bookingId: payload.bookingId,
      guestId: payload.guestId,
      hotelId: payload.hotelId,
      type: payload.requestType,
      details: payload.details,
    },
    source,
  );

  const charged =
    payload.amount > 0
      ? withCharge(
          withRequest,
          { bookingId: payload.bookingId, description: payload.description, category: payload.chargeCategory, amount: payload.amount },
          source,
        )
      : withRequest;

  return {
    request,
    data: {
      ...charged,
      notifications: pushNotification(
        charged,
        payload.guestId,
        'Service booked',
        payload.amount > 0
          ? `${payload.details} — ₹${payload.amount.toLocaleString('en-IN')} added to your room bill.`
          : `${payload.details} — confirmed.`,
      ),
    },
  };
}

function withOverrideLog(
  data: EngineData,
  payload: { staffId: string; action: OverrideAction; bookingId: string; reason: string },
): OverrideLogEntry {
  return {
    id: makeId('ovr'),
    staffId: payload.staffId,
    action: payload.action,
    bookingId: payload.bookingId,
    reason: payload.reason,
    timestamp: new Date().toISOString(),
  };
}

/** Staff-initiated allocation/reassignment — always logged as an override, since a human made the call. */
export function withRoomAssignment(
  data: EngineData,
  payload: { bookingId: string; roomId: string; staffId: string; reason: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const room = data.rooms.find((r) => r.id === payload.roomId);
  const updatedBooking: Booking = {
    ...booking,
    roomId: payload.roomId,
    allocationStatus: 'allocated',
    readyToRoom: room?.status === 'ready' ? { ...booking.readyToRoom, roomReady: true } : booking.readyToRoom,
  };
  const override = withOverrideLog(data, { staffId: payload.staffId, action: 'alternate_room', bookingId: booking.id, reason: payload.reason });

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    overrideLog: [...data.overrideLog, override],
    activityLog: [...data.activityLog, logEntry(source, 'Room allocated/reassigned by staff', booking.id, booking.hotelId)],
  };
}

/**
 * System/PMS-side auto-allocation — a matching, ready room was found for a category-only
 * booking. Not a staff override, so it's activity-logged only, not override-logged.
 */
export function withRoomAutoAllocated(
  data: EngineData,
  payload: { bookingId: string; roomId: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const updatedBooking: Booking = {
    ...booking,
    roomId: payload.roomId,
    allocationStatus: 'allocated',
    readyToRoom: { ...booking.readyToRoom, roomReady: true },
  };

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    activityLog: [...data.activityLog, logEntry(source, 'Room auto-allocated', booking.id, booking.hotelId)],
    notifications: pushNotification(data, booking.guestId, 'Room ready', 'Your room is ready ahead of your arrival.'),
  };
}

/** Confirmed demand for the category already meets/exceeds physical room count — needs staff to resolve. */
export function withRoomOverbooked(data: EngineData, payload: { bookingId: string }, source: ActivitySource): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking || booking.allocationStatus === 'allocated') return data;
  const updatedBooking: Booking = { ...booking, allocationStatus: 'overbooked' };

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    activityLog: [...data.activityLog, logEntry(source, 'Booking flagged overbooked for category', booking.id, booking.hotelId)],
  };
}

/** Rooms of the category exist but none are ready yet (still being cleaned) — guest waits. */
export function withRoomDelayed(data: EngineData, payload: { bookingId: string }, source: ActivitySource): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking || booking.allocationStatus === 'allocated') return data;
  const updatedBooking: Booking = { ...booking, allocationStatus: 'delayed' };

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    activityLog: [...data.activityLog, logEntry(source, 'Room delayed — awaiting housekeeping', booking.id, booking.hotelId)],
  };
}

/** Backdates a real booking's stay window so it genuinely falls outside today — used to demo QR expiry without a blanket toggle. */
export function withBookingWindowExpired(data: EngineData, payload: { bookingId: string }, source: ActivitySource): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const nightMs = new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime();
  const checkOutDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const checkInDate = new Date(new Date(checkOutDate).getTime() - Math.max(nightMs, 24 * 60 * 60 * 1000)).toISOString();
  const updatedBooking: Booking = { ...booking, checkInDate, checkOutDate };

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    activityLog: [...data.activityLog, logEntry(source, 'Booking stay window backdated — QR now expired', booking.id, booking.hotelId)],
  };
}

export function withManualCheckIn(
  data: EngineData,
  payload: { bookingId: string; staffId: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const updatedBooking: Booking = {
    ...booking,
    status: 'checked_in',
    readyToRoom: { ...booking.readyToRoom, identityVerified: true, paymentVerified: true, roomReady: true, keyPathReady: true },
  };
  const override = withOverrideLog(data, { staffId: payload.staffId, action: 'force_check_in', bookingId: booking.id, reason: 'Manual check-in by Front Office' });

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    overrideLog: [...data.overrideLog, override],
    activityLog: [...data.activityLog, logEntry(source, 'Manual check-in by staff', booking.id, booking.hotelId)],
  };
}

export function withManualCheckout(
  data: EngineData,
  payload: { bookingId: string; staffId: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const updatedBooking: Booking = { ...booking, status: 'checked_out' };
  const override = withOverrideLog(data, { staffId: payload.staffId, action: 'force_checkout', bookingId: booking.id, reason: 'Manual checkout by Front Office' });

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    overrideLog: [...data.overrideLog, override],
    activityLog: [...data.activityLog, logEntry(source, 'Manual checkout by staff', booking.id, booking.hotelId)],
  };
}

export function withOverridePayment(
  data: EngineData,
  payload: { bookingId: string; staffId: string; reason: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const updatedBooking: Booking = {
    ...booking,
    amountPaid: booking.totalAmount,
    status: booking.status === 'pending_payment' ? 'confirmed' : booking.status,
    readyToRoom: { ...booking.readyToRoom, paymentVerified: true },
  };
  const override = withOverrideLog(data, { staffId: payload.staffId, action: 'override_verification', bookingId: booking.id, reason: payload.reason });

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    overrideLog: [...data.overrideLog, override],
    activityLog: [...data.activityLog, logEntry(source, 'Payment overridden by staff', booking.id, booking.hotelId)],
  };
}

export function withWaiveCharges(
  data: EngineData,
  payload: { bookingId: string; staffId: string; reason: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const invoice = data.invoices.find((i) => i.bookingId === booking.id);
  const override = withOverrideLog(data, { staffId: payload.staffId, action: 'waive_charges', bookingId: booking.id, reason: payload.reason });

  return {
    ...data,
    invoices: invoice
      ? data.invoices.map((i) => (i.id === invoice.id ? { ...i, outstandingBalance: 0, amountPaid: i.totalAmount } : i))
      : data.invoices,
    bookings: data.bookings.map((b) => (b.id === booking.id ? { ...b, amountPaid: b.totalAmount } : b)),
    overrideLog: [...data.overrideLog, override],
    activityLog: [...data.activityLog, logEntry(source, 'Charges waived by staff', booking.id, booking.hotelId)],
  };
}

export function withBookingCancelled(
  data: EngineData,
  payload: { bookingId: string; staffId: string; reason: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const updatedBooking: Booking = { ...booking, status: 'cancelled' };
  const override = withOverrideLog(data, { staffId: payload.staffId, action: 'cancel_booking', bookingId: booking.id, reason: payload.reason });

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    overrideLog: [...data.overrideLog, override],
    activityLog: [...data.activityLog, logEntry(source, 'Booking cancelled', booking.id, booking.hotelId)],
    notifications: pushNotification(data, booking.guestId, 'Booking cancelled', 'Your booking has been cancelled. Please contact us if this is unexpected.'),
  };
}

/**
 * Guest-initiated cancellation, available at any point before the stay starts. The refund
 * is quoted against the hotel's published ladder in the app *before* the guest confirms
 * and passed in here, so what they were shown is exactly what gets recorded. Any room
 * already held for the booking goes straight back into sellable inventory.
 */
export function withGuestCancellation(
  data: EngineData,
  payload: { bookingId: string; refundAmount: number; reason: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;

  const updatedBooking: Booking = { ...booking, status: 'cancelled' };
  const heldRoomId = booking.roomId;

  const base: EngineData = {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    rooms: heldRoomId
      ? data.rooms.map((r) => (r.id === heldRoomId ? { ...r, status: 'ready' as RoomStatus } : r))
      : data.rooms,
    activityLog: [...data.activityLog, logEntry(source, `Booking cancelled by guest — ${payload.reason}`, booking.id, booking.hotelId)],
    notifications: pushNotification(
      data,
      booking.guestId,
      'Booking cancelled',
      payload.refundAmount > 0
        ? `Your booking is cancelled. ₹${payload.refundAmount.toLocaleString('en-IN')} will be refunded to your original payment method.`
        : 'Your booking is cancelled. No refund applies under the hotel’s cancellation policy.',
    ),
  };

  if (payload.refundAmount <= 0) return base;
  return withRefundIssued(base, { bookingId: booking.id, amount: payload.refundAmount, reason: payload.reason }, source).data;
}

/**
 * Guest changes dates or party size. Re-prices at the booking's existing nightly rate and
 * posts the difference (or a credit) to the folio immediately, so the cost of the change
 * is visible right away rather than surfacing as a surprise at checkout.
 */
export function withBookingModified(
  data: EngineData,
  payload: { bookingId: string; checkInDate: string; checkOutDate: string; guestsCount: number },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;

  const oldNights = nightsOf(booking.checkInDate, booking.checkOutDate);
  const newNights = nightsOf(payload.checkInDate, payload.checkOutDate);
  const nightlyRate = Math.round(booking.totalAmount / oldNights);
  const difference = nightlyRate * (newNights - oldNights);

  const priced =
    difference !== 0
      ? withCharge(
          data,
          {
            bookingId: booking.id,
            description: difference > 0 ? `Stay extended to ${newNights} night(s)` : `Stay shortened to ${newNights} night(s)`,
            category: 'room',
            amount: difference,
          },
          source,
        )
      : data;

  const current = priced.bookings.find((b) => b.id === booking.id) ?? booking;
  const updatedBooking: Booking = {
    ...current,
    checkInDate: payload.checkInDate,
    checkOutDate: payload.checkOutDate,
    guestsCount: payload.guestsCount,
  };

  return {
    ...priced,
    bookings: priced.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    activityLog: [...priced.activityLog, logEntry(source, 'Booking modified by guest', booking.id, booking.hotelId)],
    notifications: pushNotification(
      priced,
      booking.guestId,
      'Booking updated',
      `Your stay is now ${newNights} night(s) for ${payload.guestsCount} guest(s).`,
    ),
  };
}

/**
 * Guest asks to move up a category from the app — including mid-stay. A physical room move
 * needs a human, so this raises a Front Office task and drops the booking back to 'pending'
 * allocation rather than inventing a room number. The guest keeps their current room (and
 * working key) until staff confirm the move.
 */
export function withRoomUpgradeRequested(
  data: EngineData,
  payload: { bookingId: string; newCategory: RoomCategory; extraAmount: number },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;

  const charged =
    payload.extraAmount > 0
      ? withCharge(
          data,
          { bookingId: booking.id, description: `Upgrade to ${payload.newCategory} room`, category: 'room', amount: payload.extraAmount },
          source,
        )
      : data;

  const { data: withRequest } = withConciergeRequest(
    charged,
    {
      bookingId: booking.id,
      guestId: booking.guestId,
      hotelId: booking.hotelId,
      type: 'special_request',
      details: `Room upgrade to ${payload.newCategory}${booking.status === 'checked_in' ? ' — guest is in-house, room move required' : ''}`,
    },
    source,
  );

  const current = withRequest.bookings.find((b) => b.id === booking.id) ?? booking;
  const updatedBooking: Booking = {
    ...current,
    roomCategory: payload.newCategory,
    allocationStatus: 'pending',
  };

  return {
    ...withRequest,
    bookings: withRequest.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    activityLog: [...withRequest.activityLog, logEntry(source, `Upgrade requested to ${payload.newCategory}`, booking.id, booking.hotelId)],
    notifications: pushNotification(
      withRequest,
      booking.guestId,
      'Upgrade requested',
      `Front Office is arranging your move to a ${payload.newCategory} room. We'll confirm your new room number shortly.`,
    ),
  };
}

/**
 * Kiosk upsell taken at check-in: the guest picks a higher category, pays on the spot and
 * walks away with a new room number. Unlike the app's request flow this completes
 * immediately, because a specific free room was chosen and settled at the machine.
 */
export function withRoomUpgradedNow(
  data: EngineData,
  payload: { bookingId: string; newCategory: RoomCategory; newRoomId: string; extraAmount: number; method: PaymentMethod },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;

  const charged = withCharge(
    data,
    { bookingId: booking.id, description: `Room upgrade to ${payload.newCategory}`, category: 'room', amount: payload.extraAmount },
    source,
  );
  const paid = withOutstandingPayment(
    charged,
    { bookingId: booking.id, method: payload.method, amount: payload.extraAmount },
    source,
  ).data;

  const previousRoomId = booking.roomId;
  const current = paid.bookings.find((b) => b.id === booking.id) ?? booking;
  const updatedBooking: Booking = {
    ...current,
    roomCategory: payload.newCategory,
    roomId: payload.newRoomId,
    allocationStatus: 'allocated',
    readyToRoom: { ...current.readyToRoom, roomReady: true },
  };

  return {
    ...paid,
    bookings: paid.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    rooms: paid.rooms.map((r) => {
      if (r.id === payload.newRoomId) return { ...r, status: 'occupied' as RoomStatus };
      // The room they were about to take goes back on sale — they never occupied it.
      if (previousRoomId && r.id === previousRoomId) return { ...r, status: 'ready' as RoomStatus };
      return r;
    }),
    activityLog: [...paid.activityLog, logEntry(source, `Upgraded to ${payload.newCategory} at kiosk`, booking.id, booking.hotelId)],
    notifications: pushNotification(
      paid,
      booking.guestId,
      'Room upgraded',
      `You've been upgraded to a ${payload.newCategory} room. Your new room number is in the app.`,
    ),
  };
}

export function withReissueKey(
  data: EngineData,
  payload: { bookingId: string; staffId: string },
  source: ActivitySource,
): EngineData {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return data;
  const updatedBooking: Booking = { ...booking, readyToRoom: { ...booking.readyToRoom, qrCode: `AYANA-${booking.id}-${Date.now().toString(36)}` } };
  const override = withOverrideLog(data, { staffId: payload.staffId, action: 'reissue_key', bookingId: booking.id, reason: 'Replacement key issued' });

  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === booking.id ? updatedBooking : b)),
    overrideLog: [...data.overrideLog, override],
    activityLog: [...data.activityLog, logEntry(source, 'Replacement key issued', booking.id, booking.hotelId)],
  };
}

export function withHousekeepingTaskUpdate(
  data: EngineData,
  payload: { taskId: string; status: HousekeepingTaskStatus },
  source: ActivitySource,
): EngineData {
  const task = data.housekeepingTasks.find((t) => t.id === payload.taskId);
  if (!task) return data;
  const updated = { ...task, status: payload.status, completedAt: payload.status === 'done' ? new Date().toISOString() : task.completedAt };

  return {
    ...data,
    housekeepingTasks: data.housekeepingTasks.map((t) => (t.id === task.id ? updated : t)),
    activityLog: [...data.activityLog, logEntry(source, `Housekeeping task ${payload.status.replace('_', ' ')}`, null, task.hotelId)],
  };
}

export function withConciergeStatusUpdate(
  data: EngineData,
  payload: { requestId: string; status: ConciergeRequestStatus },
  source: ActivitySource,
): EngineData {
  const request = data.conciergeRequests.find((r) => r.id === payload.requestId);
  if (!request) return data;
  const updated = { ...request, status: payload.status };

  return {
    ...data,
    conciergeRequests: data.conciergeRequests.map((r) => (r.id === request.id ? updated : r)),
    activityLog: [...data.activityLog, logEntry(source, `Concierge request ${payload.status}`, request.bookingId, request.hotelId)],
    notifications:
      payload.status === 'confirmed'
        ? pushNotification(data, request.guestId, 'Request confirmed', `Your ${request.type.replaceAll('_', ' ')} request has been confirmed.`)
        : data.notifications,
  };
}

export function withRefundIssued(
  data: EngineData,
  payload: { bookingId: string; amount: number; reason: string },
  source: ActivitySource,
): { data: EngineData; refund: RefundRecord } {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  const refund: RefundRecord = {
    id: makeId('rfd'),
    bookingId: payload.bookingId,
    amount: payload.amount,
    reason: payload.reason,
    isMock: true,
    timestamp: new Date().toISOString(),
  };

  return {
    refund,
    data: {
      ...data,
      refunds: [...data.refunds, refund],
      activityLog: [...data.activityLog, logEntry(source, `Refund issued: ${payload.reason}`, payload.bookingId, booking?.hotelId ?? null)],
    },
  };
}

export function withFeedbackSubmitted(
  data: EngineData,
  payload: { bookingId: string; rating: 1 | 2 | 3 | 4 | 5; comment: string },
  source: ActivitySource,
): { data: EngineData; feedback: GuestFeedback } {
  const booking = data.bookings.find((b) => b.id === payload.bookingId);
  if (!booking) throw new Error(`Unknown booking ${payload.bookingId}`);

  const feedback: GuestFeedback = {
    id: makeId('fb'),
    bookingId: booking.id,
    guestId: booking.guestId,
    hotelId: booking.hotelId,
    rating: payload.rating,
    comment: payload.comment,
    submittedAt: new Date().toISOString(),
  };

  return {
    feedback,
    data: {
      ...data,
      feedback: [...data.feedback, feedback],
      activityLog: [...data.activityLog, logEntry(source, `Guest feedback submitted (${payload.rating}★)`, booking.id, booking.hotelId)],
    },
  };
}

export function withNotification(
  data: EngineData,
  payload: { guestId: string; channel: NotificationChannel; title: string; body: string },
): EngineData {
  const notification: MockNotification = {
    id: makeId('ntf'),
    guestId: payload.guestId,
    channel: payload.channel,
    title: payload.title,
    body: payload.body,
    isMock: true,
    sentAt: new Date().toISOString(),
    read: false,
  };
  return { ...data, notifications: [...data.notifications, notification] };
}
