import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';

export function RequireAuth({ children }: { children: ReactNode }) {
  const currentGuestId = useSimulationStore((s) => s.currentGuestId);
  if (!currentGuestId) return <Navigate to="/traveller/login" replace />;
  return <>{children}</>;
}
