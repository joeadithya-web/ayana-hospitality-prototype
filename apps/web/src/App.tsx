import { Navigate, Route, Routes } from 'react-router-dom';
import { TravellerRouter } from './traveller-app/TravellerRouter';
import { DashboardRouter } from './hotel-dashboard/DashboardRouter';
import { KioskApp } from './kiosk/KioskApp';
import { ControlCentreApp } from './control-centre/ControlCentreApp';
import { DemoSwitcher } from './DemoSwitcher';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/traveller" replace />} />
        <Route path="/traveller/*" element={<TravellerRouter />} />
        <Route path="/dashboard/*" element={<DashboardRouter />} />
        <Route path="/kiosk/*" element={<KioskApp />} />
        <Route path="/control/*" element={<ControlCentreApp />} />
        <Route path="*" element={<Navigate to="/traveller" replace />} />
      </Routes>
      <DemoSwitcher />
    </>
  );
}
