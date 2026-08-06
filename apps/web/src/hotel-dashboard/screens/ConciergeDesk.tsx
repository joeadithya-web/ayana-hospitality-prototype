import { ConciergeRequestList } from '../components/ConciergeRequestList';

export function ConciergeDesk() {
  return (
    <ConciergeRequestList
      types={['airport_pickup', 'taxi', 'restaurant_booking', 'local_recommendation', 'wake_up_call', 'special_request']}
      emptyLabel="Guest concierge requests from the Traveller App will appear here."
    />
  );
}
