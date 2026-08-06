import type { Hotel, StaffRole, StaffUser } from '@ayana/shared-types';
import { makeId } from '@ayana/shared-utils';

const ROLES: StaffRole[] = ['front_office', 'duty_manager', 'housekeeping', 'concierge', 'bell_desk', 'finance', 'administrator'];

const ROLE_NAMES: Record<StaffRole, string[]> = {
  front_office: ['Ananya Kulkarni', 'Rohit Bhatia'],
  duty_manager: ['Suresh Pillai'],
  housekeeping: ['Lakshmi Devi', 'Manoj Kumar'],
  concierge: ['Farah Sheikh'],
  bell_desk: ['Ismail Sait'],
  finance: ['Deepa Ramachandran'],
  administrator: ['Ravi Shankar'],
};

let nameCursor: Record<StaffRole, number> = {
  front_office: 0,
  duty_manager: 0,
  housekeeping: 0,
  concierge: 0,
  bell_desk: 0,
  finance: 0,
  administrator: 0,
};

function nextName(role: StaffRole): string {
  const pool = ROLE_NAMES[role];
  const name = pool[nameCursor[role] % pool.length]!;
  nameCursor[role] += 1;
  return name;
}

export function generateStaff(hotels: Hotel[]): StaffUser[] {
  nameCursor = { front_office: 0, duty_manager: 0, housekeeping: 0, concierge: 0, bell_desk: 0, finance: 0, administrator: 0 };
  return hotels.flatMap((hotel) =>
    ROLES.map((role) => ({
      id: makeId('staff'),
      name: nextName(role),
      role,
      hotelId: hotel.id,
    })),
  );
}
