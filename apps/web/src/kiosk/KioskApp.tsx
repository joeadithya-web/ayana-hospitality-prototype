import { useEffect, useState } from 'react';
import { setActiveSource, useSimulationStore } from '@ayana/simulation-engine';
import { KioskCheckIn } from './KioskCheckIn';
import { KioskCheckOut } from './KioskCheckOut';
import { KioskServices } from './KioskServices';

type Mode = 'menu' | 'checkin' | 'checkout' | 'services';

export function KioskApp() {
  const hotels = useSimulationStore((s) => s.hotels);
  const activeFailureScenario = useSimulationStore((s) => s.activeFailureScenario);

  const [hotelId, setHotelId] = useState('htl_springs');
  const [mode, setMode] = useState<Mode>('menu');

  useEffect(() => {
    setActiveSource('kiosk');
  }, []);

  const hotel = hotels.find((h) => h.id === hotelId);
  const globalOffline = activeFailureScenario === 'kiosk_offline' || activeFailureScenario === 'network_failure';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-8 py-12 text-cream-50">
      <div className="absolute right-6 top-6">
        <select
          value={hotelId}
          onChange={(e) => {
            setHotelId(e.target.value);
            setMode('menu');
          }}
          className="rounded-lg border border-white/15 bg-ink-900 px-2 py-1.5 text-xs text-cream-50"
        >
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-400">AYANA Self-Service Kiosk</p>
        <p className="mt-1 font-display text-lg font-semibold">{hotel?.name}</p>

        {globalOffline ? (
          <div className="mt-10 flex flex-col items-center gap-3">
            <span className="text-4xl">📡</span>
            <p className="font-display text-xl font-semibold text-red-300">
              {activeFailureScenario === 'kiosk_offline' ? 'Kiosk Temporarily Offline' : 'Network Unavailable'}
            </p>
            <p className="text-sm text-cream-50/60">Please proceed to Front Office — our team can check you in manually.</p>
          </div>
        ) : mode === 'menu' ? (
          <div className="mt-10 flex w-full flex-col gap-3">
            <p className="text-sm text-cream-50/70">How can we help you today?</p>
            <MenuButton icon="🔑" title="Check In" subtitle="Face scan or QR code" onClick={() => setMode('checkin')} />
            <MenuButton icon="🧳" title="Check Out" subtitle="View your folio and settle up" onClick={() => setMode('checkout')} />
            <MenuButton icon="🛎️" title="Other Services" subtitle="Restaurant, spa, cab & more" onClick={() => setMode('services')} />
          </div>
        ) : mode === 'checkin' ? (
          <KioskCheckIn hotelId={hotelId} onExit={() => setMode('menu')} />
        ) : mode === 'checkout' ? (
          <KioskCheckOut hotelId={hotelId} onExit={() => setMode('menu')} />
        ) : (
          <KioskServices hotelId={hotelId} onExit={() => setMode('menu')} />
        )}
      </div>
    </div>
  );
}

function MenuButton({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl2 border border-white/15 bg-white/5 px-5 py-4 text-left transition-colors hover:bg-white/10"
    >
      <span className="text-3xl">{icon}</span>
      <span>
        <p className="font-display text-base font-semibold text-cream-50">{title}</p>
        <p className="text-xs text-cream-50/50">{subtitle}</p>
      </span>
    </button>
  );
}
