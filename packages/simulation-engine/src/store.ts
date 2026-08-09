import { create } from 'zustand';
import { generateSeedData } from '@ayana/mock-data';
import type {
  ActivitySource,
  AyanaMemory,
  Booking,
  ConciergeRequest,
  ConciergeRequestStatus,
  ConciergeRequestType,
  CsiScore,
  FailureScenarioId,
  GuestFeedback,
  HousekeepingTask,
  HousekeepingTaskStatus,
  IntentTask,
  InvoiceLineItemCategory,
  MockTransaction,
  NotificationChannel,
  PaymentMethod,
  ReadyToRoomStatus,
  RefundRecord,
  RoomCategory,
  RoomStatus,
} from '@ayana/shared-types';
import { simulationBus } from './broadcast';
import type { CreateBookingInput, CreateGroupBookingInput, EngineData, PostChargeInput, RegisterGuestInput } from './types';
import {
  withBookingCancelled,
  withBookingCreated,
  withBookingModified,
  withCharge,
  withGroupBookingCreated,
  withGuestCancellation,
  withRoomUpgradeRequested,
  withRoomUpgradedNow,
  withServiceBooked,
  withCheckoutCompleted,
  withConciergeRequest,
  withConciergeStatusUpdate,
  withFeedbackReminderChecked,
  withFeedbackSubmitted,
  withGuestRegistered,
  withGuestCheckedIn,
  withHousekeepingRequest,
  withHousekeepingTaskUpdate,
  withIntentTaskUpdate,
  withManualCheckIn,
  withManualCheckout,
  withMemoryUpdate,
  withNotification,
  withOutstandingPayment,
  withOverridePayment,
  withPaymentReceived,
  withReadyToRoomPatch,
  withReissueKey,
  withRefundIssued,
  withRemoteBookingInserted,
  withRemoteConciergeRequestInserted,
  withRemoteHousekeepingTaskInserted,
  withRemoteIntentTaskInserted,
  withBookingWindowExpired,
  withRoomAssignment,
  withRoomAutoAllocated,
  withRoomDelayed,
  withRoomOverbooked,
  withRoomStatus,
  withStayExtended,
  withWaiveCharges,
} from './mutators';

const STORAGE_KEY = 'ayana-simulation-state-v9';

/** Which app instance this browser tab is running — set once by each app's root on mount. */
let activeSource: ActivitySource = typeof window === 'undefined' ? 'system' : 'traveller_app';
export function setActiveSource(source: ActivitySource): void {
  activeSource = source;
}
function currentSource(): ActivitySource {
  return activeSource;
}

function loadPersisted(): EngineData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EngineData) : null;
  } catch {
    return null;
  }
}

function persist(data: EngineData) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initialData(): EngineData {
  return loadPersisted() ?? { ...generateSeedData(), currentGuestId: null, currentStaffId: null, currentCorporateId: null, activeFailureScenario: null };
}

