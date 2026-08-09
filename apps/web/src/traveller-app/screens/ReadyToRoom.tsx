import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { intentTemplateById } from '@ayana/ai-engine';
import { Badge, Button, Card, PageHeader, ProgressSteps } from '@ayana/shared-ui';
import { formatDate, formatINR } from '@ayana/shared-utils';
import { useBooking, useCurrentGuest, useHotel } from '../hooks';
import { AiConciergePanel } from '../components/AiConciergePanel';
import { AnaIqMark } from '../components/AnaIqMark';
import { NextTripPanel } from '../components/NextTripPanel';
import { IdentityVerificationSheet } from './IdentityVerificationSheet';

const BED_LABEL: Record<string, string> = { twin: 'Twin beds', double: 'Double bed', king: 'King bed' };

export function ReadyToRoom() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(bookingId);
  const hotel = useHotel(booking?.hotelId);
  const guest = useCurrentGuest();
  const updateReadyToRoom = useSimulationStore((s) => s.updateReadyToRoom);
  const [busy, setBusy] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  if (!booking || !hotel || !guest) return null;

  const rtr = booking.readyToRoom;
  // Booking ends at the QR — room allocation and the actual check-in now belong to the Kiosk.
  const bookingComplete = rtr.paymentVerified && rtr.identityVerified && Boolean(rtr.qrCode);

  const nights = Math.max(
    1,
    Math.round((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86_400_000),
  );
  const balanceDue = Math.max(0, booking.totalAmount - booking.amountPaid);

  const memory = guest.memory;
  const requests: string[] = [
    ...memory.specialRequests,
    ...memory.accessibilityNeeds,
    memory.dietaryPreference !== 'no_preference' ? `${memory.dietaryPreference.replace('_', ' ')} meals` : '',
    memory.smokingPreference === 'non_smoking' ? 'Non-smoking room' : 'Smoking room',
    memory.pillowType !== 'no_preference' ? `${memory.pillowType} pillows` : '',
    memory.roomTemperatureC ? `Room set to ${memory.roomTemperatureC}°C` : '',
    memory.preferredView ? `${memory.preferredView.replace('_', ' ')} view preferred` : '',
    memory.airportPickupPreferred ? 'Airport pickup' : '',
  ].filter(Boolean);

  function issueKey() {
    setBusy(true);
    setTimeout(() => {
      updateReadyToRoom(booking!.id, {
        keyPathReady: true,
        qrCode: `AYANA-${booking!.id}`,
        estimatedArrival: booking!.checkInDate,
      });
      setBusy(false);
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader
          title={bookingComplete ? 'Your Booking' : 'Ready-to-Room'}
          subtitle={hotel.name}
          onBack={() => navigate('/traveller/trips')}
        />

        <div className="flex flex-col gap-5 px-5">
          {!bookingComplete && (
            <Card>
              <ProgressSteps
                steps={[
                  { key: 'pay', label: 'Payment verified', done: rtr.paymentVerified },
                  { key: 'id', label: 'Identity verified', done: rtr.identityVerified },
                  { key: 'key', label: 'Key / QR issued', done: Boolean(rtr.qrCode) },
                ]}
              />
            </Card>
          )}

          {!rtr.identityVerified && (
            <Button variant="secondary" onClick={() => setVerifyOpen(true)}>
              Verify Identity (Government ID + Selfie)
            </Button>
          )}

          <IdentityVerificationSheet
            open={verifyOpen}
            guestName={guest.fullName}
            guestsCount={booking.guestsCount}
            onClose={() => setVerifyOpen(false)}
            onVerified={() => updateReadyToRoom(booking.id, { identityVerified: true })}
          />

          {rtr.identityVerified && rtr.paymentVerified && !rtr.qrCode && (
            <Button variant="secondary" disabled={busy} onClick={issueKey}>
              {busy ? 'Issuing key…' : 'Issue Mobile Key / QR'}
            </Button>
          )}

          {rtr.qrCode && (
            <Card className="flex flex-col items-center gap-2 text-center">
              <p className="text-xs uppercase tracking-wide text-ink-700/50">Show this at the kiosk or access point</p>
              <QRCodeSVG value={rtr.qrCode} size={160} fgColor="#0A0F1C" />
              <p className="text-xs text-ink-700/40">{rtr.qrCode}</p>
              <Badge tone="neutral">Room number available at check-in</Badge>
            </Card>
          )}

          {bookingComplete && (
            <>
              <Card>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">Your Stay</p>
                <DetailRow label="Check-in" value={formatDate(booking.checkInDate)} />
                <DetailRow label="Check-out" value={formatDate(booking.checkOutDate)} />
                <DetailRow label="Duration" value={`${nights} night${nights === 1 ? '' : 's'}`} />
                <DetailRow label="Guests" value={String(booking.guestsCount)} />
                <DetailRow
                  label="Room"
                  value={`${booking.roomCategory}${booking.expectedBedType ? ` · ${BED_LABEL[booking.expectedBedType]}` : ''}${
                    booking.expectedView ? ` · ${booking.expectedView.replace('_', ' ')} view` : ''
                  }`}
                />
              </Card>

              <Card>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">Payment</p>
                <DetailRow label="Total" value={formatINR(booking.totalAmount)} />
                <DetailRow label={`Paid (${booking.paymentTier}%)`} value={formatINR(booking.amountPaid)} />
                {balanceDue > 0 ? (
                  <>
                    <div className="mt-1 flex justify-between border-t border-ink-900/10 pt-2 text-sm font-semibold text-amber-700">
                      <span>Due at check-in</span>
                      <span>{formatINR(balanceDue)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-ink-700/50">
                      Settle this at the kiosk before your room is allotted.
                    </p>
                  </>
                ) : (
                  <div className="mt-1 flex justify-between border-t border-ink-900/10 pt-2 text-sm font-semibold text-springs-600">
                    <span>Balance</span>
                    <span>Fully paid</span>
                  </div>
                )}
              </Card>

              {requests.length > 0 && (
                <Card>
                  <p className="mb-2 text-xs uppercase tracking-wide text-ink-700/50">
                    Your Preferences <span className="text-gold-600">· from AYANA Memory</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {requests.map((r) => (
                      <Badge key={r} tone="neutral">
                        <span className="capitalize">{r}</span>
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-ink-700/50">Shared with {hotel.name} ahead of your arrival.</p>
                </Card>
              )}

              <Card className="bg-springs-500/5 text-center">
                <p className="text-sm font-medium text-springs-600">You’re all set</p>
                <p className="mt-1 text-xs text-ink-700/60">
                  Scan this QR at the hotel kiosk to check in and collect your key. Your room number is assigned then.
                </p>
              </Card>

              {(() => {
                const primaryIntent = booking.intents.find((i) => i.role === 'primary');
                const template = primaryIntent ? intentTemplateById(primaryIntent.templateId) : undefined;
                if (!template && !booking.journeyGoal) return null;
                return (
                  <Card className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-ink-700/50">Ready for you</p>
                      <AnaIqMark />
                    </div>
                    <p className="text-sm text-ink-900">
                      {template
                        ? `Welcome back, ${guest.fullName.split(' ')[0]} — everything's lined up for your ${template.label.toLowerCase()}.`
                        : `Welcome back, ${guest.fullName.split(' ')[0]} — we've got your stay ready to go.`}
                    </p>
                  </Card>
                );
              })()}

              <Button variant="ghost" fullWidth onClick={() => navigate(`/traveller/manage/${booking.id}`)}>
                ⚙️ Manage / Cancel Booking
              </Button>

              <AiConciergePanel city={hotel.city} memory={guest.memory} />

              <NextTripPanel city={hotel.city} memory={guest.memory} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-sm">
      <span className="text-ink-700/60">{label}</span>
      <span className="font-medium capitalize text-ink-900">{value}</span>
    </div>
  );
}
