import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { BottomNav } from '@ayana/shared-ui';
import { useCurrentCorporate } from './hooks';

export function TravellerShell({ active, children }: { active: 'home' | 'search' | 'trips' | 'profile'; children: ReactNode }) {
  const navigate = useNavigate();
  const corporate = useCurrentCorporate();
  const logoutCorporate = useSimulationStore((s) => s.logoutCorporate);

  return (
    <div className="min-h-screen bg-cream-50 pb-40">
      {corporate && (
        <div className="sticky top-0 z-30 flex items-center gap-2 bg-ink-950 px-5 py-2 text-cream-50">
          <span className="text-base leading-none">{corporate.logoEmoji}</span>
          <span className="flex-1 text-xs">
            Booking on <span className="font-semibold">{corporate.name}</span>
            <span className="text-cream-50/50"> · {corporate.negotiatedDiscountPercent}% contracted rate</span>
          </span>
          <button className="text-[11px] text-gold-400 underline" onClick={() => logoutCorporate()}>
            Exit
          </button>
        </div>
      )}

      <div className="mx-auto max-w-md">{children}</div>

      {/* Booking channels that aren't a single traveller booking a single room. Kept in the
          footer rather than the tab bar so the four core tabs stay uncrowded. */}
      <div className="fixed inset-x-0 bottom-[60px] z-40 border-t border-ink-900/10 bg-cream-50/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-2">
          <button
            onClick={() => navigate('/traveller/corporate')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-900/15 bg-white py-2 text-[11px] font-medium text-ink-800"
          >
            <span>🏢</span>
            {corporate ? 'Corporate Account' : 'Corporate Bookings'}
          </button>
          <button
            onClick={() => navigate('/traveller/group')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-900/15 bg-white py-2 text-[11px] font-medium text-ink-800"
          >
            <span>👥</span>
            Group Bookings
          </button>
        </div>
      </div>

      <BottomNav
        items={[
          { key: 'home', label: 'Home', icon: '🏠', active: active === 'home', onClick: () => navigate('/traveller/dashboard') },
          { key: 'search', label: 'Search', icon: '🔍', active: active === 'search', onClick: () => navigate('/traveller/search') },
          { key: 'trips', label: 'My Trips', icon: '🧳', active: active === 'trips', onClick: () => navigate('/traveller/trips') },
          { key: 'profile', label: 'Profile', icon: '👤', active: active === 'profile', onClick: () => navigate('/traveller/profile') },
        ]}
      />
    </div>
  );
}
