/**
 * A company with a signed AYANA corporate agreement. Employees book against it instead
 * of paying personally: rates come from the contract and settlement happens by wire
 * transfer on the agreed billing cycle rather than a card at booking time.
 */
export interface CorporateAccount {
  id: string;
  name: string;
  /** Short code employees recognise from their travel desk, e.g. "MERIDIAN-TECH". */
  code: string;
  industry: string;
  logoEmoji: string;
  /** Reference of the signed agreement — shown wherever contract terms are relied on. */
  contractRef: string;
  /** Negotiated discount off published rates, applied to every booking on this account. */
  negotiatedDiscountPercent: number;
  /** Wire transfer is only offered once banking details are established under the contract. */
  wireTransferEnabled: boolean;
  /** Simulated ceiling on unsettled wire-transfer bookings. */
  creditLimitINR: number;
  billingEmail: string;
  /** Payment terms from the contract, e.g. "Net 30". */
  settlementTerms: string;
}

/** Group bookings are for parties too large for a single room. */
export const GROUP_BOOKING_MIN_GUESTS = 7;
