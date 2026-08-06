import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, onBack, right }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/10 text-ink-700 hover:bg-ink-900/5"
          >
            ←
          </button>
        )}
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-950">{title}</h1>
          {subtitle && <p className="text-xs text-ink-700/60">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}
