import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@ayana/shared-ui';

export function TravellerShell({ active, children }: { active: 'home' | 'search' | 'trips' | 'profile'; children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      <div className="mx-auto max-w-md">{children}</div>
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
