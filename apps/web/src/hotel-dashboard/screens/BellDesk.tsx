import { ConciergeRequestList } from '../components/ConciergeRequestList';

export function BellDesk() {
  return (
    <ConciergeRequestList
      types={['baggage_pickup', 'baggage_delivery', 'luggage_storage', 'vip_arrival_assistance']}
      emptyLabel="Baggage and VIP arrival requests will appear here."
    />
  );
}
