import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { deriveStarRatingFromCsi } from '@ayana/ai-engine';
import type { CsiScore, PaymentMethod } from '@ayana/shared-types';
import { Badge, Button, Card, MockTag, PageHeader } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { useBooking, useHotel } from '../hooks';
import { AnaIqMark } from '../components/AnaIqMark';

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
  const payOutstanding = useSimulationStore((s) => s.payOutstanding);
  const completeCheckout = useSimulationStore((s) => s.completeCheckout);
  const submitFeedback = useSimulationStore((s) => s.submitFeedback);

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [csiScore, setCsiScore] = useState<CsiScore | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const invoice = useMemo(() => invoices.find((i) => i.bookingId === bookingId), [invoices, bookingId]);

  if (!booking || !hotel) return null;

  const totalAmount = invoice?.totalAmount ?? booking.totalAmount;
  const amountPaid = invoice?.amountPaid ?? booking.amountPaid;
  const outstanding = Math.max(0, totalAmount - amountPaid);
  const isCheckedOut = booking.status === 'checked_out';
  const voucherCode = `VOU-${booking.id.slice(-6).toUpperCase()}`;

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

              <section>
                <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Voucher</h2>
                <Card className="text-center">
                  <p className="font-display text-lg font-semibold tracking-widest text-gold-600">{voucherCode}</p>
                  <p className="text-xs text-ink-700/50">Sent via SMS &amp; email (simulated)</p>
                </Card>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-ink-950">Feedback</h2>
                  <AnaIqMark />
                </div>
                {feedbackSent ? (
                  <Card className="text-center text-sm text-springs-600">Thank you for your feedback!</Card>
                ) : (
                  <Card className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="max-w-[85%] rounded-xl bg-ink-900/5 px-3 py-2 text-sm text-ink-900">
                        Customer Satisfaction Index — pick a score from 1 to 10 for this stay.
                      </div>
                      {csiScore !== null && (
                        <>
                          <div className="ml-auto max-w-[85%] rounded-xl bg-ink-900 px-3 py-2 text-sm text-cream-50">
                            {csiScore}
                          </div>
                          <div className="max-w-[85%] rounded-xl bg-ink-900/5 px-3 py-2 text-sm text-ink-900">
                            {csiScore === 10
                              ? "Thank you — we're glad your stay was great!"
                              : csiScore === 9
                                ? 'Thanks and we value your experience but we are here to hear you. Tell us what are the improvements we can make to serve you better next time.'
                                : 'Please tell us — what are the things that we need to improve to increase the score — we are happy to serve you better.'}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-1.5">
                      {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as CsiScore[]).map((n) => (
                        <button
                          key={n}
                          onClick={() => setCsiScore(n)}
                          className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                            csiScore === n ? 'bg-gold-500 text-ink-950' : 'bg-ink-900/5 text-ink-700/70'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    {csiScore !== null && csiScore <= 9 && (
                      <textarea
                        className="rounded-lg border border-ink-900/15 p-2.5 text-sm"
                        placeholder="Tell AnA IQ more (optional)…"
                        rows={2}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                    )}

                    <Button
                      disabled={csiScore === null}
                      onClick={() => {
                        if (csiScore === null) return;
                        submitFeedback(
                          booking.id,
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
                    <MockTag />
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
