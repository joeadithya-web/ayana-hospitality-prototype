import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const APPS = [
  { key: 'traveller', label: 'Traveller App', icon: '🧳', path: '/traveller' },
  { key: 'dashboard', label: 'Hotel Ops Dashboard', icon: '🏨', path: '/dashboard' },
  { key: 'kiosk', label: 'Self-Service Kiosk', icon: '🔑', path: '/kiosk' },
  { key: 'control', label: 'Control Centre', icon: '🛠️', path: '/control' },
] as const;

/** Demo-only surface switcher — lets a reviewer jump between the four independent apps without knowing the URLs. Not a real product feature. */
export function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const current = APPS.find((a) => location.pathname.startsWith(a.path))?.key;

  return (
    <div className="fixed bottom-24 right-4 z-[999] flex flex-col items-end gap-2">
      {open && (
        <div className="w-60 overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-2xl">
          <p className="border-b border-white/10 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gold-400">
            Demo — Switch App
          </p>
          {APPS.map((a) => (
            <button
              key={a.key}
              onClick={() => {
                navigate(a.path);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${
                current === a.key ? 'bg-gold-500/15 text-gold-300' : 'text-cream-50/80 hover:bg-white/5'
              }`}
            >
              <span className="text-base leading-none">{a.icon}</span>
              <span className="flex-1">{a.label}</span>
              {current === a.key && <span className="text-[10px]">●</span>}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-950 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-cream-50 shadow-xl"
      >
        <span aria-hidden>⚡</span>
        Demo
        <span aria-hidden>{open ? '✕' : '▾'}</span>
      </button>
    </div>
  );
}
