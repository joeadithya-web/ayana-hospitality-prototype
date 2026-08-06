import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Badge, Card, PageHeader } from '@ayana/shared-ui';
import { useCurrentGuest } from '../hooks';

export function AyanaMemoryScreen() {
  const navigate = useNavigate();
  const guest = useCurrentGuest();
  const updateMemory = useSimulationStore((s) => s.updateMemory);

  if (!guest) return null;
  const memory = guest.memory;

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="AYANA Memory™" subtitle="Your preferences, remembered everywhere" onBack={() => navigate(-1)} />

        <div className="flex flex-col gap-4 px-5">
          <Badge tone="springs">Changes apply instantly to your next room recommendation</Badge>

          <Field label="Dietary Preference">
            <select className="input" value={memory.dietaryPreference} onChange={(e) => updateMemory(guest.id, { dietaryPreference: e.target.value as typeof memory.dietaryPreference })}>
              {['vegetarian', 'non_vegetarian', 'vegan', 'jain', 'no_preference'].map((v) => (
                <option key={v} value={v}>{v.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>

          <Field label="Smoking Preference">
            <select className="input" value={memory.smokingPreference} onChange={(e) => updateMemory(guest.id, { smokingPreference: e.target.value as typeof memory.smokingPreference })}>
              <option value="non_smoking">Non-smoking</option>
              <option value="smoking">Smoking</option>
            </select>
          </Field>

          <Field label="Preferred View">
            <select
              className="input"
              value={memory.preferredView ?? ''}
              onChange={(e) => updateMemory(guest.id, { preferredView: (e.target.value || null) as typeof memory.preferredView })}
            >
              <option value="">No preference</option>
              {['city', 'garden', 'pool', 'front_facing', 'business_district'].map((v) => (
                <option key={v} value={v}>{v.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>

          <Field label="Preferred Floor">
            <input
              type="number"
              className="input"
              min={1}
              max={6}
              value={memory.preferredFloor ?? ''}
              onChange={(e) => updateMemory(guest.id, { preferredFloor: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>

          <Field label="Room Temperature (°C)">
            <input
              type="number"
              className="input"
              min={18}
              max={26}
              value={memory.roomTemperatureC ?? ''}
              onChange={(e) => updateMemory(guest.id, { roomTemperatureC: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>

          <Field label="Pillow Type">
            <select className="input" value={memory.pillowType} onChange={(e) => updateMemory(guest.id, { pillowType: e.target.value as typeof memory.pillowType })}>
              {['soft', 'medium', 'firm', 'no_preference'].map((v) => (
                <option key={v} value={v}>{v.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>

          <Field label="Business or Leisure">
            <select className="input" value={memory.businessOrLeisure} onChange={(e) => updateMemory(guest.id, { businessOrLeisure: e.target.value as typeof memory.businessOrLeisure })}>
              {['business', 'leisure', 'mixed'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Preferred Payment Method">
            <select
              className="input"
              value={memory.preferredPaymentMethod ?? ''}
              onChange={(e) => updateMemory(guest.id, { preferredPaymentMethod: (e.target.value || null) as typeof memory.preferredPaymentMethod })}
            >
              <option value="">No preference</option>
              {['upi', 'credit_card', 'wallet', 'gift_card', 'cash_front_desk'].map((v) => (
                <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </Field>

          <label className="flex items-center justify-between rounded-xl2 bg-white px-4 py-3 shadow-sm">
            <span className="text-sm font-medium text-ink-900">Airport pickup preferred</span>
            <input type="checkbox" checked={memory.airportPickupPreferred} onChange={(e) => updateMemory(guest.id, { airportPickupPreferred: e.target.checked })} />
          </label>

          <Field label="Special Requests">
            <textarea
              className="input"
              rows={2}
              value={memory.specialRequests.join(', ')}
              onChange={(e) => updateMemory(guest.id, { specialRequests: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </Field>

          <Card>
            <p className="text-xs text-ink-700/50">
              AYANA Memory™ is permission-based. You control what is stored, updated, or deleted, and hotels only see what
              you've shared for your stay.
            </p>
          </Card>
        </div>
      </div>

      <style>{`.input { border: 1px solid rgba(15,22,38,0.15); border-radius: 0.5rem; padding: 0.6rem 0.85rem; font-size: 0.875rem; background: white; width: 100%; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">{label}</span>
      {children}
    </label>
  );
}
