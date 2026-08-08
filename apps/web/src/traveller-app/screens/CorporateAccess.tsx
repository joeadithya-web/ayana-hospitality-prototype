import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';
import { useCurrentCorporate } from '../hooks';

/**
 * Corporate entry point. Signing in switches the whole app into corporate mode: contracted
 * rates replace published ones and, where the agreement's banking details are established,
 * wire transfer becomes a settlement option instead of paying by card at booking.
 *
 * Demo accounts are picked from a list rather than typed — this prototype never collects
 * real company credentials.
 */
export function CorporateAccess() {
  const navigate = useNavigate();
  const corporates = useSimulationStore((s) => s.corporates);
  const loginCorporate = useSimulationStore((s) => s.loginCorporate);
  const logoutCorporate = useSimulationStore((s) => s.logoutCorporate);
  const bookings = useSimulationStore((s) => s.bookings);
  const active = useCurrentCorporate();

  const onAccount = active ? bookings.filter((b) => b.corporateId === active.id) : [];
  const unsettled = onAccount
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + Math.max(0, b.totalAmount - b.amountPaid), 0);

  if (active) {
    return (
      <div className="min-h-screen bg-cream-50 pb-10">
        <div className="mx-auto max-w-md">
          <PageHeader title="Corporate Account" subtitle={active.name} onBack={() => navigate('/traveller/dashboard')} />

          <div className="flex flex-col gap-4 px-5">
            <Card className="bg-ink-950 text-cream-50">
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">{active.logoEmoji}</span>
                <div className="flex-1">
                  <p className="font-display text-lg font-semibold">{active.name}</p>
                  <p className="text-xs text-cream-50/50">{active.industry}</p>
                  <p className="mt-1 text-[11px] text-gold-400">{active.code}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-xs">
                <div>
                  <p className="text-cream-50/50">Contracted rate</p>
                  <p className="font-display text-lg font-semibold text-gold-400">−{active.negotiatedDiscountPercent}%</p>
                </div>
                <div>
                  <p className="text-cream-50/50">Settlement</p>
                  <p className="font-display text-lg font-semibold">{active.settlementTerms}</p>
                </div>
              </div>
            </Card>

            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">Agreement</p>
              <Row label="Contract" value={active.contractRef} />
              <Row label="Billing" value={active.billingEmail} />
              <Row label="Credit limit" value={formatINR(active.creditLimitINR)} />
              <Row label="Unsettled" value={formatINR(unsettled)} />
              <div className="mt-2 border-t border-ink-900/10 pt-2">
                {active.wireTransferEnabled ? (
                  <Badge tone="success">Wire transfer enabled — banking details on file</Badge>
                ) : (
                  <Badge tone="warning">Wire transfer pending — banking details still being verified</Badge>
                )}
              </div>
            </Card>

            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">
                Bookings on this account ({onAccount.length})
              </p>
              {onAccount.length === 0 ? (
                <p className="text-sm text-ink-700/50">
                  Nothing booked yet. Any room you book while signed in bills to {active.name}.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {onAccount.slice(0, 6).map((b) => (
                    <div key={b.id} className="flex justify-between text-xs">
                      <span className="capitalize text-ink-700/70">
                        {b.roomCategory}
                        {b.groupRef ? ' · group' : ''}
                      </span>
                      <span className="font-medium text-ink-900">{formatINR(b.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={() => navigate('/traveller/search')}>
                Book a Room on This Account
              </Button>
              <Button fullWidth variant="secondary" onClick={() => navigate('/traveller/group')}>
                Start a Group Booking
              </Button>
              <Button
                fullWidth
                variant="ghost"
                onClick={() => {
                  logoutCorporate();
                  navigate('/traveller/dashboard');
                }}
              >
                Exit Corporate Mode
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Corporate Bookings" onBack={() => navigate('/traveller/dashboard')} />

        <div className="flex flex-col gap-4 px-5">
          <Card className="bg-ink-950 text-cream-50">
            <p className="font-display text-base font-semibold">Book on your company’s agreement</p>
            <p className="mt-1 text-xs text-cream-50/60">
              Sign in with your company account to get contracted rates, consolidated billing and — where your
              agreement allows — settlement by wire transfer instead of paying at booking.
            </p>
          </Card>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-700/50">Demo corporate accounts</p>
            <div className="flex flex-col gap-2">
              {corporates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    loginCorporate(c.id);
                    navigate('/traveller/corporate');
                  }}
                  className="flex items-center gap-3 rounded-xl2 border border-ink-900/10 bg-white px-4 py-3.5 text-left shadow-sm"
                >
                  <span className="text-2xl leading-none">{c.logoEmoji}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink-900">{c.name}</span>
                    <span className="block text-xs text-ink-700/50">
                      {c.code} · {c.negotiatedDiscountPercent}% contracted rate
                    </span>
                  </span>
                  <span className="text-ink-700/30">→</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-700/40">
              Demo accounts — no company credentials are collected in this prototype.
            </p>
          </div>

          <Card>
            <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">What changes in corporate mode</p>
            <ul className="flex flex-col gap-1.5 text-xs text-ink-700/70">
              <li>• Contracted rates replace published rates on every room</li>
              <li>• Wire transfer settlement on your agreed billing cycle</li>
              <li>• Group bookings for teams travelling together</li>
              <li>• All stays consolidated under one company account</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-xs">
      <span className="text-ink-700/60">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}
