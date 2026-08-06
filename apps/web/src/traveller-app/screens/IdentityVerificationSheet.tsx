import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Sheet } from '@ayana/shared-ui';

type Step = 'id' | 'selfie';

interface IdentityVerificationSheetProps {
  open: boolean;
  guestName: string;
  onClose: () => void;
  onVerified: () => void;
}

export function IdentityVerificationSheet({ open, guestName, onClose, onVerified }: IdentityVerificationSheetProps) {
  const [step, setStep] = useState<Step>('id');
  const [scanning, setScanning] = useState(false);
  const [idScanned, setIdScanned] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('id');
      setScanning(false);
      setIdScanned(false);
      setCaptured(false);
      setCameraError(false);
    }
  }, [open]);

  useEffect(() => {
    if (step !== 'selfie' || !open) return;

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
  }, [step, open]);

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
    onVerified();
    onClose();
  }

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
          <p className="text-center text-xs text-ink-700/60">
            Position your government ID in frame. We only extract what's needed to verify your booking.
          </p>
          <Button fullWidth disabled={scanning || idScanned} onClick={scanId}>
            {scanning ? 'Scanning…' : idScanned ? 'ID Verified ✓' : 'Scan Government ID'}
          </Button>
        </div>
      )}

      {step === 'selfie' && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-4 border-gold-500 bg-ink-900">
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
              : 'Look at the camera and hold still for liveness verification.'}
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
        </div>
      )}
    </Sheet>
  );
}
