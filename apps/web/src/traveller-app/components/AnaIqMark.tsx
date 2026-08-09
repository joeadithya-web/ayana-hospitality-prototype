/**
 * The one consistent visual signature for AnA IQ — used everywhere it speaks or acts (chat
 * headers, suggestion cards, readiness briefs) so guests recognise the same presence across
 * every touchpoint, home to room and beyond.
 */
export function AnaIqMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-2.5 py-1 text-[11px] font-medium text-gold-400 ${className}`}>
      <span aria-hidden>✦</span>
      AnA IQ
    </span>
  );
}
