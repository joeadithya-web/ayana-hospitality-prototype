import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { setActiveSource, useSimulationStore } from '@ayana/simulation-engine';
import { RequireAuth } from './RequireAuth';
import { Splash } from './screens/Splash';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { Search } from './screens/Search';
import { HotelDetails } from './screens/HotelDetails';
import { RoomSelection } from './screens/RoomSelection';
import { Booking } from './screens/Booking';
import { Payment } from './screens/Payment';
import { ReadyToRoom } from './screens/ReadyToRoom';
import { MyTrips } from './screens/MyTrips';
import { Stay } from './screens/Stay';
import { Concierge } from './screens/Concierge';
import { Checkout } from './screens/Checkout';
import { Profile } from './screens/Profile';
import { AyanaMemoryScreen } from './screens/AyanaMemoryScreen';
import { Notifications } from './screens/Notifications';
import { Support } from './screens/Support';

function IndexRedirect() {
  const currentGuestId = useSimulationStore((s) => s.currentGuestId);
  return <Navigate to={currentGuestId ? '/traveller/dashboard' : '/traveller/splash'} replace />;
}

export function TravellerRouter() {
  useEffect(() => {
    setActiveSource('traveller_app');
  }, []);

  return (
    <Routes>
      <Route index element={<IndexRedirect />} />
      <Route path="splash" element={<Splash />} />
      <Route path="login" element={<Login />} />
      <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="search" element={<RequireAuth><Search /></RequireAuth>} />
      <Route path="hotel/:hotelId" element={<RequireAuth><HotelDetails /></RequireAuth>} />
      <Route path="hotel/:hotelId/rooms" element={<RequireAuth><RoomSelection /></RequireAuth>} />
      <Route path="book/:hotelId/:category/:view/:bedType" element={<RequireAuth><Booking /></RequireAuth>} />
      <Route path="payment/:bookingId" element={<RequireAuth><Payment /></RequireAuth>} />
      <Route path="ready/:bookingId" element={<RequireAuth><ReadyToRoom /></RequireAuth>} />
      <Route path="trips" element={<RequireAuth><MyTrips /></RequireAuth>} />
      <Route path="stay/:bookingId" element={<RequireAuth><Stay /></RequireAuth>} />
      <Route path="concierge/:bookingId" element={<RequireAuth><Concierge /></RequireAuth>} />
      <Route path="checkout/:bookingId" element={<RequireAuth><Checkout /></RequireAuth>} />
      <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="memory" element={<RequireAuth><AyanaMemoryScreen /></RequireAuth>} />
      <Route path="notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="support" element={<RequireAuth><Support /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/traveller" replace />} />
    </Routes>
  );
}
