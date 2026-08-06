import { useMemo, useState } from 'react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { generateOperationsAlerts } from '@ayana/ai-engine';
import { Badge, Card } from '@ayana/shared-ui';
import { useCurrentStaff, useHotelBookings, useHotelRooms } from '../hooks';
import { useSelectedHotelId } from '../HotelContext';

const STATUS_DOT: Record<string, string> = {
  ready: 'bg-springs-500',
  occupied: 'bg-ink-900/40',
  dirty: 'bg-amber-500',
  cleaning: 'bg-amber-500',
  out_of_service: 'bg-red-500',
  maintenance: 'bg-red-500',
};

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function RoomManagement() {
  const { hotelId } = useSelectedHotelId();
  const staff = useCurrentStaff();
  const rooms = useHotelRooms();
  const bookings = useHotelBookings();
  const guests = useSimulationStore((s) => s.guests);
  const assignRoom = useSimulationStore((s) => s.assignRoom);
  const [dragOverRoom, setDragOverRoom] = useState<string | null>(null);

  const guestById = new Map(guests.map((g) => [g.id, g]));
  const arrivalsToday = bookings.filter((b) => isToday(b.checkInDate) && (b.status === 'confirmed' || b.status === 'pending_payment'));
  const alerts = useMemo(() => generateOperationsAlerts(bookings, guests, rooms).filter((a) => a.hotelId === hotelId), [bookings, guests, rooms, hotelId]);

  if (!staff) return null;

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 flex flex-col gap-4">
        <Card>
          <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Today's Arrivals — drag onto a room</h2>
          <div className="flex flex-wrap gap-2">
            {arrivalsToday.length === 0 && <p className="text-sm text-ink-700/50">No arrivals today.</p>}
            {arrivalsToday.map((b) => (
              <div
                key={b.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', b.id)}
                className="cursor-grab rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-700 active:cursor-grabbing"
              >
                {guestById.get(b.guestId)?.fullName}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-base font-semibold text-ink-950">Room Inventory</h2>
          <div className="grid grid-cols-6 gap-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverRoom(room.id);
                }}
                onDragLeave={() => setDragOverRoom(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const bookingId = e.dataTransfer.getData('text/plain');
                  if (bookingId && staff) assignRoom(bookingId, room.id, staff.id, 'Drag-and-drop reassignment');
                  setDragOverRoom(null);
                }}
                className={`flex flex-col gap-0.5 rounded-lg border px-2 py-1.5 text-[11px] ${
                  dragOverRoom === room.id ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/10 bg-white'
                }`}
                title={`AI score ${room.aiScore}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink-900">{room.roomNumber}</span>
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[room.status]}`} />
                </div>
                <span className="text-ink-700/40 capitalize">{room.category}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="mb-2 font-display text-base font-semibold text-ink-950">AI Operations Panel</h2>
          <div className="flex flex-col gap-2">
            {alerts.length === 0 && <p className="text-sm text-ink-700/50">No recommendations right now.</p>}
            {alerts.map((a) => (
              <div key={a.id} className="rounded-lg bg-ink-900/5 px-3 py-2 text-xs text-ink-700/80">
                {a.message}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Legend</h2>
          <div className="flex flex-col gap-1.5 text-xs text-ink-700/60">
            {Object.entries(STATUS_DOT).map(([status, dot]) => (
              <div key={status} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="capitalize">{status.replaceAll('_', ' ')}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
