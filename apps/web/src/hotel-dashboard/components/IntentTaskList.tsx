import { useSimulationStore } from '@ayana/simulation-engine';
import type { StaffRole } from '@ayana/shared-types';
import { intentTemplateById } from '@ayana/ai-engine';
import { Badge, Button, Card, EmptyState } from '@ayana/shared-ui';
import { formatDateTime } from '@ayana/shared-utils';
import { useHotelIntentTasks } from '../hooks';

/** Hotel-side view of the Intent Engine's department-routed checklist items — the live
 * counterpart to a guest's Today's Mission on the Traveller App's Stay screen. */
export function IntentTaskList({ departments }: { departments: StaffRole[] }) {
  const allTasks = useHotelIntentTasks();
  const updateIntentTask = useSimulationStore((s) => s.updateIntentTask);
  const guests = useSimulationStore((s) => s.guests);
  const guestById = new Map(guests.map((g) => [g.id, g]));

  const tasks = allTasks
    .filter((t) => departments.includes(t.department))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (tasks.length === 0) {
    return <EmptyState icon="🎯" title="No journey tasks yet" description="Intent Engine tasks from guest bookings will appear here." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => {
        const guest = guestById.get(t.guestId);
        return (
          <Card key={t.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900">{t.label}</p>
              <p className="text-xs text-ink-700/60">
                {guest?.fullName} · {intentTemplateById(t.templateId)?.label ?? 'Journey'}
              </p>
              <p className="text-[11px] text-ink-700/30">{formatDateTime(t.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={t.status === 'done' ? 'success' : 'neutral'}>{t.status}</Badge>
              {t.status === 'pending' && (
                <Button size="sm" variant="ghost" onClick={() => updateIntentTask(t.id, 'done')}>
                  Mark done
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