export interface EngineActions {
  resetDemo: () => void;
  login: (guestId: string) => void;
  logout: () => void;
  loginStaff: (staffId: string) => void;
  logoutStaff: () => void;
  /** Sign in to a signed corporate agreement — switches the app into corporate mode. */
  loginCorporate: (corporateId: string) => void;
  logoutCorporate: () => void;
  createGroupBooking: (input: CreateGroupBookingInput) => Booking[];
  updateMemory: (guestId: string, patch: Partial<AyanaMemory>) => void;
  registerGuest: (input: RegisterGuestInput) => void;
  createBooking: (input: CreateBookingInput) => Booking;
  payBooking: (bookingId: string, method: PaymentMethod, amount: number) => MockTransaction;
  setRoomStatus: (roomId: string, status: RoomStatus) => void;
  updateReadyToRoom: (bookingId: string, patch: Partial<ReadyToRoomStatus>) => void;
  checkInGuest: (bookingId: string) => void;
  requestHousekeeping: (roomId: string, hotelId: string) => void;
  postCharge: (input: PostChargeInput) => void;
  payOutstanding: (bookingId: string, method: PaymentMethod, amount: number) => MockTransaction;
  completeCheckout: (bookingId: string) => void;
  extendStay: (bookingId: string, newCheckOutDate: string) => void;
  requestConcierge: (input: {
    bookingId: string;
    guestId: string;
    hotelId: string;
    type: ConciergeRequestType;
    details: string;
  }) => ConciergeRequest;
  sendNotification: (guestId: string, channel: NotificationChannel, title: string, body: string) => void;
  assignRoom: (bookingId: string, roomId: string, staffId: string, reason: string) => void;
  autoAllocateRoom: (bookingId: string, roomId: string) => void;
  markOverbooked: (bookingId: string) => void;
  markDelayed: (bookingId: string) => void;
  manualCheckIn: (bookingId: string, staffId: string) => void;
  manualCheckout: (bookingId: string, staffId: string) => void;
  overridePayment: (bookingId: string, staffId: string, reason: string) => void;
  waiveCharges: (bookingId: string, staffId: string, reason: string) => void;
  reissueKey: (bookingId: string, staffId: string) => void;
  cancelBooking: (bookingId: string, staffId: string, reason: string) => void;
  /** Guest-side cancellation; `refundAmount` is the figure already quoted to the guest. */
  cancelBookingByGuest: (bookingId: string, refundAmount: number, reason: string) => void;
  modifyBooking: (bookingId: string, checkInDate: string, checkOutDate: string, guestsCount: number) => void;
  bookService: (input: {
    bookingId: string;
    guestId: string;
    hotelId: string;
    requestType: ConciergeRequestType;
    details: string;
    description: string;
    amount: number;
    chargeCategory: InvoiceLineItemCategory;
  }) => ConciergeRequest;
  /** App-side upgrade: raises a Front Office move task rather than allocating instantly. */
  requestRoomUpgrade: (bookingId: string, newCategory: RoomCategory, extraAmount: number) => void;
  /** Kiosk-side upgrade: a specific room is chosen and paid for on the spot. */
  upgradeRoomNow: (
    bookingId: string,
    newCategory: RoomCategory,
    newRoomId: string,
    extraAmount: number,
    method: PaymentMethod,
  ) => void;
  expireBookingWindow: (bookingId: string) => void;
  updateHousekeepingTask: (taskId: string, status: HousekeepingTaskStatus) => void;
  updateConciergeStatus: (requestId: string, status: ConciergeRequestStatus) => void;
  updateIntentTask: (taskId: string, status: IntentTask['status']) => void;
  issueRefund: (bookingId: string, amount: number, reason: string) => RefundRecord;
  submitFeedback: (
    bookingId: string,
    csiScore: CsiScore,
    derivedStarRating: 1 | 2 | 3 | 4 | 5,
    comment: string,
    followUpAnswer?: string,
  ) => GuestFeedback;
  checkFeedbackReminders: (guestId: string) => void;
  setActiveFailureScenario: (scenario: FailureScenarioId | null) => void;
}

export type EngineStore = EngineData & EngineActions;

