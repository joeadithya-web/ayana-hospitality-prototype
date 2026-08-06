import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import type { PaymentMethod } from '@ayana/shared-types';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { useBooking, useHotel } from '../hooks';

const METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
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
  const payBooking = useSimulationStore((s) => s.payBooking);
  const activeFailureScenario = useSimulationStore((s) => s.activeFailureScenario);
  const forcedFailure = activeFailureScenario === 'payment_failure';

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'failed'>('idle');

  if (!booking || !hotel) return null;

  const dueNow = Math.round((booking.totalAmount * booking.paymentTier) / 100) - booking.amountPaid;

  function handlePay() {
    setStatus('processing');
    setTimeout(() => {
      if (simulateFailure || forcedFailure) {
        setStatus('failed');
        return;
      }
      payBooking(booking!.id, method, dueNow);
      navigate(`/traveller/ready/${booking!.id}`);
    }, 1100);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-28">
      <div className="mx-auto max-w-md">
        <PageHeader title="Payment" subtitle={hotel.name} onBack={() => navigate(-1)} />

        <div className="px-5">
          <Card>
            <div className="flex justify-between text-sm">
              <span className="text-ink-700/60">Amount due now</span>
              <span className="font-semibold text-ink-900">₹{dueNow.toLocaleString('en-IN')}</span>
            </div>
            <Badge tone="neutral">Simulated payment — no real gateway, no real charge</Badge>
          </Card>

          <div className="mt-5 flex flex-col gap-2">
            {METHODS.map((m) => (
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

          {forcedFailure ? (
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
            {status === 'processing' ? 'Processing…' : `Pay ₹${dueNow.toLocaleString('en-IN')}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
