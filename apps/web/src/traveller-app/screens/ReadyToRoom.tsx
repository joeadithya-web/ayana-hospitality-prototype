import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSimulationStore } from '@ayana/simulation-engine';
import { evaluateRoomAllocation } from '@ayana/ai-engine';
import { Badge, Button, Card, PageHeader, ProgressSteps } from '@ayana/shared-ui';
import { formatDate } from '@ayana/shared-utils';
import { useBooking, useCurrentGuest, useHotel, useRoom } from '../hooks';
import { IdentityVerificationSheet } from './IdentityVerificationSheet';

export function ReadyToRoom() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(bookingId);
  const hotel = useHotel(booking?.hotelId);
  const room = useRoom(booking?.roomId);
  const guest = useCurrentGuest();
  const allBookings = useSimulationStore((s) => s.bookings);
  const allRooms = useSimulationStore((s) => s.rooms);
  const updateReadyToRoom = useSimulationStore((s) => s.updateReadyToRoom);
  const checkInGuest = useSimulationStore((s) => s.checkInGuest);
  const autoAllocateRoom = useSimulationStore((s) => s.autoAllocateRoom);
  const markDelayed = useSimulationStore((s) => s.markDelayed);
  const markOverbooked = useSimulationStore((s) => s.markOverbooked);
  const [busy, setBusy] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // Reactively try to allocate a room the moment identity + payment are verified, and keep
  // retrying (e.g. once Housekeeping frees a room in another tab) until it succeeds.
  useEffect(() => {
    if (!booking || !guest) return;
    if (booking.allocationStatus === 'allocated') return;
    if (!booking.readyToRoom.identityVerified || !booking.readyToRoom.paymentVerified) return;

    const result = evaluateRoomAllocation(booking, allBookings, allRooms, guest);
    if (result.kind === 'allocate') {
      autoAllocateRoom(booking.id, result.room.id);
    } else if (result.kind === 'delayed' && booking.allocationStatus !== 'delayed') {
      markDelayed(booking.id);
    } else if (result.kind === 'overbooked' && booking.allocationStatus !== 'overbooked') {
      markOverbooked(booking.id);
    }
  }, [booking, guest, allBookings, allRooms, autoAllocateRoom, markDelayed, markOverbooked]);

  if (!booking || !hotel || !guest) return null;

  const rtr = booking.readyToRoom;
  const needsPickup = guest.memory.airportPickupPreferred;
  const allDone = rtr.identityVerified && rtr.paymentVerified && rtr.roomReady && rtr.keyPathReady && (!needsPickup || rtr.pickupConfirmed);

  function simulate(step: string, action: () => void, delay = 1000) {
    setBusy(step);
    setTimeout(() => {
      action();
      setBusy(null);
    }, delay);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      <div className="mx-auto max-w-md">
        <PageHeader title="Ready-to-Room" subtitle={hotel.name} onBack={() => navigate('/traveller/trips')} />

        <div className="flex flex-col gap-5 px-5">
          <Card>
            <ProgressSteps
              steps={[
                { key: 'pay', label: 'Payment verified', done: rtr.paymentVerified },
                { key: 'id', label: 'Identity verified', done: rtr.identityVerified },
                { key: 'room', label: 'Room ready', done: rtr.roomReady },
                { key: 'key', label: 'Key / QR issued', done: rtr.keyPathReady },
                ...(needsPickup ? [{ key: 'pickup', label: 'Pickup confirmed', done: rtr.pickupConfirmed }] : []),
              ]}
            />
          </Card>

          {!rtr.identityVerified && (
            <Button variant="secondary" onClick={() => setVerifyOpen(true)}>
              Verify Identity (Government ID + Selfie)
            </Button>
          )}

          <IdentityVerificationSheet
            open={verifyOpen}
            guestName={guest.fullName}
            onClose={() => setVerifyOpen(false)}
            onVerified={() => updateReadyToRoom(booking.id, { identityVerified: true })}
          />

          {rtr.identityVerified && rtr.paymentVerified && booking.allocationStatus === 'delayed' && (
            <Card className="border-amber-300 bg-amber-50">
              <p className="text-sm font-medium text-amber-800">Your room is being prepared</p>
              <p className="mt-1 text-xs text-amber-700/80">
                Housekeeping is finishing an outgoing guest's room in your category. You'll be moved to Room Ready the
                moment it's done — no action needed.
              </p>
            </Card>
          )}

          {rtr.identityVerified && rtr.paymentVerified && booking.allocationStatus === 'overbooked' && (
            <Card className="border-red-300 bg-red-50">
              <p className="text-sm font-medium text-red-700">Finalising your room</p>
              <p className="mt-1 text-xs text-red-600/80">
                Your category is fully booked for these dates. Our Front Office team is arranging your room — possibly
                a complimentary upgrade — and will confirm shortly.
              </p>
            </Card>
          )}

          {rtr.roomReady && !rtr.keyPathReady && (
            <Button
              variant="secondary"
              disabled={busy === 'key'}
              onClick={() =>
                simulate('key', () =>
                  updateReadyToRoom(booking.id, { keyPathReady: true, qrCode: `AYANA-${booking.id}`, estimatedArrival: booking.checkInDate }),
                )
              }
            >
              {busy === 'key' ? 'Issuing key…' : 'Issue Mobile Key / QR'}
            </Button>
          )}

          {needsPickup && rtr.keyPathReady && !rtr.pickupConfirmed && (
            <Button
              variant="ghost"
              disabled={busy === 'pickup'}
              onClick={() => simulate('pickup', () => updateReadyToRoom(booking.id, { pickupConfirmed: true }))}
            >
              {busy === 'pickup' ? 'Confirming…' : 'Confirm Airport Pickup'}
            </Button>
          )}

          {rtr.qrCode && (
            <Card className="flex flex-col items-center gap-2 text-center">
              <p className="text-xs uppercase tracking-wide text-ink-700/50">Show this at the kiosk or access point</p>
              <QRCodeSVG value={rtr.qrCode} size={160} fgColor="#0A0F1C" />
              <p className="text-xs text-ink-700/40">{rtr.qrCode}</p>
              {room && (
                <Badge tone="gold">
                  Room {room.roomNumber} · Floor {room.floor}
                </Badge>
              )}
              {rtr.estimatedArrival && <Badge tone="neutral">Est. arrival {formatDate(rtr.estimatedArrival)}</Badge>}
            </Card>
          )}

          {allDone && (
            <Button
              size="lg"
              onClick={() => {
                checkInGuest(booking.id);
                navigate(`/traveller/stay/${booking.id}`);
              }}
            >
              Enter Your Room
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
