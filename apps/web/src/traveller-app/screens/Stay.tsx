import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { buildStaySuggestions, getSimulatedWeather, recommendServices, WEATHER_ICON } from '@ayana/ai-engine';
import type { PaymentMethod, ServiceKind } from '@ayana/shared-types';
import { Badge, Button, Card, MockTag, PageHeader } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { useBooking, useCurrentGuest, useHotel, useRoom } from '../hooks';
import { AiConciergePanel } from '../components/AiConciergePanel';
import { AnaIqMark } from '../components/AnaIqMark';
import { ConciergeChat } from '../components/ConciergeChat';
import { NextTripPanel } from '../components/NextTripPanel';
import { ServiceBookingSheet } from '../components/ServiceBookingSheet';

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'upi', label: 'UPI' },
  { id: 'credit_card', label: 'Card' },
  { id: 'wallet', label: 'Wallet' },
];

const REQUEST_STATUS_TONE = {
  requested: 'warning',
  confirmed: 'success',
  in_progress: 'gold',
  completed: 'neutral',
  cancelled: 'danger',
} as const;

/**
 * The live view of an in-progress stay: what the room is, what's on the bill right now,
 * everything booked so far, and the ability to add more or settle up at any moment.
 * This is the screen the guest lives in between check-in and checkout.
 */
