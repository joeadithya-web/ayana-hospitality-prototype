import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, className = '', ...rest }: TextFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">{label}</span>
      <input
        id={inputId}
        className={[
          'rounded-lg border border-ink-900/15 bg-white px-3.5 py-2.5 text-sm text-ink-900',
          'focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25',
          error ? 'border-red-400' : '',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
