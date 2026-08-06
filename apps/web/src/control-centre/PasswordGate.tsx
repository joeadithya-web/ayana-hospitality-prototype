import { useState, type ReactNode } from 'react';

const CONTROL_CENTRE_PASSWORD = 'ayana-presenter';
const SESSION_KEY = 'ayana-control-centre-unlocked';

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === CONTROL_CENTRE_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs rounded-xl2 bg-ink-900 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-400">AYANA</p>
        <p className="mt-1 font-display text-lg font-semibold text-cream-50">Simulation Control Centre</p>
        <p className="mt-1 text-xs text-cream-50/50">Presenter access only</p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Presenter password"
          className="mt-4 w-full rounded-lg border border-white/15 bg-ink-950 px-3 py-2.5 text-center text-sm text-cream-50"
        />
        {error && <p className="mt-2 text-xs text-red-400">Incorrect password.</p>}
        <button type="submit" className="mt-4 w-full rounded-lg bg-gold-500 py-2.5 text-sm font-medium text-ink-950">
          Unlock
        </button>
      </form>
    </div>
  );
}
