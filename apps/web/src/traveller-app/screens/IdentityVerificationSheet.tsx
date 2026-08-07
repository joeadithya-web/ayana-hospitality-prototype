import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge, Button, Sheet } from '@ayana/shared-ui';

type Step = 'id' | 'selfie';
/** How the visiting guest's face gets on file when the booker isn't the one travelling. */
type ProxyChoice = 'kiosk_qr' | 'upload_photo';

interface IdentityVerificationSheetProps {
  open: boolean;
  guestName: string;
  /** Drives the multi-member ID copy — a 3-guest booking needs all three IDs uploaded. */
  guestsCount: number;
  onClose: () => void;
  onVerified: () => void;
}

export function IdentityVerificationSheet({
  open,
  guestName,
  guestsCount,
  onClose,
  onVerified,
}: IdentityVerificationSheetProps) {
  const [step, setStep] = useState<Step>('id');
  const [scanning, setScanning] = useState(false);
  const [idScanned, setIdScanned] = useState(false);
  const [uploadedIds, setUploadedIds] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [bookingForSomeoneElse, setBookingForSomeoneElse] = useState(false);
  const [proxyChoice, setProxyChoice] = useState<ProxyChoice | null>(null);
  const [proxyPhotoUploaded, setProxyPhotoUploaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('id');
      setScanning(false);
      setIdScanned(false);
      setUploadedIds(false);
      setCaptured(false);
      setCameraError(false);
      setBookingForSomeoneElse(false);
      setProxyChoice(null);
      setProxyPhotoUploaded(false);
    }
  }, [open]);

  useEffect(() => {
    // Skip the camera entirely once the booker has said they aren't the one travelling.
    if (step !== 'selfie' || !open || bookingForSomeoneElse) return;

    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError(true));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step, open, bookingForSomeoneElse]);

  function uploadIds() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setUploadedIds(true);
      setIdScanned(true);
      setTimeout(() => setStep('selfie'), 700);
    }, 1400);
  }

  function scanId() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setIdScanned(true);
      setTimeout(() => setStep('selfie'), 700);
    }, 1600);
  }

  function captureSelfie() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCaptured(true);
  }

  function finish() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onVerified();
    onClose();
  }

  const proxyReady = proxyChoice === 'kiosk_qr' || (proxyChoice === 'upload_photo' && proxyPhotoUploaded);

  return (
    <Sheet open={open} onClose={onClose} title="Verify Your Identity">
      {step === 'id' && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-xs overflow-hidden rounded-xl2 border border-ink-900/10 bg-ink-950 p-4 text-cream-50">
            <p className="text-[10px] uppercase tracking-widest text-gold-400">Government ID</p>
            <p className="mt-3 font-display text-lg font-semibold">{guestName}</p>
            <p className="mt-1 text-xs text-cream-50/50">ID No. •••• •••• 4821</p>
            {scanning && (
              <motion.div
                className="absolute inset-x-0 h-1 bg-gold-400/80"
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
              />
            )}
            {idScanned && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/80">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-springs-500 text-lg text-white">✓</span>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <Button fullWidth variant="secondary" disabled={scanning || idScanned} onClick={uploadIds}>
              {uploadedIds ? 'IDs Uploaded ✓' : 'Demo: Upload Government ID + Address Proof'}
            </Button>
            <p className="text-center text-[11px] text-ink-700/50">
              {guestsCount > 1
                ? `Upload all ${guestsCount} members’ IDs — every guest staying needs one on file.`
                : 'Upload all members’ IDs — every guest staying needs one on file.'}
            </p>
          </div>

          <div className="flex w-full items-center gap-2 text-[11px] uppercase tracking-wide text-ink-700/30">
            <span className="h-px flex-1 bg-ink-900/10" />
            or
            <span className="h-px flex-1 bg-ink-900/10" />
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <Button fullWidth disabled={scanning || idScanned} onClick={scanId}>
              {scanning ? 'Scanning…' : idScanned && !uploadedIds ? 'ID Verified ✓' : 'Scan Government ID'}
            </Button>
            <p className="text-center text-[11px] text-ink-700/50">
              Position your government ID in frame. We only extract what’s needed to verify your booking.
            </p>
          </div>
        </div>
      )}

      {step === 'selfie' && (
        <div className="flex flex-col items-center gap-4">
          {!bookingForSomeoneElse ? (
            <>
              <div className="relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-4 border-gold-500 bg-ink-900">
                {!cameraError ? (
                  <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" />
                ) : (
                  <span className="text-4xl">🧑</span>
                )}
                {captured && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-springs-500 text-xl text-white">✓</span>
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-ink-700/60">
                {cameraError
                  ? 'Camera unavailable — using simulated liveness check.'
                  : `Only the primary guest (${guestName.split(' ')[0]}) needs to be scanned, even for a group booking.`}
              </p>
              {!captured ? (
                <Button fullWidth onClick={captureSelfie}>
                  Capture Selfie
                </Button>
              ) : (
                <Button fullWidth variant="secondary" onClick={finish}>
                  Identity Verified — Continue
                </Button>
              )}
            </>
          ) : (
            <div className="flex w-full flex-col gap-3">
              <p className="text-center text-xs text-ink-700/60">
                No problem — the person actually staying needs to be identified instead. Choose how:
              </p>

              <button
                onClick={() => setProxyChoice('kiosk_qr')}
                className={`rounded-xl2 border px-4 py-3 text-left ${
                  proxyChoice === 'kiosk_qr' ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/10'
                }`}
              >
                <p className="text-sm font-medium text-ink-900">Present the QR code at the hotel kiosk</p>
                <p className="mt-0.5 text-xs text-ink-700/50">
                  The guest scans their own face at the kiosk on arrival. Nothing more to do now.
                </p>
              </button>

              <button
                onClick={() => setProxyChoice('upload_photo')}
                className={`rounded-xl2 border px-4 py-3 text-left ${
                  proxyChoice === 'upload_photo' ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/10'
                }`}
              >
                <p className="text-sm font-medium text-ink-900">Upload a photo of the visiting guest</p>
                <p className="mt-0.5 text-xs text-ink-700/50">Their face is matched against this photo on arrival.</p>
              </button>

              {proxyChoice === 'upload_photo' && (
                <div className="flex flex-col gap-2 rounded-xl2 border border-amber-300 bg-amber-50 p-3">
                  <Badge tone="warning">Subject to manual verification by hotel staff</Badge>
                  <p className="text-[11px] text-amber-800/80">
                    An uploaded photo can’t be liveness-checked, so Front Office will confirm the guest’s ID in person at
                    arrival. Check-in may take slightly longer.
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => setProxyPhotoUploaded(true)}>
                    {proxyPhotoUploaded ? 'Photo Uploaded ✓' : 'Demo: Upload Guest Photo'}
                  </Button>
                </div>
              )}

              <Button fullWidth variant="secondary" disabled={!proxyReady} onClick={finish}>
                Continue
              </Button>
            </div>
          )}

          <label className="flex w-full cursor-pointer items-start gap-2 rounded-lg bg-ink-900/[0.03] px-3 py-2.5">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={bookingForSomeoneElse}
              onChange={(e) => {
                setBookingForSomeoneElse(e.target.checked);
                setProxyChoice(null);
                setProxyPhotoUploaded(false);
                setCaptured(false);
              }}
            />
            <span className="text-xs text-ink-700/70">
              I’m booking for someone else — I won’t be the one staying
            </span>
          </label>
        </div>
      )}
    </Sheet>
  );
}
