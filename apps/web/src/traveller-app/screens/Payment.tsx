import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import type { PaymentMethod } from '@ayana/shared-types';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { useBooking, useCurrentCorporate, useHotel } from '../hooks';

const BASE_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'upi', label: 'UPI', icon: '📲' },
  { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'wallet', label: 'Wallet Balance', icon: '👛' },
  { id: 'gift_card', label: 'Gift Card', icon: '🎁' },
  { id: 'cash_front_desk', label: 'Cash at Front Desk', icon: '🏨' },
];

export function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(bookingId);
  const hotel = useHotel(booking?.hotelId);
  const corporate = useCurrentCorporate();
  const payBooking = useSimulationStore((s) => s.payBooking);
  const activeFailureScenario = useSimulationStore((s) => s.activeFailureScenario);
  const forcedFailure = activeFailureScenario === 'payment_failure';

  const wireAvailable = Boolean(corporate?.wireTransferEnabled);
  const [method, setMethod] = useState<PaymentMethod>(wireAvailable ? 'wire_transfer' : 'upi');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'failed'>('idle');

  if (!booking || !hotel) return null;

  const wireTransfer = method === 'wire_transfer';
  // Wire transfer settles the whole stay on the contract's billing cycle rather than
  // collecting an advance tier now, so the booking is confirmed in full up front.
  const dueNow = wireTransfer
    ? booking.totalAmount - booking.amountPaid
    : Math.round((booking.totalAmount * booking.paymentTier) / 100) - booking.amountPaid;

  const methods = wireAvailable
    ? [{ id: 'wire_transfer' as PaymentMethod, label: 'Wire Transfer (on account)', icon: '🏦' }, ...BASE_METHODS]
    : BASE_METHODS;

  function handlePay() {
    setStatus('processing');
    setTimeout(() => {
      // A pre-established wire arrangement can't be declined at the counter — the failure
      // scenarios model gateway declines, which don't apply here.
      if ((simulateFailure || forcedFailure) && !wireTransfer) {
        setStatus('failed');
        return;
      }
      payBooking(booking!.id, method, dueNow);
      navigate(`/traveller/ready/${booking!.id}`);
    }, wireTransfer ? 600 : 1100);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-28">
      <div className="mx-auto max-w-md">
        <PageHeader title="Payment" subtitle={hotel.name} onBack={() => navigate(-1)} />

        <div className="px-5">
          <Card>
            <div className="flex justify-between text-sm">
              <span className="text-ink-700/60">{wireTransfer ? 'Billed to account' : 'Amount due now'}</span>
              <span className="font-semibold text-ink-900">₹{dueNow.toLocaleString('en-IN')}</span>
            </div>
            {corporate && (
              <p className="mt-1 text-[11px] text-gold-600">
                {corporate.logoEmoji} {corporate.name} · {corporate.negotiatedDiscountPercent}% contracted rate applied
              </p>
            )}
            <Badge tone="neutral">Simulated payment — no real gateway, no real charge</Badge>
          </Card>

          {wireTransfer && corporate && (
            <Card className="mt-4 bg-ink-900/[0.03]">
              <p className="text-xs font-medium text-ink-900">Pre-approved under your agreement</p>
              <p className="mt-1 text-[11px] text-ink-700/60">
                Contract {corporate.contractRef} · settled {corporate.settlementTerms} to {corporate.billingEmail}. No
                card or advance is needed — confirming books the room against the agreement.
              </p>
            </Card>
          )}

          <div className="mt-5 flex flex-col gap-2">
            {methods.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  method === m.id ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/10'
                }`}
              >
                <input type="radio" checked={method === m.id} onChange={() => setMethod(m.id)} />
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </label>
            ))}
          </div>

          {wireTransfer ? null : forcedFailure ? (
            <Badge tone="danger">Control Centre: Payment Failure scenario is active — this payment will be declined</Badge>
          ) : (
            <label className="mt-4 flex items-center gap-2 text-xs text-ink-700/50">
              <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />
              Demo: simulate payment failure
            </label>
          )}

          {status === 'failed' && (
            <Card className="mt-4 border-red-300 bg-red-50">
              <p className="text-sm font-medium text-red-700">Payment failed</p>
              <p className="text-xs text-red-600/80">Simulated decline. No amount was deducted. Try again or choose another method.</p>
            </Card>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button fullWidth size="lg" onClick={handlePay} disabled={status === 'processing'}>
            {status === 'processing'
              ? wireTransfer
                ? 'Confirming…'
                : 'Processing…'
              : wireTransfer
                ? 'Confirm on Wire Transfer'
                : `Pay ₹${dueNow.toLocaleString('en-IN')}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
