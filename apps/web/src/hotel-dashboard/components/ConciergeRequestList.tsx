import { useSimulationStore } from '@ayana/simulation-engine';
import type { ConciergeRequestStatus, ConciergeRequestType } from '@ayana/shared-types';
import { Badge, Button, Card, EmptyState } from '@ayana/shared-ui';
import { formatDateTime } from '@ayana/shared-utils';
import { useHotelConciergeRequests } from '../hooks';

const NEXT_STATUS: Record<ConciergeRequestStatus, ConciergeRequestStatus | null> = {
  requested: 'confirmed',
  confirmed: 'in_progress',
  in_progress: 'completed',
  completed: null,
  cancelled: null,
};

const STATUS_TONE: Record<ConciergeRequestStatus, 'neutral' | 'gold' | 'warning' | 'success' | 'danger'> = {
  requested: 'neutral',
  confirmed: 'gold',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export function ConciergeRequestList({ types, emptyLabel }: { types: ConciergeRequestType[]; emptyLabel: string }) {
  const allRequests = useHotelConciergeRequests();
  const guests = useSimulationStore((s) => s.guests);
  const updateConciergeStatus = useSimulationStore((s) => s.updateConciergeStatus);
  const guestById = new Map(guests.map((g) => [g.id, g]));

  const requests = allRequests.filter((r) => types.includes(r.type)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (requests.length === 0) {
    return <EmptyState icon="🧭" title="Nothing here yet" description={emptyLabel} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {requests.map((r) => {
        const guest = guestById.get(r.guestId);
        const next = NEXT_STATUS[r.status];
        return (
          <Card key={r.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900 capitalize">{r.type.replace(/_/g, ' ')}</p>
              <p className="text-xs text-ink-700/60">{guest?.fullName} · {r.details}</p>
              <p className="text-[11px] text-ink-700/30">{formatDateTime(r.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge>
              {next && (
                <Button size="sm" variant="ghost" onClick={() => updateConciergeStatus(r.id, next)}>
                  Mark {next.replace('_', ' ')}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
