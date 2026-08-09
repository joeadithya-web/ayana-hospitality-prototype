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

  function handleSendOtp() {
    if (!identifier.trim()) return;
    setPendingGuestId(personas[0]?.id ?? guests[0]?.id ?? null);
    setStage('otp');
    setOtpError(false);
  }

  function handleVerifyOtp() {
    if (otp.trim().length < 4 || !pendingGuestId) return;
    if (activeFailureScenario === 'otp_failure') {
      setOtpError(true);
      setOtp('');
      return;
    }
    login(pendingGuestId);
    navigate('/traveller/dashboard');
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
            <Card
              padded
              className="flex cursor-pointer items-center gap-3 border-dashed border-gold-500/40 bg-gold-500/5"
              onClick={() => navigate('/traveller/register?guestId=guest_demo_newcomer')}
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold-500/15 text-lg">✨</span>
              <div className="flex-1 text-left">
                <p className="font-medium text-ink-900">New Guest</p>
                <p className="text-xs text-ink-700/50">Start your AYANA journey — tell us about you</p>
              </div>
              <span className="text-ink-700/40">→</span>
            </Card>
          </div>

          <div className="flex items-center gap-3 text-xs text-ink-700/40">
            <div className="h-px flex-1 bg-ink-900/10" />
            or continue with email / mobile
            <div className="h-px flex-1 bg-ink-900/10" />
          </div>

          <TextField label="Email or mobile number" placeholder="you@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
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
