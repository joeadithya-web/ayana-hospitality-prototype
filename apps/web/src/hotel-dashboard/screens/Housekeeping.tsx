import { useSimulationStore } from '@ayana/simulation-engine';
import type { RoomStatus } from '@ayana/shared-types';
import { Badge, Button, Card } from '@ayana/shared-ui';
import { formatDateTime } from '@ayana/shared-utils';
import { useHotelHousekeepingTasks, useHotelRooms } from '../hooks';

const STATUSES: { key: RoomStatus; label: string; tone: 'success' | 'neutral' | 'warning' | 'danger' }[] = [
  { key: 'ready', label: 'Ready', tone: 'success' },
  { key: 'occupied', label: 'Occupied', tone: 'neutral' },
  { key: 'dirty', label: 'Dirty', tone: 'warning' },
  { key: 'cleaning', label: 'Cleaning', tone: 'warning' },
  { key: 'out_of_service', label: 'Out of Service', tone: 'danger' },
  { key: 'maintenance', label: 'Maintenance', tone: 'danger' },
];

export function Housekeeping() {
  const rooms = useHotelRooms();
  const tasks = useHotelHousekeepingTasks();
  const setRoomStatus = useSimulationStore((s) => s.setRoomStatus);
  const updateHousekeepingTask = useSimulationStore((s) => s.updateHousekeepingTask);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-6 gap-3">
        {STATUSES.map((status) => {
          const roomsInStatus = rooms.filter((r) => r.status === status.key);
          return (
            <Card key={status.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Badge tone={status.tone}>{status.label}</Badge>
                <span className="text-xs text-ink-700/40">{roomsInStatus.length}</span>
              </div>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {roomsInStatus.map((room) => (
                  <select
                    key={room.id}
                    value={room.status}
                    onChange={(e) => setRoomStatus(room.id, e.target.value as RoomStatus)}
                    className="rounded border border-ink-900/10 bg-white px-1.5 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {room.roomNumber} → {s.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Housekeeping Requests</h2>
        {tasks.length === 0 ? (
          <Card className="text-sm text-ink-700/50">No housekeeping requests right now.</Card>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks
              .slice()
              .reverse()
              .map((task) => {
                const room = rooms.find((r) => r.id === task.roomId);
                return (
                  <Card key={task.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink-900">Room {room?.roomNumber ?? task.roomId}</p>
                      <p className="text-xs text-ink-700/50">Requested {formatDateTime(task.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'neutral'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.status === 'pending' && (
                        <Button size="sm" variant="ghost" onClick={() => updateHousekeepingTask(task.id, 'in_progress')}>
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            updateHousekeepingTask(task.id, 'done');
                            if (room) setRoomStatus(room.id, 'ready');
                          }}
                        >
                          Mark Done
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
