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
}
