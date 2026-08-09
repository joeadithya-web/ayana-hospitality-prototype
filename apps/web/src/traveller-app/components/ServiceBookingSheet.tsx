import { useState } from 'react';
import { SERVICE_KIND_LABEL, servicesByKind } from '@ayana/ai-engine';
import type { Booking, Guest, ServiceCatalogItem, ServiceKind } from '@ayana/shared-types';
import { Badge, Button, Sheet } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';
import { useSimulationStore } from '@ayana/simulation-engine';

const TIME_SLOTS = ['7:00 AM', '9:00 AM', '12:00 PM', '4:00 PM', '7:00 PM', '8:30 PM'];
const KINDS: ServiceKind[] = ['restaurant', 'spa', 'transport', 'add_on', 'celebration', 'experience'];

/**
 * In-app service booking. Anything booked here posts to the same folio the kiosk and
 * front desk write to, so the guest's bill on the phone stays the single live view of
 * what they owe.
 */
export function ServiceBookingSheet({
  open,
  onClose,
  booking,
  guest,
  initialKind,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking;
  guest: Guest;
  initialKind?: ServiceKind;
}) {
  const bookService = useSimulationStore((s) => s.bookService);
  const [kind, setKind] = useState<ServiceKind>(initialKind ?? 'restaurant');
  const [selected, setSelected] = useState<ServiceCatalogItem | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);

  function reset() {
    setSelected(null);
    setSlot(null);
    setNote('');
    setConfirmed(null);
  }

  function confirm() {
    if (!selected) return;
    const timing = slot ? ` at ${slot}` : '';
    bookService({
      bookingId: booking.id,
      guestId: guest.id,
      hotelId: booking.hotelId,
      requestType: selected.requestType,
      details: `${selected.label}${timing}${note.trim() ? ` — ${note.trim()}` : ''}`,
      description: selected.label,
      amount: selected.price,
      chargeCategory: selected.chargeCategory,
    });
    setConfirmed(
      selected.price > 0
        ? `${selected.label}${timing} confirmed. ${formatINR(selected.price)} added to your room bill.`
        : `${selected.label}${timing} confirmed. Nothing charged upfront.`,
    );
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Book a Service"
    >
      {confirmed ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-springs-500 text-xl text-white">✓</span>
          <p className="text-sm text-ink-800">{confirmed}</p>
          <div className="mt-1 flex w-full gap-2">
            <Button fullWidth variant="secondary" onClick={reset}>
              Book Another
            </Button>
            <Button
              fullWidth
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k}
                onClick={() => {
                  setKind(k);
                  setSelected(null);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  kind === k ? 'border-gold-500 bg-gold-500/10 text-gold-600' : 'border-ink-900/10 text-ink-700/60'
                }`}
              >
                {SERVICE_KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {servicesByKind(kind).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`flex items-start gap-3 rounded-xl2 border px-3.5 py-3 text-left ${
                  selected?.id === item.id ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/10 bg-white'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink-900">{item.label}</span>
                  <span className="block text-xs text-ink-700/50">{item.description}</span>
                </span>
                <span className="text-sm font-medium text-ink-900">
                  {item.price > 0 ? formatINR(item.price) : 'Free'}
                </span>
              </button>
            ))}
          </div>

          {selected && (
            <>
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-700/50">Preferred time</p>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSlot(t)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                        slot === t ? 'border-gold-500 bg-gold-500/10 text-gold-600' : 'border-ink-900/10 text-ink-700/60'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <input
                className="rounded-lg border border-ink-900/15 px-3 py-2.5 text-sm"
                placeholder="Anything we should know? (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              {guest.memory.dietaryPreference !== 'no_preference' && selected.kind === 'restaurant' && (
                <Badge tone="gold">
                  AYANA Memory: {guest.memory.dietaryPreference.replace('_', ' ')} shared with the kitchen
                </Badge>
              )}

              <Button fullWidth size="lg" onClick={confirm}>
                {selected.price > 0 ? `Confirm — ${formatINR(selected.price)} to room` : 'Confirm Booking'}
              </Button>
              <p className="text-center text-[11px] text-ink-700/50">
                Charges are added to your room bill and payable any time from the app.
              </p>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
