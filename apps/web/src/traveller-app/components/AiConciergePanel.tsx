import { useState } from 'react';
import { recommendLocalDining, recommendSightseeing, recommendTransport } from '@ayana/ai-engine';
import type { AyanaMemory, HotelCity } from '@ayana/shared-types';
import { Badge, Card } from '@ayana/shared-ui';

type Tab = 'sightseeing' | 'food' | 'travel';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'sightseeing', label: 'Sightseeing', icon: '🗺️' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'travel', label: 'Travel', icon: '🚕' },
];

/**
 * AI concierge recommendations for a guest who has a confirmed booking or is already
 * in-house. Everything is derived from the hotel's city plus the guest's AYANA Memory,
 * so the reasoning line can always name why a card was surfaced.
 */
export function AiConciergePanel({
  city,
  memory,
  onBookTransport,
}: {
  city: HotelCity;
  memory: AyanaMemory;
  onBookTransport?: () => void;
}) {
  const [tab, setTab] = useState<Tab>('sightseeing');

  const sightseeing = recommendSightseeing(city, memory);
  const dining = recommendLocalDining(city, memory);
  const transport = recommendTransport(memory);

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="font-display text-base font-semibold text-ink-950">AI Concierge</h2>
        <Badge tone="gold">Personalised</Badge>
      </div>
      <p className="mb-2.5 text-xs text-ink-700/50">
        Curated for {city} using your AYANA Memory — dietary preferences, trip type and past stays.
      </p>

      <div className="mb-2.5 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
              tab === t.id ? 'border-gold-500 bg-gold-500/10 text-gold-600' : 'border-ink-900/10 text-ink-700/60'
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {tab === 'sightseeing' &&
          sightseeing.map((tip) => (
            <Card key={tip.id} className="flex gap-3">
              <span className="text-2xl leading-none">{tip.icon}</span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-ink-900">{tip.title}</p>
                  <span className="flex-none text-[11px] text-ink-700/40">{tip.distance}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-700/60">{tip.description}</p>
                <p className="mt-1 text-[11px] text-gold-600">✦ {tip.reason}</p>
              </div>
            </Card>
          ))}

        {tab === 'food' &&
          dining.map((tip) => (
            <Card key={tip.id} className="flex gap-3">
              <span className="text-2xl leading-none">{tip.icon}</span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-ink-900">{tip.title}</p>
                  <span className="flex-none text-[11px] text-ink-700/40">{tip.distance}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-700/60">{tip.description}</p>
                <p className="mt-1 text-[11px] text-gold-600">✦ {tip.reason}</p>
              </div>
            </Card>
          ))}

        {tab === 'travel' && (
          <>
            {transport.map((card) => (
              <Card key={card.id} className="flex items-center gap-3">
                <span className="text-2xl leading-none">🚗</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{card.title}</p>
                  <p className="mt-0.5 text-xs text-ink-700/60">{card.description}</p>
                </div>
              </Card>
            ))}
            {onBookTransport && (
              <button
                onClick={onBookTransport}
                className="rounded-xl2 border border-dashed border-gold-500/50 bg-gold-500/5 px-4 py-3 text-sm font-medium text-gold-600"
              >
                Book a cab or transfer →
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
