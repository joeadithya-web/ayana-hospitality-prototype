import type { ReactNode } from 'react';

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-ink-900/15 px-6 py-10 text-center">
      {icon && <div className="text-3xl">{icon}</div>}
      <p className="font-display text-base font-semibold text-ink-900">{title}</p>
      {description && <p className="max-w-xs text-sm text-ink-700/60">{description}</p>}
      {action}
    </div>
  );
}
