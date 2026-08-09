import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { calculateIntentFulfilment, intentTemplateById, mergeBlueprints, resolveExperienceBlueprint } from '@ayana/ai-engine';
import type { PaymentMethod } from '@ayana/shared-types';
import { Badge, Button, Card, MockTag, PageHeader } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { useBooking, useHotel } from '../hooks';

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'upi', label: 'UPI' },
  { id: 'credit_card', label: 'Card' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'cash_front_desk', label: 'Cash at Front Desk' },
];

export function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(bookingId);
  const hotel = useHotel(booking?.hotelId);
  const invoices = useSimulationStore((s) => s.invoices);
  const conciergeRequests = useSimulationStore((s) => s.conciergeRequests);
  const intentTasks = useSimulationStore((s) => s.intentTasks);
  const payOutstanding = useSimulationStore((s) => s.payOutstanding);
  const completeCheckout = useSimulationStore((s) => s.completeCheckout);
  const submitFeedback = useSimulationStore((s) => s.submitFeedback);

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [feedbackSent, setFeedbackSent] = useState(false);

  const invoice = useMemo(() => invoices.find((i) => i.bookingId === bookingId), [invoices, bookingId]);

  if (!booking || !hotel) return null;

  const totalAmount = invoice?.totalAmount ?? booking.totalAmount;
  const amountPaid = invoice?.amountPaid ?? booking.amountPaid;
  const outstanding = Math.max(0, totalAmount - amountPaid);
  const isCheckedOut = booking.status === 'checked_out';
  const voucherCode = `VOU-${booking.id.slice(-6).toUpperCase()}`;

  const primaryIntent = booking.intents.find((i) => i.role === 'primary');
  const secondaryIntent = booking.intents.find((i) => i.role === 'secondary');
  const primaryBlueprint = primaryIntent
    ? resolveExperienceBlueprint(primaryIntent.templateId, { bookingId: booking.id, conciergeRequests, intentTasks })
    : [];
  const secondaryBlueprint = secondaryIntent
    ? resolveExperienceBlueprint(secondaryIntent.templateId, { bookingId: booking.id, conciergeRequests, intentTasks })
    : [];
  const overallFulfilment = calculateIntentFulfilment(mergeBlueprints(primaryBlueprint, secondaryBlueprint));

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Checkout" subtitle={hotel.name} onBack={() => navigate(-1)} />

        <div className="flex flex-col gap-5 px-5">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-700/60">Outstanding balance</span>
              <MockTag />
            </div>
            <p className="font-display text-2xl font-semibold text-ink-950">{formatINR(outstanding)}</p>
            {outstanding === 0 && <Badge tone="success">Zero balance</Badge>}
          </Card>

          {outstanding > 0 && !isCheckedOut && (
            <>
              <div className="flex gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
                      method === m.id ? 'border-gold-500 bg-gold-500/10 text-gold-600' : 'border-ink-900/10 text-ink-700/60'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <Button fullWidth onClick={() => payOutstanding(booking.id, method, outstanding)}>
                Pay {formatINR(outstanding)}
              </Button>
            </>
          )}

          {outstanding === 0 && !isCheckedOut && (
            <Button size="lg" fullWidth onClick={() => completeCheckout(booking.id)}>
              Complete Checkout
            </Button>
          )}

          {isCheckedOut && (
            <>
              <section>
                <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Digital Invoice</h2>
                <Card>
                  {(invoice?.lineItems ?? []).map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-ink-700/60">
                      <span>{item.description}</span>
                      <span>{formatINR(item.amount)}</span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-ink-900/10 pt-2 text-sm font-semibold text-ink-900">
                    <span>Total paid</span>
                    <span>{formatINR(totalAmount)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-700/40">
                    Issued {invoice?.issuedAt ? formatDate(invoice.issuedAt) : formatDate(new Date().toISOString())}
                  </p>
                </Card>
              </section>

              {primaryIntent && (
                <section>
                  <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Intent Fulfilment</h2>
                  <Card>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700/60">
                        {intentTemplateById(primaryIntent.templateId)?.label ?? 'Primary intent'}
                      </span>
                      <span className="font-medium text-ink-900">{calculateIntentFulfilment(primaryBlueprint)}%</span>
                    </div>
                    {secondaryIntent && (
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-sm text-ink-700/60">{intentTemplateById(secondaryIntent.templateId)?.label}</span>
                        <span className="font-medium text-ink-900">{calculateIntentFulfilment(secondaryBlueprint)}%</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between border-t border-ink-900/10 pt-2">
                      <span className="text-sm font-medium text-ink-900">Overall Journey Fulfilment</span>
                      <Badge tone="gold">{overallFulfilment}%</Badge>
                    </div>
                    <p className="mt-2 text-xs italic text-ink-700/50">Did we help you achieve the purpose of your journey?</p>
                  </Card>
                </section>
              )}

              <section>
                <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Voucher</h2>
                <Card className="text-center">
                  <p className="font-display text-lg font-semibold tracking-widest text-gold-600">{voucherCode}</p>
                  <p className="text-xs text-ink-700/50">Sent via SMS &amp; email (simulated)</p>
                </Card>
              </section>

              <section>
                <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Feedback</h2>
                {feedbackSent ? (
                  <Card className="text-center text-sm text-springs-600">Thank you for your feedback!</Card>
                ) : (
                  <Card className="flex flex-col gap-3">
                    <div className="flex justify-center gap-1 text-2xl">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setFeedback((f) => ({ ...f, rating: n }))}>
                          {n <= feedback.rating ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="rounded-lg border border-ink-900/15 p-2.5 text-sm"
                      placeholder="Tell us about your stay…"
                      rows={2}
                      value={feedback.comment}
                      onChange={(e) => setFeedback((f) => ({ ...f, comment: e.target.value }))}
                    />
                    <Button
                      onClick={() => {
                        submitFeedback(booking.id, feedback.rating as 1 | 2 | 3 | 4 | 5, feedback.comment);
                        setFeedbackSent(true);
                      }}
                    >
                      Submit Feedback
                    </Button>
                  </Card>
                )}
              </section>

              <Button variant="secondary" fullWidth onClick={() => navigate(`/traveller/hotel/${hotel.id}`)}>
                Rebook {hotel.name}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
