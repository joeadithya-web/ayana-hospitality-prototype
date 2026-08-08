import type { ConciergeRequestType } from './concierge';
import type { InvoiceLineItemCategory } from './payment';

/** Groups the bookable in-stay services shown in both the Traveller App and the Kiosk. */
export type ServiceKind = 'restaurant' | 'spa' | 'transport' | 'add_on';

/**
 * One bookable service. The same catalog drives the app and the kiosk so a spa slot
 * booked at either surface lands on the same folio and shows up in both.
 */
export interface ServiceCatalogItem {
  id: string;
  kind: ServiceKind;
  label: string;
  description: string;
  /** Indicative price in INR; 0 means the charge is settled elsewhere (e.g. pay the driver). */
  price: number;
  icon: string;
  /** How the charge is filed on the folio. */
  chargeCategory: InvoiceLineItemCategory;
  /** How the request reaches the hotel team. */
  requestType: ConciergeRequestType;
}

/**
 * What a guest would get back if they cancelled right now. Quoted from the hotel's
 * published policy — always shown before the guest confirms, never applied silently.
 */
export interface CancellationQuote {
  /** Whole days between now and check-in; negative once the stay has started. */
  daysToCheckIn: number;
  refundPercent: 0 | 25 | 50 | 100;
  refundAmount: number;
  /** Plain-language reason shown to the guest, e.g. "Cancelled 3 days ahead". */
  policyLabel: string;
  /** False once the stay has started — an in-house guest checks out early instead. */
  cancellable: boolean;
}