export function Stay() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(bookingId);
  const hotel = useHotel(booking?.hotelId);
  const room = useRoom(booking?.roomId);
  const guest = useCurrentGuest();
  const invoices = useSimulationStore((s) => s.invoices);
  const conciergeRequests = useSimulationStore((s) => s.conciergeRequests);
  const intentTasks = useSimulationStore((s) => s.intentTasks);
  const payOutstanding = useSimulationStore((s) => s.payOutstanding);
  const requestHousekeeping = useSimulationStore((s) => s.requestHousekeeping);
  const bookService = useSimulationStore((s) => s.bookService);
  const updateMemory = useSimulationStore((s) => s.updateMemory);

  const [serviceSheet, setServiceSheet] = useState<{ open: boolean; kind?: ServiceKind }>({ open: false });
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [paidJustNow, setPaidJustNow] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [learnedPreferenceApplied, setLearnedPreferenceApplied] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  // Simulated only — no real in-room IoT connection, deliberately kept as local UI state rather
  // than persisted engine data.
  const [roomControls, setRoomControls] = useState({ lights: true, ac: true, curtains: false });

  const invoice = useMemo(() => invoices.find((i) => i.bookingId === bookingId), [invoices, bookingId]);
  const myRequests = useMemo(
    () =>
      conciergeRequests
        .filter((r) => r.bookingId === bookingId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [conciergeRequests, bookingId],
  );

  const suggestions = useMemo(
    () =>
      booking && guest
        ? buildStaySuggestions({ booking, conciergeRequests, familyMembers: guest.familyMembers, memory: guest.memory }).filter(
            (s) => !dismissedSuggestions.has(s.id),
          )
        : [],
    [booking, guest, conciergeRequests, dismissedSuggestions],
  );
  // Only things AnA IQ has actually finished — never a to-do list, so nothing here ever
  // reads as incomplete or graded.
  const arrangedForTrip = useMemo(
    () => intentTasks.filter((t) => t.bookingId === bookingId && t.status === 'done').map((t) => t.label),
    [intentTasks, bookingId],
  );

  // The room may legitimately not be allocated yet (e.g. an upgrade move is in progress),
  // so the screen must render without it rather than blanking out.
  if (!booking || !hotel || !guest) return null;

  function acceptSuggestion(s: (typeof suggestions)[number]) {
    if (!booking || !guest) return;
    bookService({
      bookingId: booking.id,
      guestId: guest.id,
      hotelId: booking.hotelId,
      requestType: s.requestType,
      details: s.details,
      description: s.details,
      amount: 0,
      chargeCategory: 'add_on',
    });
    setDismissedSuggestions((prev) => new Set(prev).add(s.id));
  }

  const weather = getSimulatedWeather(hotel.city, new Date().toISOString());

  // Learn My Preferences — deterministic frequency-based inference (not ML): a request type
  // this guest has made 2+ times, across any of their stays, that isn't already saved.
  const requestCounts = new Map<string, number>();
  for (const r of conciergeRequests) {
    if (r.guestId === guest.id) requestCounts.set(r.type, (requestCounts.get(r.type) ?? 0) + 1);
  }
  const learnablePreference = Array.from(requestCounts.entries()).find(
    ([type, count]) => count >= 2 && !guest.memory.favouriteServices.includes(type),
  );

  const lineItems = invoice?.lineItems ?? [
    { id: 'room', description: 'Room charges', category: 'room' as const, amount: booking.totalAmount, postedAt: booking.checkInDate },
  ];
  const totalAmount = invoice?.totalAmount ?? booking.totalAmount;
  const amountPaid = invoice?.amountPaid ?? booking.amountPaid;
  const outstanding = Math.max(0, totalAmount - amountPaid);
  const nights = Math.max(
    1,
    Math.round((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86_400_000),
  );
  const suggested = recommendServices(guest.memory, guest.isVip, 3);

  function settle() {
    payOutstanding(booking!.id, method, outstanding);
    setPayOpen(false);
    setPaidJustNow(true);
    setTimeout(() => setPaidJustNow(false), 2600);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader
          title="Your Stay"
          subtitle={hotel.name}
          onBack={() => navigate('/traveller/trips')}
        />

        <div className="flex flex-col gap-5 px-5">
          {/* Room + stay status */}
          <Card className="bg-ink-950 text-cream-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gold-400">
                  {room ? 'Your Room' : 'Room Assignment'}
                </p>
                <p className="mt-1 font-display text-3xl font-semibold">
                  {room ? room.roomNumber : 'In progress'}
                </p>
                <p className="mt-0.5 text-xs text-cream-50/50">
                  {room ? `Floor ${room.floor} · ${room.section}` : 'Front Office is preparing your new room'}
                </p>
              </div>
              <Badge tone="success">Checked in</Badge>
            </div>
            <div className="mt-3 flex justify-between border-t border-white/10 pt-2.5 text-xs text-cream-50/60">
              <span>{formatDate(booking.checkInDate)} — {formatDate(booking.checkOutDate)}</span>
              <span className="capitalize">{booking.roomCategory} · {nights} night{nights === 1 ? '' : 's'}</span>
            </div>
          </Card>

          {/* Weather Intelligence — simulated, deterministic by city + date, no live API call. */}
          <Card className="flex items-center gap-3">
            <span className="text-2xl leading-none">{WEATHER_ICON[weather.condition]}</span>
            <div className="flex-1">
              <p className="text-sm font-medium capitalize text-ink-900">{weather.condition} · {weather.tempC}°C</p>
              <p className="text-xs text-ink-700/50">{weather.suggestion}</p>
            </div>
            <MockTag />
          </Card>

          {/* Room Controls — simulated toggle UI only, no real in-room hardware connection. */}
          {room && (
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-900">Room Controls</p>
                <MockTag />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'lights' as const, label: 'Lights', icon: '💡' },
                    { key: 'ac' as const, label: 'AC', icon: '❄️' },
                    { key: 'curtains' as const, label: 'Curtains', icon: '🪟' },
                  ]
                ).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setRoomControls((prev) => ({ ...prev, [c.key]: !prev[c.key] }))}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium ${
                      roomControls[c.key] ? 'border-gold-500 bg-gold-500/10 text-gold-600' : 'border-ink-900/10 text-ink-700/50'
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    {c.label}
                    <span className="text-[10px]">{roomControls[c.key] ? 'On' : 'Off'}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Live folio */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink-950">Your Bill</h2>
              <span className="flex items-center gap-1.5 text-[11px] text-springs-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-springs-500" />
                Live
              </span>
            </div>
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-700/60">Outstanding now</p>
                <MockTag />
              </div>
              <p className="mt-0.5 font-display text-3xl font-semibold text-ink-950">{formatINR(outstanding)}</p>

              <div className="mt-3 flex flex-col gap-1.5 border-t border-ink-900/10 pt-2.5">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-xs">
                    <span className="flex-1 text-ink-700/70">{item.description}</span>
                    <span className={`flex-none font-medium ${item.amount < 0 ? 'text-springs-600' : 'text-ink-900'}`}>
                      {formatINR(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t border-ink-900/10 pt-2 text-xs">
                  <span className="text-ink-700/60">Total charged</span>
                  <span className="font-medium text-ink-900">{formatINR(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-700/60">Already paid</span>
                  <span className="font-medium text-springs-600">−{formatINR(amountPaid)}</span>
                </div>
              </div>

              {paidJustNow && (
                <p className="mt-2.5 rounded-lg bg-springs-500/10 px-3 py-2 text-xs font-medium text-springs-600">
                  Payment received — your balance is up to date.
                </p>
              )}

              {outstanding > 0 && !payOpen && (
                <Button className="mt-3" fullWidth onClick={() => setPayOpen(true)}>
                  Pay {formatINR(outstanding)} Now
                </Button>
              )}

              {outstanding > 0 && payOpen && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex gap-1.5">
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
                  <Button fullWidth onClick={settle}>
                    Pay {formatINR(outstanding)}
                  </Button>
                  <button className="text-xs text-ink-700/50 underline" onClick={() => setPayOpen(false)}>
                    Cancel
                  </button>
                </div>
              )}

              {outstanding === 0 && (
                <p className="mt-3 rounded-lg bg-springs-500/10 px-3 py-2 text-xs font-medium text-springs-600">
                  Nothing outstanding — you can walk out any time.
                </p>
              )}
            </Card>
          </section>

          {/* Quick actions */}
          <section className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setServiceSheet({ open: true })}>
              ＋ Book a Service
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/traveller/manage/${booking.id}`)}>
              ⚙️ Manage Stay
            </Button>
            <Button variant="ghost" onClick={() => room && requestHousekeeping(room.id, hotel.id)} disabled={!room}>
              🧹 Housekeeping
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/traveller/checkout/${booking.id}`)}>
              🚪 Checkout
            </Button>
          </section>

          {/* Proactive nudges — AnA IQ notices the moment rather than waiting to be asked.
              Accepting books the same way a guest-initiated request would, so fulfilment is
              identical and always attributable to staff, never silently automated. */}
          {suggestions.length > 0 && (
            <section className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <Card key={s.id} className="border-gold-500/30 bg-gold-500/5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <AnaIqMark />
                  </div>
                  <p className="text-sm text-ink-900">{s.text}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Button size="sm" onClick={() => acceptSuggestion(s)}>
                      {s.acceptLabel}
                    </Button>
                    <button
                      className="text-xs text-ink-700/50 underline"
                      onClick={() => setDismissedSuggestions((prev) => new Set(prev).add(s.id))}
                    >
                      Not now
                    </button>
                    <button
                      className="ml-auto text-xs text-ink-700/40 underline"
                      onClick={() => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                      Not quite — tell AnA IQ
                    </button>
                  </div>
                </Card>
              ))}
            </section>
          )}

          {/* Learn My Preferences — noticed a repeated request, offers to save it. Rule-based
              (frequency count), honestly framed as such, never claimed as machine learning. */}
          {learnablePreference && !learnedPreferenceApplied && (
            <Card className="border-gold-500/30 bg-gold-500/5">
              <div className="mb-1.5 flex items-center justify-between">
                <AnaIqMark />
              </div>
              <p className="text-sm text-ink-900">
                You've asked for {learnablePreference[0].replaceAll('_', ' ')} more than once — want AnA IQ to remember this
                for future stays?
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    updateMemory(guest.id, { favouriteServices: [...guest.memory.favouriteServices, learnablePreference[0]] });
                    setLearnedPreferenceApplied(true);
                  }}
                >
                  Yes, remember it
                </Button>
                <button className="text-xs text-ink-700/50 underline" onClick={() => setLearnedPreferenceApplied(true)}>
                  Not now
                </button>
              </div>
            </Card>
          )}

          {/* Plain, finished-only list — never a checklist or percentage, only what's actually
              been arranged so far. */}
          {arrangedForTrip.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Arranged For Your Trip</h2>
              <Card className="flex flex-col gap-1.5">
                {arrangedForTrip.map((label) => (
                  <p key={label} className="flex items-start gap-2 text-sm text-ink-800">
                    <span className="mt-0.5 text-springs-600">✓</span>
                    {label}
                  </p>
                ))}
              </Card>
            </section>
          )}

          <div ref={chatRef}>
            <ConciergeChat
              city={hotel.city}
              memory={guest.memory}
              outstanding={outstanding}
              guestFirstName={guest.fullName.split(' ')[0] ?? 'there'}
              onBookService={(kind) => setServiceSheet({ open: true, kind })}
            />
          </div>

          {/* Suggested services */}
          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Suggested For You</h2>
            <div className="flex flex-col gap-2">
              {suggested.map((item) => (
                <Card key={item.id} className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-900">{item.label}</p>
                    <p className="text-xs text-ink-700/50">{item.description}</p>
                  </div>
                  <button
                    className="flex-none rounded-lg bg-ink-900/5 px-3 py-1.5 text-xs font-medium text-ink-900"
                    onClick={() => setServiceSheet({ open: true, kind: item.kind })}
                  >
                    {item.price > 0 ? formatINR(item.price) : 'Book'}
                  </button>
                </Card>
              ))}
            </div>
          </section>

          {/* Everything booked this stay */}
          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">
              Your Services{myRequests.length > 0 && <span className="ml-1.5 text-xs text-ink-700/40">({myRequests.length})</span>}
            </h2>
            {myRequests.length === 0 ? (
              <Card className="text-center text-sm text-ink-700/50">
                Nothing booked yet — restaurant, spa and cabs are a tap away.
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {myRequests.map((r) => (
                  <Card key={r.id} className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize text-ink-900">{r.type.replaceAll('_', ' ')}</p>
                      <p className="mt-0.5 text-xs text-ink-700/60">{r.details}</p>
                      <p className="mt-0.5 text-[11px] text-ink-700/40">{formatDate(r.createdAt)}</p>
                    </div>
                    <Badge tone={REQUEST_STATUS_TONE[r.status]}>
                      <span className="capitalize">{r.status.replace('_', ' ')}</span>
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <AiConciergePanel
            city={hotel.city}
            memory={guest.memory}
            onBookTransport={() => setServiceSheet({ open: true, kind: 'transport' })}
          />

          <NextTripPanel city={hotel.city} memory={guest.memory} />
        </div>
      </div>

      {/* Keyed on the kind so opening it from a specific suggestion lands on that tab. */}
      <ServiceBookingSheet
        key={serviceSheet.kind ?? 'all'}
        open={serviceSheet.open}
        onClose={() => setServiceSheet({ open: false })}
        booking={booking}
        guest={guest}
        initialKind={serviceSheet.kind}
      />
    </div>
  );
}
