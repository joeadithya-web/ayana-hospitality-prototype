import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';

export function RequireStaffAuth({ children }: { children: ReactNode }) {
  const currentStaffId = useSimulationStore((s) => s.currentStaffId);
  if (!currentStaffId) return <Navigate to="/dashboard/login" replace />;
  return <>{children}</>;
}
