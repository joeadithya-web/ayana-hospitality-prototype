import { Navigate, Route, Routes } from 'react-router-dom';
import { HotelProvider } from './HotelContext';
import { RequireStaffAuth } from './RequireStaffAuth';
import { DashboardShell } from './DashboardShell';
import { RoleLogin } from './screens/RoleLogin';
import { Home } from './screens/Home';
import { FrontOffice } from './screens/FrontOffice';
import { Housekeeping } from './screens/Housekeeping';
import { ConciergeDesk } from './screens/ConciergeDesk';
import { BellDesk } from './screens/BellDesk';
import { Finance } from './screens/Finance';
import { RoomManagement } from './screens/RoomManagement';
import { Reports } from './screens/Reports';

export function DashboardRouter() {
  return (
    <HotelProvider defaultHotelId="htl_springs">
      <Routes>
        <Route path="login" element={<RoleLogin />} />
        <Route
          path="home"
          element={
            <RequireStaffAuth>
              <DashboardShell active="home">
                <Home />
              </DashboardShell>
            </RequireStaffAuth>
          }
        />
        <Route
          path="front_office"
          element={
            <RequireStaffAuth>
              <DashboardShell active="front_office">
                <FrontOffice />
              </DashboardShell>
            </RequireStaffAuth>
          }
        />
        <Route
          path="housekeeping"
          element={
            <RequireStaffAuth>
              <DashboardShell active="housekeeping">
                <Housekeeping />
              </DashboardShell>
            </RequireStaffAuth>
          }
        />
        <Route
          path="concierge"
          element={
            <RequireStaffAuth>
              <DashboardShell active="concierge">
                <ConciergeDesk />
              </DashboardShell>
            </RequireStaffAuth>
          }
        />
        <Route
          path="bell_desk"
          element={
            <RequireStaffAuth>
              <DashboardShell active="bell_desk">
                <BellDesk />
              </DashboardShell>
            </RequireStaffAuth>
          }
        />
        <Route
          path="finance"
          element={
            <RequireStaffAuth>
              <DashboardShell active="finance">
                <Finance />
              </DashboardShell>
            </RequireStaffAuth>
          }
        />
        <Route
          path="rooms"
          element={
            <RequireStaffAuth>
              <DashboardShell active="rooms">
                <RoomManagement />
              </DashboardShell>
            </RequireStaffAuth>
          }
        />
        <Route
          path="reports"
          element={
            <RequireStaffAuth>
              <DashboardShell active="reports">
                <Reports />
              </DashboardShell>
            </RequireStaffAuth>
          }
        />
        <Route index element={<Navigate to="home" replace />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </HotelProvider>
  );
}
