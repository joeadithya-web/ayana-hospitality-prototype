import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setActiveSource, useSimulationStore } from '@ayana/simulation-engine';
import { Avatar, Card } from '@ayana/shared-ui';
import { useSelectedHotelId } from '../HotelContext';

const ROLE_LABEL: Record<string, string> = {
  front_office: 'Front Office',
  duty_manager: 'Duty Manager',
  housekeeping: 'Housekeeping',
  concierge: 'Concierge',
  bell_desk: 'Bell Desk',
  finance: 'Finance',
  administrator: 'Administrator',
};

export function RoleLogin() {
  const navigate = useNavigate();
  const hotels = useSimulationStore((s) => s.hotels);
  const staff = useSimulationStore((s) => s.staff);
  const loginStaff = useSimulationStore((s) => s.loginStaff);
  const { hotelId, setHotelId } = useSelectedHotelId();
  const [localHotelId, setLocalHotelId] = useState(hotelId);

  useEffect(() => {
    setActiveSource('hotel_dashboard');
  }, []);

  const hotelStaff = staff.filter((s) => s.hotelId === localHotelId);

  function handleSelect(staffId: string) {
    setHotelId(localHotelId);
    loginStaff(staffId);
    navigate('/dashboard/home');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 py-12">
      <div className="w-full max-w-md">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-gold-400">AYANA</p>
        <h1 className="mt-2 text-center font-display text-2xl font-semibold text-cream-50">Hotel Operations Dashboard</h1>
        <p className="mt-1 text-center text-sm text-cream-50/50">Sign in as staff to continue</p>

        <label className="mt-6 flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-cream-50/50">Property</span>
          <select
            className="rounded-lg border border-white/15 bg-ink-900 px-3 py-2.5 text-sm text-cream-50"
            value={localHotelId}
            onChange={(e) => setLocalHotelId(e.target.value)}
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 flex flex-col gap-2.5">
          {hotelStaff.map((member) => (
            <Card key={member.id} className="flex cursor-pointer items-center gap-3 !bg-white" onClick={() => handleSelect(member.id)}>
              <Avatar name={member.name} />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{member.name}</p>
                <p className="text-xs text-ink-700/50">{ROLE_LABEL[member.role]}</p>
              </div>
              <span className="text-ink-700/30">→</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
