import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Badge, Button, Card, MockTag, PageHeader } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';
import { useBooking, useHotel, useRoom } from '../hooks';

const ADD_ONS = [
  { id: 'bouquet', label: 'Bouquet', amount: 800 },
  { id: 'chocolates', label: 'Chocolates', amount: 500 },
  { id: 'decor', label: 'Room Décor', amount: 1200 },
  { id: 'late_checkout', label: 'Late Checkout', amount: 1000 },
];

export function Stay() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(bookingId);
  const hotel = useHotel(booking?.hotelId);
  const room = useRoom(booking?.roomId);
  const invoices = useSimulationStore((s) => s.invoices);
  const postCharge = useSimulationStore((s) => s.postCharge);
  const requestHousekeeping = useSimulationStore((s) => s.requestHousekeeping);
  const requestConcierge = useSimulationStore((s) => s.requestConcierge);

  const [chat, setChat] = useState<{ from: 'guest' | 'concierge'; text: string }[]>([
    { from: 'concierge', text: 'Hello! I’m your AYANA concierge. How can I help with your stay?' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const invoice = useMemo(() => invoices.find((i) => i.bookingId === bookingId), [invoices, bookingId]);

  if (!booking || !hotel || !room) return null;

  const lineItems = invoice?.lineItems ?? [{ id: 'room', description: 'Room charges', category: 'room' as const, amount: booking.totalAmount, postedAt: booking.checkInDate }];
  const totalAmount = invoice?.totalAmount ?? booking.totalAmount;
  const amountPaid = invoice?.amountPaid ?? booking.amountPaid;
  const outstanding = Math.max(0, totalAmount - amountPaid);

  function sendChat() {
    if (!chatInput.trim()) return;
    setChat((c) => [...c, { from: 'guest', text: chatInput }]);
    setChatInput('');
    setTimeout(() => {
      setChat((c) => [...c, { from: 'concierge', text: 'Noted — our team will follow up shortly.' }]);
    }, 900);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="In-Stay" subtitle={`${hotel.name} · Room ${room.roomNumber}`} onBack={() => navigate('/traveller/trips')} />

        <div className="flex flex-col gap-5 px-5">
          <Card>
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink-900">Current Balance</p>
              <MockTag />
            </div>
            <p className="mt-1 font-display text-2xl font-semibold text-ink-950">{formatINR(outstanding)}</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {lineItems.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-ink-700/60">
                  <span>{item.description}</span>
                  <span>{formatINR(item.amount)}</span>
                </div>
              ))}
            </div>
            {outstanding > 0 && (
              <Button
                className="mt-3"
                fullWidth
                onClick={() => navigate(`/traveller/checkout/${booking.id}`)}
              >
                Pay Outstanding Balance
              </Button>
            )}
          </Card>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Order Add-ons</h2>
            <div className="grid grid-cols-2 gap-2">
              {ADD_ONS.map((item) => (
                <Card key={item.id} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-ink-900">{item.label}</p>
                  <p className="text-xs text-ink-700/50">{formatINR(item.amount)}</p>
                  <button
                    className="mt-1 rounded-lg bg-ink-900/5 py-1.5 text-xs font-medium text-ink-900"
                    onClick={() => postCharge({ bookingId: booking.id, description: item.label, category: 'add_on', amount: item.amount })}
                  >
                    Order
                  </button>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => requestHousekeeping(room.id, hotel.id)}>
              🧹 Request Housekeeping
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/traveller/concierge/${booking.id}`)}>
              🛎️ Concierge
            </Button>
            <Button
              variant="ghost"
              onClick={() => requestConcierge({ bookingId: booking.id, guestId: booking.guestId, hotelId: hotel.id, type: 'taxi', details: 'Local commute requested from In-Stay' })}
            >
              🚕 Book Transport
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/traveller/checkout/${booking.id}`)}>
              🚪 Checkout
            </Button>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Chat with Concierge</h2>
            <Card className="flex flex-col gap-2">
              <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                {chat.map((m, i) => (
                  <div key={i} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.from === 'guest' ? 'ml-auto bg-ink-900 text-cream-50' : 'bg-ink-900/5 text-ink-900'}`}>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
                  placeholder="Type a message…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                />
                <Button size="sm" onClick={sendChat}>Send</Button>
              </div>
              <Badge tone="neutral">Simulated chat</Badge>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
