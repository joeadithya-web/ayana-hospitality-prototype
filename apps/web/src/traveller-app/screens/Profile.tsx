import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Avatar, Badge, Card, PageHeader } from '@ayana/shared-ui';
import { useCurrentGuest } from '../hooks';
import { TravellerShell } from '../TravellerShell';

export function Profile() {
  const navigate = useNavigate();
  const guest = useCurrentGuest();
  const logout = useSimulationStore((s) => s.logout);

  if (!guest) return null;

  const links = [
    { label: 'AYANA Memory', icon: '🧠', to: '/traveller/memory' },
    { label: 'Documents & Expenses', icon: '📁', to: '/traveller/documents' },
    { label: 'Notifications', icon: '🔔', to: '/traveller/notifications' },
    { label: 'Support', icon: '💬', to: '/traveller/support' },
  ];

  return (
    <TravellerShell active="profile">
      <PageHeader title="Profile" />
      <div className="flex flex-col gap-5 px-5">
        <Card className="flex items-center gap-3">
          <Avatar name={guest.fullName} size={56} />
          <div>
            <p className="font-display text-lg font-semibold text-ink-950">{guest.fullName}</p>
            <p className="text-xs text-ink-700/50">{guest.email}</p>
            <p className="text-xs text-ink-700/50">{guest.mobile}</p>
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-700/50">Loyalty</p>
            <p className="font-medium text-ink-900">{guest.loyalty.points.toLocaleString('en-IN')} points</p>
          </div>
          <Badge tone="gold">{guest.loyalty.tier}</Badge>
        </Card>

        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.to)}
              className="flex items-center justify-between rounded-xl2 bg-white px-4 py-3.5 text-sm font-medium text-ink-900 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <span>{link.icon}</span>
                {link.label}
              </span>
              <span className="text-ink-700/30">→</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/traveller/splash');
          }}
          className="rounded-xl2 border border-red-200 px-4 py-3.5 text-sm font-medium text-red-600"
        >
          Log Out
        </button>
      </div>
    </TravellerShell>
  );
}
