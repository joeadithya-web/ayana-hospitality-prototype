import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Avatar, Badge } from '@ayana/shared-ui';
import { useCurrentStaff } from './hooks';
import { useSelectedHotelId } from './HotelContext';
import { NAV_LABELS, navForRole, type NavKey } from './permissions';

const ROLE_LABEL: Record<string, string> = {
  front_office: 'Front Office',
  duty_manager: 'Duty Manager',
  housekeeping: 'Housekeeping',
  concierge: 'Concierge',
  bell_desk: 'Bell Desk',
  finance: 'Finance',
  administrator: 'Administrator',
};

export function DashboardShell({ active, children }: { active: NavKey; children: ReactNode }) {
  const navigate = useNavigate();
  const staff = useCurrentStaff();
  const hotels = useSimulationStore((s) => s.hotels);
  const logoutStaff = useSimulationStore((s) => s.logoutStaff);
  const { hotelId, setHotelId } = useSelectedHotelId();

  if (!staff) return null;
  const nav = navForRole(staff.role);

  return (
    <div className="flex min-h-screen bg-cream-100">
      <aside className="flex w-60 flex-none flex-col border-r border-ink-900/10 bg-ink-950 text-cream-50">
        <div className="px-5 py-6">
          <p className="font-display text-lg font-semibold">AYANA</p>
          <p className="text-[10px] uppercase tracking-widest text-gold-400">Operations Dashboard</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map((key) => (
            <button
              key={key}
              onClick={() => navigate(key === 'home' ? '/dashboard/home' : `/dashboard/${key}`)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                active === key ? 'bg-gold-500 text-ink-950' : 'text-cream-50/70 hover:bg-white/5'
              }`}
            >
              <span>{NAV_LABELS[key].icon}</span>
              {NAV_LABELS[key].label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Avatar name={staff.name} size={32} />
            <div>
              <p className="text-sm font-medium">{staff.name}</p>
              <p className="text-[11px] text-cream-50/50">{ROLE_LABEL[staff.role]}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logoutStaff();
              navigate('/dashboard/login');
            }}
            className="mt-3 text-xs text-cream-50/40 underline"
          >
            Switch staff
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink-900/10 bg-white px-8 py-4">
          <h1 className="font-display text-lg font-semibold text-ink-950">{NAV_LABELS[active].label}</h1>
          <div className="flex items-center gap-3">
            <Badge tone="neutral">Simulated PMS</Badge>
            <select
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="rounded-lg border border-ink-900/15 px-3 py-1.5 text-sm"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
