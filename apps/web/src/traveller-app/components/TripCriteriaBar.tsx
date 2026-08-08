import { useNavigate } from 'react-router-dom';
import { GROUP_BOOKING_MIN_GUESTS } from '@ayana/shared-types';
import { Card } from '@ayana/shared-ui';
import { useTripSearchStore } from '../tripSearchStore';

/**
 * Dates and party size — the first thing a guest tells us, and what everything downstream
 * is filtered against. Rendered wherever those criteria need to be visible and editable.
 */
export function TripCriteriaBar({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { checkInDate, checkOutDate, guestsCount, setCheckInDate, setCheckOutDate, setGuestsCount } =
    useTripSearchStore();

  const nights = Math.max(
    1,
    Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86_400_000),
  );
  const needsGroupBooking = guestsCount >= GROUP_BOOKING_MIN_GUESTS;

  return (
    <Card className={compact ? '!py-3' : undefined}>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-700/50">Check-in</span>
          <input
            type="date"
            className="rounded-lg border border-ink-900/15 px-2.5 py-2 text-sm"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-700/50">Check-out</span>
          <input
            type="date"
            className="rounded-lg border border-ink-900/15 px-2.5 py-2 text-sm"
            value={checkOutDate}
            min={checkInDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-700/70">
          Guests
          <span className="ml-1.5 text-ink-700/40">
            · {nights} night{nights === 1 ? '' : 's'}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <button
            aria-label="Fewer guests"
            className="h-8 w-8 rounded-full border border-ink-900/15 text-ink-900 disabled:opacity-30"
            disabled={guestsCount <= 1}
            onClick={() => setGuestsCount(guestsCount - 1)}
          >
            −
          </button>
          <span className="w-5 text-center font-display text-lg font-semibold text-ink-950">{guestsCount}</span>
          <button
            aria-label="More guests"
            className="h-8 w-8 rounded-full border border-ink-900/15 text-ink-900"
            onClick={() => setGuestsCount(guestsCount + 1)}
          >
            +
          </button>
        </span>
      </div>

      {needsGroupBooking && (
        <button
          onClick={() => navigate('/traveller/group')}
          className="mt-2.5 w-full rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-left text-[11px] text-gold-700"
        >
          👥 {guestsCount} guests needs a group booking — tap to book multiple rooms together →
        </button>
      )}
    </Card>
  );
}
