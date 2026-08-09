export type NotificationChannel = 'push' | 'sms' | 'email' | 'in_app';

/** Always simulated — no real SMS/email/push provider in the PT. */
export interface MockNotification {
  id: string;
  guestId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  isMock: true;
  sentAt: string;
  read: boolean;
  /** Traveller-app route to open when the guest taps this notification, if any. */
  actionRoute?: string;
}
