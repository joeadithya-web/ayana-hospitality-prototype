import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-ink-900 text-cream-50 hover:bg-ink-800 active:bg-ink-700',
  secondary: 'bg-gold-500 text-ink-950 hover:bg-gold-400 active:bg-gold-600',
  ghost: 'bg-transparent text-ink-900 border border-ink-900/15 hover:bg-ink-900/5',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
