import { useState } from 'react';
import type { Guest, KioskFailureReason, PaymentMethod } from '@ayana/shared-types';
import { Badge, Button } from '@ayana/shared-ui';
import { formatINR } from '@ayana/shared-utils';

export const FAILURE_COPY: Record<KioskFailureReason, { title: string; body: string }> = {
  qr_invalid: { title: 'Reservation Not Found', body: 'This code doesn’t match a booking at this hotel. Please see Front Office for assistance.' },
  qr_expired: { title: 'Reservation Expired', body: 'Your stay dates have ended, so this code is no longer valid. Please see Front Office for assistance.' },
  qr_not_yet_valid: { title: 'Too Early to Check In', body: 'Your stay hasn’t started yet. Please come back on your check-in date, or see Front Office.' },
  payment_pending: { title: 'Payment Not Yet Verified', body: 'Your payment is still processing. Please see Front Office to complete your check-in.' },
  room_not_ready: { title: 'Room Being Prepared', body: 'Your room isn’t quite ready yet. Please have a seat — we’ll notify you shortly, or see Front Office.' },
  identity_failed: { title: 'Identity Verification Needed', body: 'We couldn’t confirm your identity. Please see Front Office with your ID.' },
  network_offline: { title: 'Network Unavailable', body: 'The kiosk has lost its connection. Please see Front Office to check in.' },
  pms_offline: { title: 'System Temporarily Unavailable', body: 'Our property system is briefly offline. Please see Front Office — your booking is safe.' },
  duplicate_check_in: { title: 'Already Checked In', body: 'This booking has already been checked in. If this seems wrong, please see Front Office.' },
};

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'upi', label: 'UPI', icon: '📲' },
  { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'wallet', label: 'Wallet Balance', icon: '👛' },
  { id: 'cash_front_desk', label: 'Cash at Front Desk', icon: '🏨' },
];

/** Reusable kiosk payment step — used for the check-in remaining-balance gate and check-out outstanding settlement. */
export function KioskPaymentStep({
  amountDue,
  onPaid,
  title = 'Complete Payment',
  helper,
}: {
  amountDue: number;
  onPaid: (method: PaymentMethod) => void;
  title?: string;
  helper?: string;
}) {
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  function pay() {
    setStatus('processing');
    setTimeout(() => {
      setStatus('done');
      setTimeout(() => onPaid(method), 700);
    }, 1100);
  }

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-4">
      <p className="font-display text-lg font-semibold text-cream-50">{title}</p>
      {helper && <p className="max-w-xs text-center text-xs text-cream-50/60">{helper}</p>}
      <div className="w-full rounded-xl2 border border-white/10 bg-white/5 px-5 py-4 text-center">
        <p className="text-xs uppercase tracking-wide text-cream-50/50">Amount due</p>
        <p className="font-display text-2xl font-semibold text-gold-300">{formatINR(amountDue)}</p>
        <p className="mt-1 text-[10px] text-cream-50/40">Simulated payment — no real gateway, no real charge</p>
      </div>
      {status !== 'done' ? (
        <>
          <div className="flex w-full flex-col gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm ${
                  method === m.id ? 'border-gold-500 bg-gold-500/10 text-cream-50' : 'border-white/15 text-cream-50/70'
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
          <Button fullWidth size="lg" disabled={status === 'processing'} onClick={pay}>
            {status === 'processing' ? 'Processing…' : `Pay ${formatINR(amountDue)}`}
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <span className="text-4xl">✅</span>
          <p className="text-sm text-springs-400">Payment complete</p>
        </div>
      )}
    </div>
  );
}

/** Shown atop every kiosk screen reached after a face/QR match — name + contact, never the room number. */
export function GuestIdentityHeader({ guest }: { guest: Guest }) {
  return (
    <div className="flex w-full flex-col items-center gap-1 rounded-xl2 border border-white/10 bg-white/5 px-5 py-4 text-center">
      <p className="font-display text-lg font-semibold text-cream-50">{guest.fullName}</p>
      <p className="text-xs text-cream-50/50">
        {guest.email} · {guest.mobile}
      </p>
      {guest.isVip && <Badge tone="gold">VIP Guest</Badge>}
    </div>
  );
}

