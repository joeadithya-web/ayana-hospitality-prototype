import type { StaffRole } from '@ayana/shared-types';

export type NavKey = 'home' | 'front_office' | 'housekeeping' | 'concierge' | 'bell_desk' | 'finance' | 'rooms' | 'reports';

const ROLE_NAV: Record<StaffRole, NavKey[]> = {
  front_office: ['home', 'front_office', 'rooms'],
  duty_manager: ['home', 'front_office', 'housekeeping', 'concierge', 'bell_desk', 'finance', 'rooms', 'reports'],
  housekeeping: ['home', 'housekeeping', 'rooms'],
  concierge: ['home', 'concierge'],
  bell_desk: ['home', 'bell_desk'],
  finance: ['home', 'finance', 'reports'],
  administrator: ['home', 'front_office', 'housekeeping', 'concierge', 'bell_desk', 'finance', 'rooms', 'reports'],
};

export function navForRole(role: StaffRole): NavKey[] {
  return ROLE_NAV[role];
}

export const NAV_LABELS: Record<NavKey, { label: string; icon: string }> = {
  home: { label: 'Dashboard', icon: '🏨' },
  front_office: { label: 'Front Office', icon: '🛎️' },
  housekeeping: { label: 'Housekeeping', icon: '🧹' },
  concierge: { label: 'Concierge', icon: '🧭' },
  bell_desk: { label: 'Bell Desk', icon: '🧳' },
  finance: { label: 'Finance', icon: '💰' },
  rooms: { label: 'Room Management', icon: '🗂️' },
  reports: { label: 'Reports', icon: '📊' },
};
