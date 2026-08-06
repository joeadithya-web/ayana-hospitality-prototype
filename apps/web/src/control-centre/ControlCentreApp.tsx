import { useEffect, useState } from 'react';
import { setActiveSource, useSimulationStore } from '@ayana/simulation-engine';
import type { FailureScenarioId } from '@ayana/shared-types';
import { Button, Card } from '@ayana/shared-ui';
import { formatDateTime } from '@ayana/shared-utils';
import { PasswordGate } from './PasswordGate';
import { DEMO_SCENARIOS, FAILURE_SCENARIOS } from './scenarios';
import { applyScenarioSideEffect } from './scenarioActions';

const SOURCE_LABEL: Record<string, string> = {
  traveller_app: 'Traveller',
  hotel_dashboard: 'Dashboard',
  kiosk: 'Kiosk',
  control_centre: 'Control Centre',
  system: 'System',
};

function ControlCentrePanel() {
  const activityLog = useSimulationStore((s) => s.activityLog);
  const activeFailureScenario = useSimulationStore((s) => s.activeFailureScenario);
  const setActiveFailureScenario = useSimulationStore((s) => s.setActiveFailureScenario);
  const resetDemo = useSimulationStore((s) => s.resetDemo);
  const staff = useSimulationStore((s) => s.staff);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [effectMessage, setEffectMessage] = useState<string | null>(null);

  function handleScenarioClick(scenarioId: FailureScenarioId, isActive: boolean) {
    if (isActive) {
      setActiveFailureScenario(null);
      setEffectMessage(null);
      return;
    }
    setActiveFailureScenario(scenarioId);
    const staffId = staff.find((s) => s.hotelId === 'htl_springs' && s.role === 'administrator')?.id ?? staff[0]?.id ?? 'system';
    const message = applyScenarioSideEffect(scenarioId, staffId);
    setEffectMessage(message);
  }

  useEffect(() => {
    setActiveSource('control_centre');
  }, []);

  const recentActivity = activityLog.slice(-60).reverse();

  return (
    <div className="min-h-screen bg-ink-950 px-6 py-8 text-cream-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold-400">AYANA</p>
            <h1 className="font-display text-2xl font-semibold">Simulation Control Centre</h1>
          </div>
          {!confirmingReset ? (
            <Button variant="danger" onClick={() => setConfirmingReset(true)}>
              Reset Demo
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-300">Wipes all live state back to the seed data. Are you sure?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  resetDemo();
                  setConfirmingReset(false);
                }}
              >
                Confirm Reset
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
            </div>
          )}
        </header>

        {activeFailureScenario && (
          <Card className="flex items-center justify-between border-red-400/40 bg-red-500/10">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-red-200">
                Active failure scenario: <strong>{activeFailureScenario.replaceAll('_', ' ')}</strong>
              </span>
              {effectMessage && <span className="text-xs text-red-200/70">{effectMessage}</span>}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="!border-white/20 !text-cream-50 hover:!bg-white/5"
              onClick={() => {
                setActiveFailureScenario(null);
                setEffectMessage(null);
              }}
            >
              Clear
            </Button>
          </Card>
        )}

        <section>
          <h2 className="mb-3 font-display text-base font-semibold">Failure Scenarios</h2>
          <div className="grid grid-cols-3 gap-3">
            {FAILURE_SCENARIOS.map((scenario) => {
              const active = activeFailureScenario === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario.id, active)}
                  className={`rounded-xl2 border p-3 text-left transition-colors ${
                    active ? 'border-gold-500 bg-gold-500/10' : 'border-white/10 bg-ink-900 hover:bg-white/5'
                  }`}
                >
                  <p className="text-sm font-medium">{scenario.label}</p>
                  <p className="mt-1 text-[11px] text-cream-50/50">{scenario.appliesTo}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold">Demo Scenarios</h2>
          <div className="grid grid-cols-3 gap-3">
            {DEMO_SCENARIOS.map((scenario) => (
              <Card key={scenario.id} className="!bg-ink-900 text-cream-50">
                <p className="text-sm font-medium">{scenario.label}</p>
                <p className="mt-1 text-[11px] text-cream-50/50">{scenario.presenterNote}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold">Live Activity Timeline</h2>
          <Card className="!bg-ink-900 max-h-96 overflow-y-auto text-cream-50">
            <div className="flex flex-col gap-1.5">
              {recentActivity.length === 0 && <p className="text-sm text-cream-50/40">No activity yet.</p>}
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b border-white/5 py-1.5 text-xs last:border-0">
                  <span className="text-cream-50/80">{entry.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-[10px] font-medium text-gold-300">
                      {SOURCE_LABEL[entry.source] ?? entry.source}
                    </span>
                    <span className="text-cream-50/30">{formatDateTime(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

export function ControlCentreApp() {
  return (
    <PasswordGate>
      <ControlCentrePanel />
    </PasswordGate>
  );
}