export const useSimulationStore = create<EngineStore>()((set, get) => ({
  ...initialData(),

  resetDemo: () => {
    const fresh: EngineData = { ...generateSeedData(), currentGuestId: null, currentStaffId: null, currentCorporateId: null, activeFailureScenario: null };
    set(fresh);
    persist(fresh);
    simulationBus.publish('demo_reset', fresh);
  },

  login: (guestId) => set({ currentGuestId: guestId }),
  logout: () => set({ currentGuestId: null, currentCorporateId: null }),
  loginStaff: (staffId) => set({ currentStaffId: staffId }),
  logoutStaff: () => set({ currentStaffId: null }),
  loginCorporate: (corporateId) => set({ currentCorporateId: corporateId }),
  logoutCorporate: () => set({ currentCorporateId: null }),

  createGroupBooking: (input) => {
    const { data, bookings } = withGroupBookingCreated(get(), input, currentSource());
    set(data);
    // Replayed one-by-one through the proven insert path so other tabs keep the same IDs.
    bookings.forEach((b) => simulationBus.publish('booking_created', b));
    return bookings;
  },

  updateMemory: (guestId, patch) => {
    const next = withMemoryUpdate(get(), { guestId, patch }, currentSource());
    set(next);
    simulationBus.publish('memory_updated', { guestId, patch });
  },

  registerGuest: (input) => {
    const next = withGuestRegistered(get(), input, currentSource());
    set(next);
    simulationBus.publish('guest_registered', input);
  },

  createBooking: (input) => {
    const { data, booking, intentTasks, conciergeRequests } = withBookingCreated(get(), input, currentSource());
    set(data);
    simulationBus.publish('booking_created', booking);
    // Replayed the same way group-booking rooms are — one event per entity so remote tabs
    // insert the exact same ids rather than regenerating their own.
    intentTasks.forEach((task) => simulationBus.publish('intent_task_created', task));
    conciergeRequests.forEach((request) => simulationBus.publish('concierge_request_created', request));
    return booking;
  },

  payBooking: (bookingId, method, amount) => {
    const { data, transaction } = withPaymentReceived(get(), { bookingId, method, amount }, currentSource());
    set(data);
    simulationBus.publish('payment_received', { bookingId, method, amount });
    return transaction;
  },

  setRoomStatus: (roomId, status) => {
    const next = withRoomStatus(get(), { roomId, status }, currentSource());
    set(next);
    simulationBus.publish('room_status_changed', { roomId, status });
  },

  updateReadyToRoom: (bookingId, patch) => {
    const next = withReadyToRoomPatch(get(), { bookingId, patch }, currentSource());
    set(next);
    simulationBus.publish('room_ready', { bookingId, patch });
  },

  checkInGuest: (bookingId) => {
    const next = withGuestCheckedIn(get(), { bookingId }, currentSource());
    set(next);
    simulationBus.publish('guest_entered_room', { bookingId });
  },

  requestHousekeeping: (roomId, hotelId) => {
    const { data, task } = withHousekeepingRequest(get(), { roomId, hotelId }, currentSource());
    set(data);
    simulationBus.publish('housekeeping_task_created', task);
  },

  postCharge: (input) => {
    const next = withCharge(get(), input, currentSource());
    set(next);
    simulationBus.publish('balance_updated', input);
  },

  payOutstanding: (bookingId, method, amount) => {
    const { data, transaction } = withOutstandingPayment(get(), { bookingId, method, amount }, currentSource());
    set(data);
    simulationBus.publish('balance_updated', { bookingId, method, amount });
    return transaction;
  },

  completeCheckout: (bookingId) => {
    const next = withCheckoutCompleted(get(), { bookingId }, currentSource());
    set(next);
    simulationBus.publish('checkout_completed', { bookingId });
  },

  extendStay: (bookingId, newCheckOutDate) => {
    const next = withStayExtended(get(), { bookingId, newCheckOutDate }, currentSource());
    set(next);
    simulationBus.publish('stay_extended', { bookingId, newCheckOutDate });
  },

  requestConcierge: (input) => {
    const { data, request } = withConciergeRequest(get(), input, currentSource());
    set(data);
    simulationBus.publish('concierge_request_created', request);
    return request;
  },

  sendNotification: (guestId, channel, title, body) => {
    const next = withNotification(get(), { guestId, channel, title, body });
    set(next);
    simulationBus.publish('notification_sent', { guestId, channel, title, body });
  },

  assignRoom: (bookingId, roomId, staffId, reason) => {
    const next = withRoomAssignment(get(), { bookingId, roomId, staffId, reason }, currentSource());
    set(next);
    simulationBus.publish('override_applied', { kind: 'assign_room', bookingId, roomId, staffId, reason });
  },

  autoAllocateRoom: (bookingId, roomId) => {
    const next = withRoomAutoAllocated(get(), { bookingId, roomId }, currentSource());
    set(next);
    simulationBus.publish('room_allocated', { bookingId, roomId });
  },

  markOverbooked: (bookingId) => {
    const next = withRoomOverbooked(get(), { bookingId }, currentSource());
    set(next);
    simulationBus.publish('room_overbooked', { bookingId });
  },

  markDelayed: (bookingId) => {
    const next = withRoomDelayed(get(), { bookingId }, currentSource());
    set(next);
    simulationBus.publish('room_delayed', { bookingId });
  },

  manualCheckIn: (bookingId, staffId) => {
    const next = withManualCheckIn(get(), { bookingId, staffId }, currentSource());
    set(next);
    simulationBus.publish('override_applied', { kind: 'manual_check_in', bookingId, staffId });
  },

  manualCheckout: (bookingId, staffId) => {
    const next = withManualCheckout(get(), { bookingId, staffId }, currentSource());
    set(next);
    simulationBus.publish('override_applied', { kind: 'manual_checkout', bookingId, staffId });
  },

  overridePayment: (bookingId, staffId, reason) => {
    const next = withOverridePayment(get(), { bookingId, staffId, reason }, currentSource());
    set(next);
    simulationBus.publish('override_applied', { kind: 'override_payment', bookingId, staffId, reason });
  },

  waiveCharges: (bookingId, staffId, reason) => {
    const next = withWaiveCharges(get(), { bookingId, staffId, reason }, currentSource());
    set(next);
    simulationBus.publish('override_applied', { kind: 'waive_charges', bookingId, staffId, reason });
  },

  reissueKey: (bookingId, staffId) => {
    const next = withReissueKey(get(), { bookingId, staffId }, currentSource());
    set(next);
    simulationBus.publish('override_applied', { kind: 'reissue_key', bookingId, staffId });
  },

  cancelBooking: (bookingId, staffId, reason) => {
    const next = withBookingCancelled(get(), { bookingId, staffId, reason }, currentSource());
    set(next);
    simulationBus.publish('override_applied', { kind: 'cancel_booking', bookingId, staffId, reason });
  },

  cancelBookingByGuest: (bookingId, refundAmount, reason) => {
    const next = withGuestCancellation(get(), { bookingId, refundAmount, reason }, currentSource());
    set(next);
    simulationBus.publish('booking_cancelled_by_guest', { bookingId, refundAmount, reason });
  },

  modifyBooking: (bookingId, checkInDate, checkOutDate, guestsCount) => {
    const next = withBookingModified(get(), { bookingId, checkInDate, checkOutDate, guestsCount }, currentSource());
    set(next);
    simulationBus.publish('booking_modified', { bookingId, checkInDate, checkOutDate, guestsCount });
  },

  bookService: (input) => {
    const { data, request } = withServiceBooked(get(), input, currentSource());
    set(data);
    // Replayed as the two primitives other tabs already reconcile correctly. A single
    // composite event would mint a second request ID in every other tab.
    simulationBus.publish('concierge_request_created', request);
    if (input.amount > 0) {
      simulationBus.publish('balance_updated', {
        bookingId: input.bookingId,
        description: input.description,
        category: input.chargeCategory,
        amount: input.amount,
      });
    }
    return request;
  },

  requestRoomUpgrade: (bookingId, newCategory, extraAmount) => {
    const next = withRoomUpgradeRequested(get(), { bookingId, newCategory, extraAmount }, currentSource());
    set(next);
    simulationBus.publish('room_upgrade_requested', { bookingId, newCategory, extraAmount });
  },

  upgradeRoomNow: (bookingId, newCategory, newRoomId, extraAmount, method) => {
    const next = withRoomUpgradedNow(get(), { bookingId, newCategory, newRoomId, extraAmount, method }, currentSource());
    set(next);
    simulationBus.publish('room_upgraded', { bookingId, newCategory, newRoomId, extraAmount, method });
  },

  expireBookingWindow: (bookingId) => {
    const next = withBookingWindowExpired(get(), { bookingId }, currentSource());
    set(next);
    simulationBus.publish('booking_window_expired', { bookingId });
  },

  updateHousekeepingTask: (taskId, status) => {
    const next = withHousekeepingTaskUpdate(get(), { taskId, status }, currentSource());
    set(next);
    simulationBus.publish('housekeeping_task_updated', { taskId, status });
  },

  updateConciergeStatus: (requestId, status) => {
    const next = withConciergeStatusUpdate(get(), { requestId, status }, currentSource());
    set(next);
    simulationBus.publish('concierge_request_updated', { requestId, status });
  },

  updateIntentTask: (taskId, status) => {
    const next = withIntentTaskUpdate(get(), { taskId, status }, currentSource());
    set(next);
    simulationBus.publish('intent_task_updated', { taskId, status });
  },

  issueRefund: (bookingId, amount, reason) => {
    const { data, refund } = withRefundIssued(get(), { bookingId, amount, reason }, currentSource());
    set(data);
    simulationBus.publish('balance_updated', { kind: 'refund', bookingId, amount, reason });
    return refund;
  },

  submitFeedback: (bookingId, csiScore, derivedStarRating, comment, followUpAnswer) => {
    const payload = { bookingId, csiScore, derivedStarRating, comment, followUpAnswer };
    const { data, feedback } = withFeedbackSubmitted(get(), payload, currentSource());
    set(data);
    simulationBus.publish('feedback_submitted', payload);
    return feedback;
  },

  checkFeedbackReminders: (guestId) => {
    set(withFeedbackReminderChecked(get(), guestId, currentSource()));
  },

  setActiveFailureScenario: (scenario) => {
    set({ activeFailureScenario: scenario });
    simulationBus.publish('failure_scenario_triggered', { scenario });
  },
}));

