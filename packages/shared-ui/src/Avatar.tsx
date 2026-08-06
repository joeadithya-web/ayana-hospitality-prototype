function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="flex flex-none items-center justify-center rounded-full bg-ink-900 font-display font-semibold text-gold-400"
    >
      {initials(name)}
    </div>
  );
}
