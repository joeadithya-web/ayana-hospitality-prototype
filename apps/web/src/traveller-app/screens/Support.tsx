import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Badge, Card, PageHeader } from '@ayana/shared-ui';

const FAQS = [
  { q: 'How does Ready-to-Room work?', a: 'AYANA confirms your identity, payment, and room readiness before you leave for the hotel, so you can go straight to your room.' },
  { q: 'Can I change my payment method?', a: 'Yes — update your preferred payment method anytime in AYANA Memory.' },
  { q: 'Is my data shared with every hotel?', a: 'No. Hotels only see what you approve for your specific stay, controlled from AYANA Memory.' },
];

export function Support() {
  const navigate = useNavigate();
  const compliance = useSimulationStore((s) => s.compliance);

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Support" onBack={() => navigate(-1)} />
        <div className="flex flex-col gap-5 px-5">
          <Card className="bg-ink-950 text-cream-50">
            <p className="font-display text-base font-semibold">Need help now?</p>
            <p className="mt-1 text-sm text-cream-50/70">Emergency &amp; assistance line (simulated): +91 80-4000-1234</p>
          </Card>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Frequently Asked</h2>
            <div className="flex flex-col gap-2">
              {FAQS.map((f) => (
                <Card key={f.q}>
                  <p className="text-sm font-medium text-ink-900">{f.q}</p>
                  <p className="mt-1 text-xs text-ink-700/60">{f.a}</p>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Compliance &amp; Trust</h2>
            <Card className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="success">Encrypted</Badge>
                <Badge tone="springs">Consent-based</Badge>
              </div>
              <p className="text-xs text-ink-700/60">{compliance.retentionPolicySummary}</p>
              <p className="text-[11px] text-ink-700/40">
                Identity verification uses government ID verification with your consent — never shared beyond what a
                stay requires.
              </p>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