// Persist every data change so a page refresh mid-demo doesn't lose progress.
useSimulationStore.subscribe((state) => persist(state));

// Cross-tab/cross-app sync: apply mutations that originated in another route/tab
// of this same single-origin app. We never re-publish here, which prevents echo loops.
simulationBus.subscribe((event) => {
  const state = useSimulationStore.getState();
  switch (event.type) {
    case 'booking_created':
      useSimulationStore.setState(withRemoteBookingInserted(state, event.payload as Booking, 'system'));
      break;
    case 'payment_received':
      useSimulationStore.setState(withPaymentReceived(state, event.payload as any, 'system').data);
      break;
    case 'room_status_changed':
      useSimulationStore.setState(withRoomStatus(state, event.payload as any, 'system'));
      break;
    case 'room_allocated':
      useSimulationStore.setState(withRoomAutoAllocated(state, event.payload as any, 'system'));
      break;
    case 'room_overbooked':
      useSimulationStore.setState(withRoomOverbooked(state, event.payload as any, 'system'));
      break;
    case 'room_delayed':
      useSimulationStore.setState(withRoomDelayed(state, event.payload as any, 'system'));
      break;
    case 'booking_window_expired':
      useSimulationStore.setState(withBookingWindowExpired(state, event.payload as any, 'system'));
      break;
    case 'stay_extended':
      useSimulationStore.setState(withStayExtended(state, event.payload as any, 'system'));
      break;
    case 'booking_modified':
      useSimulationStore.setState(withBookingModified(state, event.payload as any, 'system'));
      break;
    case 'booking_cancelled_by_guest':
      useSimulationStore.setState(withGuestCancellation(state, event.payload as any, 'system'));
      break;
    case 'room_upgrade_requested':
      useSimulationStore.setState(withRoomUpgradeRequested(state, event.payload as any, 'system'));
      break;
    case 'room_upgraded':
      useSimulationStore.setState(withRoomUpgradedNow(state, event.payload as any, 'system'));
      break;
    case 'room_ready':
      useSimulationStore.setState(withReadyToRoomPatch(state, event.payload as any, 'system'));
      break;
    case 'guest_entered_room':
      useSimulationStore.setState(withGuestCheckedIn(state, event.payload as any, 'system'));
      break;
    case 'balance_updated': {
      const payload = event.payload as Record<string, unknown>;
      if (payload.kind === 'refund') {
        useSimulationStore.setState(withRefundIssued(state, payload as any, 'system').data);
      } else if ('method' in payload) {
        useSimulationStore.setState(withOutstandingPayment(state, payload as any, 'system').data);
      } else {
        useSimulationStore.setState(withCharge(state, payload as any, 'system'));
      }
      break;
    }
    case 'checkout_completed':
      useSimulationStore.setState(withCheckoutCompleted(state, event.payload as any, 'system'));
      break;
    case 'memory_updated':
      useSimulationStore.setState(withMemoryUpdate(state, event.payload as any, 'system'));
      break;
    case 'guest_registered':
      useSimulationStore.setState(withGuestRegistered(state, event.payload as any, 'system'));
      break;
    case 'concierge_request_created':
      useSimulationStore.setState(withRemoteConciergeRequestInserted(state, event.payload as ConciergeRequest, 'system'));
      break;
    case 'concierge_request_updated':
      useSimulationStore.setState(withConciergeStatusUpdate(state, event.payload as any, 'system'));
      break;
    case 'housekeeping_task_created':
      useSimulationStore.setState(withRemoteHousekeepingTaskInserted(state, event.payload as HousekeepingTask, 'system'));
      break;
    case 'housekeeping_task_updated':
      useSimulationStore.setState(withHousekeepingTaskUpdate(state, event.payload as any, 'system'));
      break;
    case 'intent_task_created':
      useSimulationStore.setState(withRemoteIntentTaskInserted(state, event.payload as IntentTask, 'system'));
      break;
    case 'intent_task_updated':
      useSimulationStore.setState(withIntentTaskUpdate(state, event.payload as any, 'system'));
      break;
    case 'notification_sent':
      useSimulationStore.setState(withNotification(state, event.payload as any));
      break;
    case 'feedback_submitted':
      useSimulationStore.setState(withFeedbackSubmitted(state, event.payload as any, 'system').data);
      break;
    case 'failure_scenario_triggered':
      useSimulationStore.setState({ activeFailureScenario: (event.payload as { scenario: FailureScenarioId | null }).scenario });
      break;
    case 'demo_reset':
      useSimulationStore.setState(event.payload as EngineData);
      break;
    case 'override_applied': {
      const payload = event.payload as Record<string, unknown>;
      if (payload.kind === 'assign_room') useSimulationStore.setState(withRoomAssignment(state, payload as any, 'system'));
      else if (payload.kind === 'manual_check_in') useSimulationStore.setState(withManualCheckIn(state, payload as any, 'system'));
      else if (payload.kind === 'manual_checkout') useSimulationStore.setState(withManualCheckout(state, payload as any, 'system'));
      else if (payload.kind === 'override_payment') useSimulationStore.setState(withOverridePayment(state, payload as any, 'system'));
      else if (payload.kind === 'waive_charges') useSimulationStore.setState(withWaiveCharges(state, payload as any, 'system'));
      else if (payload.kind === 'reissue_key') useSimulationStore.setState(withReissueKey(state, payload as any, 'system'));
      else if (payload.kind === 'cancel_booking') useSimulationStore.setState(withBookingCancelled(state, payload as any, 'system'));
      break;
    }
    default:
      break;
  }
});
