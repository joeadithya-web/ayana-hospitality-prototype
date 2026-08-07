/**
 * Contract for cross-app sync. The Simulation Engine broadcasts these over a
 * same-origin BroadcastChannel (with a localStorage fallback for older
 * contexts); every app subscribes and reconciles its own view of state.
 * No backend is involved.
 */
export type SimulationEventType =
  | 'booking_created'
  | 'payment_received'
  | 'identity_verified'
  | 'memory_updated'
  | 'room_allocated'
  | 'room_overbooked'
  | 'room_delayed'
  | 'booking_window_expired'
  | 'stay_extended'
  | 'room_status_changed'
  | 'room_ready'
  | 'housekeeping_task_created'
  | 'housekeeping_task_updated'
  | 'guest_arrived'
  | 'qr_scanned'
  | 'key_issued'
  | 'guest_entered_room'
  | 'concierge_request_created'
  | 'concierge_request_updated'
  | 'balance_updated'
  | 'checkout_completed'
  | 'invoice_issued'
  | 'demo_scenario_triggered'
  | 'failure_scenario_triggered'
  | 'override_applied'
  | 'notification_sent'
  | 'feedback_submitted'
  | 'demo_reset';

export interface SimulationEvent<TPayload = unknown> {
  id: string;
  type: SimulationEventType;
  timestamp: string;
  payload: TPayload;
}
