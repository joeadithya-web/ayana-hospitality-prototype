import type { ReactNode } from 'react';

type Tone = 'gold' | 'springs' | 'neutral' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<Tone, string> = {
  gold: 'bg-gold-500/15 text-gold-600 border-gold-500/30',
  springs: 'bg-springs-500/10 text-springs-600 border-springs-500/25',
  neutral: 'bg-ink-900/5 text-ink-700 border-ink-900/10',
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/25',
  danger: 'bg-red-500/10 text-red-600 border-red-500/25',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        TONE_CLASSES[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
