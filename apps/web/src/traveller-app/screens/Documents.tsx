import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import type { InvoiceLineItemCategory } from '@ayana/shared-types';
import { AnaIqMark, Badge, Card, PageHeader } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { useCurrentGuest } from '../hooks';

const CATEGORY_LABEL: Record<InvoiceLineItemCategory, string> = {
  room: 'Room',
  food_beverage: 'Food & Beverage',
  transport: 'Transport',
  add_on: 'Add-ons',
  other: 'Other',
};

/**
 * Document Vault + Expense Tracker — both read-only views over records this prototype
 * already generates elsewhere (vouchers, QR keys, invoice line items), gathered in one place
 * so a guest doesn't have to dig through each individual booking to find them.
 */
export function Documents() {
  const navigate = useNavigate();
  const guest = useCurrentGuest();
  const bookings = useSimulationStore((s) => s.bookings);
  const hotels = useSimulationStore((s) => s.hotels);
  const invoices = useSimulationStore((s) => s.invoices);

  const myBookings = useMemo(() => bookings.filter((b) => b.guestId === guest?.id), [bookings, guest?.id]);
  const hotelById = new Map(hotels.map((h) => [h.id, h]));

  const documents = myBookings
    .filter((b) => b.readyToRoom.qrCode || b.status === 'checked_out')
    .map((b) => ({
      bookingId: b.id,
      hotelName: hotelById.get(b.hotelId)?.name ?? 'Hotel',
      qrCode: b.readyToRoom.qrCode,
      voucherCode: b.status === 'checked_out' ? `VOU-${b.id.slice(-6).toUpperCase()}` : null,
      date: b.checkInDate,
    }));

  const expensesByCategory = useMemo(() => {
    const totals = new Map<InvoiceLineItemCategory, number>();
    for (const b of myBookings) {
      const invoice = invoices.find((i) => i.bookingId === b.id);
      for (const item of invoice?.lineItems ?? []) {
        totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
      }
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [myBookings, invoices]);

  const totalSpend = expensesByCategory.reduce((sum, [, amount]) => sum + amount, 0);

  if (!guest) return null;

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Documents & Expenses" subtitle="Vouchers, keys and spend across your stays" onBack={() => navigate('/traveller/profile')} />

        <div className="flex flex-col gap-5 px-5">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink-950">Document Vault</h2>
              <AnaIqMark />
            </div>
            {documents.length === 0 ? (
              <Card className="text-center text-sm text-ink-700/50">No vouchers or keys yet — these appear as you book and stay.</Card>
            ) : (
              <div className="flex flex-col gap-2">
                {documents.map((d) => (
                  <Card key={d.bookingId} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{d.hotelName}</p>
                      <p className="text-xs text-ink-700/50">{formatDate(d.date)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {d.qrCode && <Badge tone="neutral">Key · {d.qrCode}</Badge>}
                      {d.voucherCode && <Badge tone="gold">Voucher · {d.voucherCode}</Badge>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Expense Tracker</h2>
            {expensesByCategory.length === 0 ? (
              <Card className="text-center text-sm text-ink-700/50">No charges yet across your stays.</Card>
            ) : (
              <Card className="flex flex-col gap-1.5">
                {expensesByCategory.map(([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-ink-700/70">{CATEGORY_LABEL[category]}</span>
                    <span className="font-medium text-ink-900">{formatINR(amount)}</span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t border-ink-900/10 pt-2 text-sm font-semibold text-ink-900">
                  <span>Total across all stays</span>
                  <span>{formatINR(totalSpend)}</span>
                </div>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
