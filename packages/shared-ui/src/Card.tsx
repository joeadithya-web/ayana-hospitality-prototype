import type { HTMLAttributes } from 'react';
import { cx } from './cx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ padded = true, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={cx('rounded-xl2 bg-white/90 border border-ink-900/5 shadow-luxury', padded && 'p-5', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
