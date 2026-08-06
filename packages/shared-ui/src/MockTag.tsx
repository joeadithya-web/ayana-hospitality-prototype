/** Small inline marker on every simulated payment/financial figure — nothing here is a real transaction. */
export function MockTag() {
  return (
    <span className="rounded border border-ink-900/10 bg-ink-900/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-700/50">
      Simulated
    </span>
  );
}
