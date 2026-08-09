import { useState } from 'react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { deriveStarRatingFromCsi } from '@ayana/ai-engine';
import type { CsiScore } from '@ayana/shared-types';
import { Badge, Button } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { FaceScanStep, GuestIdentityHeader, KioskPaymentStep, ReservationPicker, RevealableRoom } from './kioskShared';

type Step = 'face' | 'reservation_pick' | 'folio' | 'payment' | 'extend' | 'done';

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function KioskCheckOut({ hotelId, onExit }: { hotelId: string; onExit: () => void }) {
  const bookings = useSimulationStore((s) => s.bookings);
  const rooms = useSimulationStore((s) => s.rooms);
  const guests = useSimulationStore((s) => s.guests);
  const invoices = useSimulationStore((s) => s.invoices);
  const activeFailureScenario = useSimulationStore((s) => s.activeFailureScenario);
  const payOutstanding = useSimulationStore((s) => s.payOutstanding);
  const completeCheckout = useSimulationStore((s) => s.completeCheckout);
  const extendStay = useSimulationStore((s) => s.extendStay);
  const issueRefund = useSimulationStore((s) => s.issueRefund);
  const submitFeedback = useSimulationStore((s) => s.submitFeedback);

  const [step, setStep] = useState<Step>('face');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [extendNights, setExtendNights] = useState(1);
  const [refundIssued, setRefundIssued] = useState(0);
  const [csiScore, setCsiScore] = useState<CsiScore | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const activeBooking = bookings.find((b) => b.id === activeBookingId) ?? null;
  const activeGuest = activeBooking ? guests.find((g) => g.id === activeBooking.guestId) : null;
  const activeRoom = activeBooking?.roomId ? rooms.find((r) => r.id === activeBooking.roomId) : null;
  const invoice = activeBooking ? invoices.find((i) => i.bookingId === activeBooking.id) : null;

  const candidates = bookings.filter((b) => b.hotelId === hotelId && b.status === 'checked_in');
  const guestById = new Map(guests.map((g) => [g.id, g]));

  if (!activeBooking) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Check Out</p>

        {step === 'face' && (
          <FaceScanStep
            forceNoMatch={activeFailureScenario === 'identity_failure'}
            onMatched={() => setStep('reservation_pick')}
            onNoMatch={() => setStep('reservation_pick')}
            title="Look at the Camera"
            subtitle="We'll match your face to open your folio."
          />
        )}

        {step === 'reservation_pick' && (
          <ReservationPicker
            candidates={candidates}
            guestNameOf={(b) => guestById.get(b.guestId)?.fullName ?? 'Guest'}
            labelOf={(b) => `Room ${rooms.find((r) => r.id === b.roomId)?.roomNumber ?? '—'}`}
            onSelect={(b) => {
              setActiveBookingId(b.id);
              setStep('folio');
            }}
            emptyLabel="No checked-in guests found at this hotel."
          />
        )}
      </div>
    );
  }

  const totalAmount = invoice?.totalAmount ?? activeBooking.totalAmount;
  const amountPaid = invoice?.amountPaid ?? activeBooking.amountPaid;
  const outstanding = Math.max(0, totalAmount - amountPaid);
  const isCheckoutDay = isSameCalendarDay(new Date(), new Date(activeBooking.checkOutDate));
  const nights = Math.max(1, Math.round((new Date(activeBooking.checkOutDate).getTime() - new Date(activeBooking.checkInDate).getTime()) / 86_400_000));
  const nightlyRate = Math.round(activeBooking.totalAmount / nights);
  const newCheckOutDate = new Date(new Date(activeBooking.checkOutDate).getTime() + extendNights * 86_400_000);

  // Same-day early departure (a few hours early) gets no refund. A full unused night or more
  // does — the longer before the booked checkout date, the higher the refund tier.
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const checkout0 = new Date(activeBooking.checkOutDate);
  checkout0.setHours(0, 0, 0, 0);
  const unusedNights = Math.max(0, Math.round((checkout0.getTime() - today0.getTime()) / 86_400_000));
  const refundPercent = unusedNights === 0 ? 0 : unusedNights === 1 ? 25 : 50;
  const refundAmount = Math.round(nightlyRate * unusedNights * (refundPercent / 100));

  function finishCheckout() {
    if (refundAmount > 0) {
      issueRefund(activeBooking!.id, refundAmount, `Early checkout — ${unusedNights} night(s) unused (${refundPercent}% refund)`);
      setRefundIssued(refundAmount);
    }
    completeCheckout(activeBooking!.id);
    setStep('done');
  }

  function settleAndCheckout() {
    if (outstanding > 0) {
      setStep('payment');
    } else {
      finishCheckout();
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Check Out</p>

      {step !== 'done' && activeGuest && <GuestIdentityHeader guest={activeGuest} />}

      {step === 'folio' && activeGuest && (
        <div className="mt-6 flex w-full flex-col items-center gap-4">
          {activeRoom && <RevealableRoom roomNumber={activeRoom.roomNumber} floor={activeRoom.floor} />}

          <div className="w-full rounded-xl2 border border-white/10 bg-white/5 px-5 py-4 text-left">
            <p className="mb-2 text-xs uppercase tracking-wide text-cream-50/50">Your Folio</p>
            {(invoice?.lineItems ?? [{ id: 'room', description: 'Room charges', amount: activeBooking.totalAmount }]).map((item) => (
              <div key={item.id} className="flex justify-between py-0.5 text-xs text-cream-50/70">
                <span>{item.description}</span>
                <span>{formatINR(item.amount)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-sm font-semibold text-cream-50">
              <span>Total</span>
              <span>{formatINR(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-cream-50/50">
              <span>Paid</span>
              <span>{formatINR(amountPaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className={outstanding > 0 ? 'text-amber-300' : 'text-springs-400'}>Outstanding</span>
              <span className={outstanding > 0 ? 'text-amber-300' : 'text-springs-400'}>{formatINR(outstanding)}</span>
            </div>
          </div>

          {!isCheckoutDay && (
            <div className="w-full rounded-xl2 border border-white/10 bg-white/5 px-5 py-3 text-left text-xs">
              {refundAmount > 0 ? (
                <p className="text-springs-400">
                  Checking out {unusedNights} night(s) early qualifies for a {refundPercent}% refund —{' '}
                  <strong>{formatINR(refundAmount)}</strong> will be credited back on Early Checkout.
                </p>
              ) : (
                <p className="text-cream-50/50">Checking out today before your booked date doesn't qualify for a refund.</p>
              )}
            </div>
          )}

          {isCheckoutDay ? (
            <>
              <Badge tone="gold">Checkout date is today</Badge>
              <Button fullWidth size="lg" onClick={settleAndCheckout}>
                {outstanding > 0 ? `Settle ${formatINR(outstanding)} & Check Out` : 'Complete Checkout'}
              </Button>
            </>
          ) : (
            <>
              <Badge tone="neutral">Checkout date is {formatDate(activeBooking.checkOutDate)} — not today</Badge>
              <div className="flex w-full gap-2">
                <Button fullWidth variant="secondary" onClick={settleAndCheckout}>
                  Early Checkout
                </Button>
                <Button fullWidth variant="ghost" className="!border-white/20 !text-cream-50 hover:!bg-white/5" onClick={() => setStep('extend')}>
                  Extend Stay
                </Button>
              </div>
            </>
          )}

          <button className="text-xs text-cream-50/40 underline" onClick={onExit}>
            Back to Menu
          </button>
        </div>
      )}

      {step === 'payment' && (
        <KioskPaymentStep
          amountDue={outstanding}
          title="Settle Outstanding Balance"
          onPaid={(method) => {
            payOutstanding(activeBooking!.id, method, outstanding);
            finishCheckout();
          }}
        />
      )}

      {step === 'extend' && (
        <div className="mt-6 flex w-full flex-col items-center gap-4">
          <p className="text-sm text-cream-50/70">Add nights to your stay</p>
          <div className="flex items-center gap-4">
            <button
              className="h-10 w-10 rounded-full border border-white/20 text-lg text-cream-50"
              onClick={() => setExtendNights((n) => Math.max(1, n - 1))}
            >
              −
            </button>
            <span className="font-display text-2xl font-semibold text-cream-50">{extendNights}</span>
            <button
              className="h-10 w-10 rounded-full border border-white/20 text-lg text-cream-50"
              onClick={() => setExtendNights((n) => Math.min(7, n + 1))}
            >
              +
            </button>
          </div>
          <div className="w-full rounded-xl2 border border-white/10 bg-white/5 px-5 py-4 text-center">
            <p className="text-xs text-cream-50/50">New checkout date</p>
            <p className="font-display text-lg font-semibold text-cream-50">{formatDate(newCheckOutDate.toISOString())}</p>
            <p className="mt-1 text-xs text-cream-50/50">Additional charge</p>
            <p className="font-display text-lg font-semibold text-gold-300">{formatINR(nightlyRate * extendNights)}</p>
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              extendStay(activeBooking!.id, newCheckOutDate.toISOString());
              setStep('folio');
            }}
          >
            Confirm Extension
          </Button>
          <button className="text-xs text-cream-50/40 underline" onClick={() => setStep('folio')}>
            Back to Folio
          </button>
        </div>
      )}

      {step === 'done' && activeGuest && (
        <div className="mt-6 flex w-full flex-col items-center gap-4">
          <span className="text-4xl">🙏</span>
          <p className="font-display text-lg font-semibold text-cream-50">Thank you for staying with us, {activeGuest.fullName.split(' ')[0]}!</p>
          <p className="max-w-xs text-sm text-cream-50/70">Your invoice has been emailed. We hope to see you again soon.</p>
          {refundIssued > 0 && (
            <Badge tone="gold">{formatINR(refundIssued)} refund issued to your original payment method</Badge>
          )}

          {feedbackSent ? (
            <p className="text-sm text-springs-400">Thank you for your feedback!</p>
          ) : (
            <div className="w-full rounded-xl2 border border-white/10 bg-white/5 px-5 py-4 text-left">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-cream-50/60">
                Customer Satisfaction Index — Scale 1 to 10
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as CsiScore[]).map((n) => (
                  <button
                    key={n}
                    onClick={() => setCsiScore(n)}
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                      csiScore === n ? 'bg-gold-500 text-ink-950' : 'bg-white/10 text-cream-50/70'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {csiScore === 10 && (
                <p className="mt-3 text-center text-sm text-springs-400">Thank you — we're glad your stay was great!</p>
              )}

              {csiScore !== null && csiScore <= 9 && (
                <>
                  <p className="mt-3 text-xs text-cream-50/70">
                    {csiScore === 9
                      ? "Thanks and we value your experience but we are here to hear you. Tell us what are the improvements we can make to serve you better next time."
                      : 'Please tell us — what are the things that we need to improve to increase the score — we are happy to serve you better.'}
                  </p>
                  <textarea
                    className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 p-2.5 text-sm text-cream-50"
                    placeholder="Tell us more (optional)…"
                    rows={2}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                </>
              )}

              {csiScore !== null && (
                <Button
                  fullWidth
                  className="mt-3"
                  onClick={() => {
                    submitFeedback(
                      activeBooking.id,
                      csiScore,
                      deriveStarRatingFromCsi(csiScore),
                      feedbackText,
                      csiScore < 10 ? feedbackText || undefined : undefined,
                    );
                    setFeedbackSent(true);
                  }}
                >
                  Submit Feedback
                </Button>
              )}
            </div>
          )}

          <Button size="lg" variant="secondary" onClick={onExit}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
