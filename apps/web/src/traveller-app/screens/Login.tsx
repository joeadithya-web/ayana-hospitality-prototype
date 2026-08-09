import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import { Avatar, Badge, Button, Card, TextField } from '@ayana/shared-ui';

const DEMO_PERSONA_IDS = ['guest_demo_business', 'guest_demo_family', 'guest_demo_international'];

export function Login() {
  const navigate = useNavigate();
  const guests = useSimulationStore((s) => s.guests);
  const login = useSimulationStore((s) => s.login);
  const activeFailureScenario = useSimulationStore((s) => s.activeFailureScenario);
  const personas = guests.filter((g) => DEMO_PERSONA_IDS.includes(g.id));

  const [identifier, setIdentifier] = useState('');
  const [stage, setStage] = useState<'identify' | 'otp'>('identify');
  const [otp, setOtp] = useState('');
  const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);

  function handleSelectPersona(guestId: string) {
    login(guestId);
    navigate('/traveller/dashboard');
  }

  // A phone/email that matches an existing guest is a returning sign-in. Anything else is
  // exactly what happens the moment a brand-new customer downloads the app — OTP-verify,
  // then complete a short profile that becomes their AYANA Memory from day one.
  function findGuestByIdentifier(value: string) {
    const needle = value.trim().toLowerCase();
    return guests.find((g) => g.email.toLowerCase() === needle || g.mobile.replace(/\s+/g, '') === needle.replace(/\s+/g, ''));
  }

  function handleSendOtp() {
    if (!identifier.trim()) return;
    setPendingGuestId(findGuestByIdentifier(identifier)?.id ?? null);
    setStage('otp');
    setOtpError(false);
  }

  function handleVerifyOtp() {
    if (otp.trim().length < 4) return;
    if (activeFailureScenario === 'otp_failure') {
      setOtpError(true);
      setOtp('');
      return;
    }
    if (pendingGuestId) {
      login(pendingGuestId);
      navigate('/traveller/dashboard');
    } else {
      // No match — this identifier has never signed up before.
      navigate(`/traveller/register?guestId=guest_demo_newcomer&identifier=${encodeURIComponent(identifier.trim())}`);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Welcome to AYANA</h1>
        <p className="text-sm text-ink-700/60">Sign in to continue your Home-to-Room journey.</p>
      </div>

      {stage === 'identify' && (
        <>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-700/50">Demo traveller profiles</p>
            {personas.map((guest) => (
              <Card key={guest.id} padded className="flex cursor-pointer items-center gap-3" onClick={() => handleSelectPersona(guest.id)}>
                <Avatar name={guest.fullName} />
                <div className="flex-1 text-left">
                  <p className="font-medium text-ink-900">{guest.fullName}</p>
                  <p className="text-xs text-ink-700/50 capitalize">{guest.profileType} · {guest.loyalty.tier} tier</p>
                </div>
                <span className="text-ink-700/40">→</span>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-ink-700/40">
            <div className="h-px flex-1 bg-ink-900/10" />
            or continue with email / mobile
            <div className="h-px flex-1 bg-ink-900/10" />
          </div>

          <TextField label="Email or mobile number" placeholder="you@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <p className="-mt-2 text-[11px] text-ink-700/40">New to AYANA? Enter your details above — we'll verify with an OTP and get your profile set up.</p>
          <Button onClick={handleSendOtp} fullWidth>Send OTP</Button>
        </>
      )}

      {stage === 'otp' && (
        <>
          <p className="text-sm text-ink-700/70">
            Simulated OTP sent to <span className="font-medium text-ink-900">{identifier}</span>. Enter any 4-6 digits to
            continue.
          </p>
          <TextField label="OTP" placeholder="••••" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
          {otpError && (
            <Badge tone="danger">Incorrect OTP. Please check the code and try again, or resend.</Badge>
          )}
          <Button onClick={handleVerifyOtp} fullWidth>Verify & Continue</Button>
          <div className="flex items-center justify-between">
            <button className="text-xs text-ink-700/50 underline" onClick={() => setStage('identify')}>
              Back
            </button>
            {otpError && (
              <button className="text-xs text-gold-600 underline" onClick={() => setOtpError(false)}>
                Resend OTP
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
