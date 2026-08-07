export type RoomView =
  | 'city'
  | 'garden'
  | 'pool'
  | 'front_facing'
  | 'business_district';

export type RoomCategory =
  | 'standard'
  | 'deluxe'
  | 'executive'
  | 'suite'
  | 'presidential';

export type RoomStatus =
  | 'ready'
  | 'occupied'
  | 'dirty'
  | 'cleaning'
  | 'out_of_service'
  | 'maintenance';

/** Sold at booking time alongside category and view. */
export type BedType = 'twin' | 'double' | 'king';

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  floor: number;
  section: string;
  category: RoomCategory;
  view: RoomView;
  bedType: BedType;
  smoking: boolean;
  maxOccupancy: number;
  basePrice: number;
  upgradePrice: number;
  status: RoomStatus;
  /** 0-100 deterministic AI fit score for the guest being evaluated, not an intrinsic room property */
  aiScore: number;
}
