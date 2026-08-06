import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Badge, Card, EmptyState, PageHeader } from '@ayana/shared-ui';
import { formatDateTime } from '@ayana/shared-utils';
import { useCurrentGuest } from '../hooks';

const CHANNEL_ICON: Record<string, string> = { push: '📱', sms: '💬', email: '✉️', in_app: '🔔' };

export function Notifications() {
  const navigate = useNavigate();
  const guest = useCurrentGuest();
  const notifications = useSimulationStore((s) => s.notifications);

  if (!guest) return null;
  const mine = notifications
    .filter((n) => n.guestId === guest.id)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Notifications" onBack={() => navigate(-1)} />
        <div className="flex flex-col gap-3 px-5">
          {mine.length === 0 && (
            <EmptyState icon="🔔" title="No notifications yet" description="Booking, payment, and stay updates (all simulated) will appear here." />
          )}
          {mine.map((n) => (
            <Card key={n.id} className="flex items-start gap-3">
              <span className="text-lg">{CHANNEL_ICON[n.channel]}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{n.title}</p>
                <p className="text-xs text-ink-700/60">{n.body}</p>
                <p className="mt-1 text-[11px] text-ink-700/30">{formatDateTime(n.sentAt)}</p>
              </div>
              {!n.read && <Badge tone="gold">New</Badge>}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