/** Room number/floor stay hidden by default — guest must explicitly tap to reveal. */
export function RevealableRoom({ roomNumber, floor }: { roomNumber: string; floor: number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      onClick={() => setRevealed((r) => !r)}
      className="rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-300"
    >
      {revealed ? `Room ${roomNumber} · Floor ${floor}` : 'Room ●●● · Floor ● — tap to reveal'}
    </button>
  );
}

type FaceScanStatus = 'idle' | 'scanning' | 'matched' | 'no_match';

/**
 * Simulated face-match step, visually mirroring the selfie step of the booking-time
 * IdentityVerificationSheet. Whether the scan "matches" is driven by the Control Centre's
 * `identity_failure` scenario — same mechanism every other kiosk failure path uses — so this
 * stays a real, testable outcome rather than always succeeding.
 */
export function FaceScanStep({
  forceNoMatch,
  onMatched,
  onNoMatch,
  title = 'Look at the Camera',
  subtitle = 'Position your face in frame to check in.',
}: {
  forceNoMatch: boolean;
  onMatched: () => void;
  onNoMatch: () => void;
  title?: string;
  subtitle?: string;
}) {
  const [status, setStatus] = useState<FaceScanStatus>('idle');

  function scan() {
    setStatus('scanning');
    setTimeout(() => {
      if (forceNoMatch) {
        setStatus('no_match');
        setTimeout(onNoMatch, 1100);
      } else {
        setStatus('matched');
        setTimeout(onMatched, 900);
      }
    }, 1600);
  }

  return (
    <div className="mt-8 flex w-full flex-col items-center gap-4">
      <p className="font-display text-lg font-semibold text-cream-50">{title}</p>
      <p className="max-w-xs text-center text-sm text-cream-50/60">{subtitle}</p>
      <div className="relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-4 border-gold-500 bg-ink-900">
        <span className="text-5xl">🧑</span>
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          </div>
        )}
        {status === 'matched' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-springs-500 text-xl text-white">✓</span>
          </div>
        )}
        {status === 'no_match' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-xl text-white">✕</span>
          </div>
        )}
      </div>
      {status === 'idle' && (
        <Button size="lg" onClick={scan}>
          Scan My Face
        </Button>
      )}
      {status === 'scanning' && <p className="text-xs text-cream-50/50">Matching against your profile…</p>}
      {status === 'matched' && <p className="text-xs text-springs-400">Face matched — confirming your reservation…</p>}
      {status === 'no_match' && <p className="text-xs text-red-300">Face not recognised — switching to QR code…</p>}
    </div>
  );
}

/**
 * A short, searchable candidate list — the real (necessarily simulated, since there's no
 * actual biometric backend) mechanism by which a face match resolves to a specific
 * reservation. Reused for both check-in and check-out with a different candidate set.
 */
export function ReservationPicker<T extends { id: string; guestId: string }>({
  candidates,
  guestNameOf,
  labelOf,
  onSelect,
  emptyLabel = 'No matching reservations found at this hotel.',
}: {
  candidates: T[];
  guestNameOf: (item: T) => string;
  labelOf: (item: T) => string;
  onSelect: (item: T) => void;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = candidates.filter((c) => guestNameOf(c).toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-3">
      <p className="text-sm text-cream-50/70">Select your reservation to continue</p>
      {candidates.length > 5 && (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your name…"
          className="w-full rounded-lg border border-white/15 bg-ink-900 px-4 py-3 text-center text-sm text-cream-50"
        />
      )}
      <div className="flex w-full flex-col gap-2">
        {filtered.length === 0 && <p className="text-xs text-cream-50/40">{emptyLabel}</p>}
        {filtered.slice(0, 6).map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className="rounded-lg border border-white/15 bg-ink-900 px-4 py-2.5 text-left text-sm hover:bg-white/5"
          >
            {guestNameOf(c)}
            <span className="ml-2 text-xs text-cream-50/40">{labelOf(c)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
