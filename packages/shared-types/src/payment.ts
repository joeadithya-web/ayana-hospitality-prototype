/**
 * All money-related types are mock-only by design (per project decision: no real
 * payment gateway, no real charges). The `isMock: true` literal is a deliberate
 * guardrail so nothing here can be mistaken for a live financial integration.
 */

export type PaymentMethod =
  | 'upi'
  | 'credit_card'
  | 'wallet'
  | 'gift_card'
  | 'cash_front_desk'
  /** Corporate accounts only — settled on the contract's billing cycle, not at booking. */
  | 'wire_transfer';

export type PaymentStatus = 'success' | 'failed' | 'pending';

export interface MockTransaction {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  isMock: true;
  timestamp: string;
}

export type InvoiceLineItemCategory =
  | 'room'
  | 'food_beverage'
  | 'transport'
  | 'add_on'
  | 'other';

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: InvoiceLineItemCategory;
  amount: number;
  postedAt: string;
}

export interface Invoice {
  id: string;
  bookingId: string;
  lineItems: InvoiceLineItem[];
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  isMock: true;
  issuedAt: string | null;
}

export interface RefundRecord {
  id: string;
  bookingId: string;
  amount: number;
  reason: string;
  isMock: true;
  timestamp: string;
}
