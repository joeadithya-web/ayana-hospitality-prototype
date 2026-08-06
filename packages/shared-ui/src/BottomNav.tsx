import type { ReactNode } from 'react';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}

export function BottomNav({ items }: { items: BottomNavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={item.onClick}
            className={[
              'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
              item.active ? 'text-gold-600' : 'text-ink-700/50 hover:text-ink-700',
            ].join(' ')}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
