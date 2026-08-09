import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimulationStore } from '@ayana/simulation-engine';
import type { BusinessLeisure, DietaryPreference, FamilyMember } from '@ayana/shared-types';
import { Button, Card, TextField } from '@ayana/shared-ui';

const INTERESTS = [
  'Wellness & Spa',
  'Fine Dining',
  'Adventure',
  'Business & Networking',
  'Culture & Heritage',
  'Family Activities',
  'Shopping',
  'Nightlife',
];

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];

/**
 * The moment a first-time guest opens the app: a short, low-friction profile capture that
 * becomes their AYANA Memory from day one — family, interests, a couple of quick preferences.
 * Every field here is optional; modalities like mandatory ID/email can be decided later.
 */
export function Registration() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const guestId = params.get('guestId') ?? 'guest_demo_newcomer';
  const registerGuest = useSimulationStore((s) => s.registerGuest);
  const login = useSimulationStore((s) => s.login);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('no_preference');
  const [businessOrLeisure, setBusinessOrLeisure] = useState<BusinessLeisure>('mixed');

  function toggleInterest(interest: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(interest)) next.delete(interest);
      else next.add(interest);
      return next;
    });
  }

  function addFamilyMember() {
    setFamilyMembers((prev) => [...prev, { name: '', relationship: RELATIONSHIPS[0] ?? 'Other' }]);
  }

  function updateFamilyMember(index: number, patch: Partial<FamilyMember>) {
    setFamilyMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function removeFamilyMember(index: number) {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    registerGuest({
      guestId,
      fullName: fullName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      familyMembers: familyMembers.filter((m) => m.name.trim().length > 0),
      interests: Array.from(interests),
      dietaryPreference,
      businessOrLeisure,
    });
    login(guestId);
    navigate('/traveller/dashboard');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10 pb-16">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Welcome to AYANA</h1>
        <p className="text-sm text-ink-700/60">
          A few details help us take care of you from the moment you arrive. Everything here is optional.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <TextField label="Full name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextField label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Mobile number" placeholder="+91 …" value={mobile} onChange={(e) => setMobile(e.target.value)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Travelling with anyone?</span>
          <button type="button" className="text-xs font-medium text-gold-600" onClick={addFamilyMember}>
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {familyMembers.map((member, i) => (
            <Card key={i} className="flex items-center gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-ink-900/15 px-2.5 py-2 text-sm"
                placeholder="Name"
                value={member.name}
                onChange={(e) => updateFamilyMember(i, { name: e.target.value })}
              />
              <select
                className="rounded-lg border border-ink-900/15 px-2 py-2 text-sm"
                value={member.relationship}
                onChange={(e) => updateFamilyMember(i, { relationship: e.target.value })}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button type="button" className="flex-none text-ink-700/40" onClick={() => removeFamilyMember(i)}>
                ✕
              </button>
            </Card>
          ))}
          {familyMembers.length === 0 && <p className="text-xs text-ink-700/40">No companions added — you can add them anytime.</p>}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-700/60">What are you into?</span>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                interests.has(interest) ? 'border-ink-950 bg-ink-950 text-cream-50' : 'border-ink-900/15 text-ink-700/60'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Dietary preference</span>
          <select
            className="rounded-lg border border-ink-900/15 px-3 py-2.5 text-sm"
            value={dietaryPreference}
            onChange={(e) => setDietaryPreference(e.target.value as DietaryPreference)}
          >
            {(['vegetarian', 'non_vegetarian', 'vegan', 'jain', 'no_preference'] as DietaryPreference[]).map((v) => (
              <option key={v} value={v}>
                {v.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">Mostly travelling for</span>
          <select
            className="rounded-lg border border-ink-900/15 px-3 py-2.5 text-sm"
            value={businessOrLeisure}
            onChange={(e) => setBusinessOrLeisure(e.target.value as BusinessLeisure)}
          >
            {(['business', 'leisure', 'mixed'] as BusinessLeisure[]).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Card>
        <p className="text-xs text-ink-700/50">
          These details become part of your AYANA Memory™ profile — you control what's shared with hotels, and can change
          it anytime.
        </p>
      </Card>

      <Button size="lg" fullWidth onClick={handleSubmit}>
        Start My AYANA Journey
      </Button>
    </div>
  );
}
