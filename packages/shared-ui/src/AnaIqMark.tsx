/**
 * The one consistent visual signature for AnA IQ — used everywhere it speaks or acts (chat
 * headers, suggestion cards, readiness briefs, recommendation panels, staff-facing insight
 * panels) so the same presence is recognisable across every touchpoint, home to room and
 * beyond, on both the guest and hotel-ops sides.
 */
export function AnaIqMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-2.5 py-1 text-[11px] font-medium text-gold-400 ${className}`}>
      <span aria-hidden>✦</span>
      AnA IQ
    </span>
  );
}
