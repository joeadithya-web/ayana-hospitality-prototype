export interface FeatureGuideEntry {
  name: string;
  description: string;
}

/**
 * The permanent, plain-text guide to what AnA IQ actually does — kept as data, not JSX, so
 * closing this initiative out later is a data edit here, not a UI rewrite. Only lists what's
 * really built in this branch; nothing aspirational belongs in this list.
 */
export const ANA_IQ_LIVE_FEATURES: FeatureGuideEntry[] = [
  { name: 'AnA IQ Identity', description: 'One consistent name and mark across every AI touchpoint — booking, check-in, in-stay, checkout.' },
  { name: 'Journey Goal Chat', description: 'Booking-time conversation capturing what would make the trip successful, with specific (not generic) follow-ups.' },
  { name: 'Readiness Brief', description: 'Pre-arrival card summarising what has already been arranged, in plain language.' },
  { name: 'No-Surprise-You Welcome', description: "Check-in greeting that references the guest's stated purpose for the trip." },
  { name: 'Proactive Suggestions', description: 'In-stay nudges (e.g. wake-up call before checkout, spa slot for a wellness trip) — one tap to accept, always staff-attributed.' },
  { name: 'Ask the Concierge', description: 'In-stay chat answering questions about the bill, services, and local recommendations from live data.' },
  { name: 'Checkout Feedback Chat', description: 'Customer Satisfaction Index capture in the same conversational shape as the rest of AnA IQ.' },
  { name: 'AnA IQ Remembers You', description: 'Returning-guest banner at booking pulling real AYANA Memory preferences forward.' },
  { name: 'Correction Affordance', description: '"Not quite — tell AnA IQ" on every suggestion, so a wrong guess is a quick conversation, not a dead end.' },
  { name: 'Arranged For Your Trip', description: "Plain, finished-only list of what's been arranged — never a checklist or percentage." },
  { name: 'Celebration Manager', description: 'Structured booking for birthdays, anniversaries and surprise arrangements.' },
  { name: 'Experience Planner', description: 'Bookable tours and activities around the property.' },
  { name: 'Family Companion', description: 'Kid-friendly activity suggestions for guests travelling with children.' },
  { name: 'Meeting Assistant', description: 'Optional meeting-time capture for business trips, passed to the front desk.' },
  { name: 'Document Vault', description: 'One place to find vouchers and mobile keys across every stay.' },
  { name: 'Expense Tracker', description: 'Categorised spend across all of a guest’s stays.' },
  { name: 'Weather Intelligence (Simulated)', description: 'Deterministic, seeded forecast driving simple in-stay suggestions — no live weather API.' },
  { name: 'Room Controls (Simulated)', description: 'Lights / AC / curtains toggle UI — demo only, no real in-room hardware connection.' },
  { name: 'Learn My Preferences', description: 'Notices a request made twice or more and offers to save it to AYANA Memory — rule-based, not machine learning.' },
];

/**
 * Explicitly future scope — either reopens a guest-facing-scoring decision made deliberately
 * earlier in this project, or needs real infrastructure (live APIs, auth/security) this
 * simulated prototype doesn't have. Never claimed as live.
 */
export const ANA_IQ_PROPOSED_FEATURES: FeatureGuideEntry[] = [
  { name: 'Guest-Facing Journey Dashboard', description: 'My Journey / Today’s Mission / Intent Progress — pending a separate product decision on showing AI scoring to guests directly.' },
  { name: 'Multi-Language Assistant', description: 'Real-time translation — needs a live translation API or LLM integration and security review.' },
  { name: 'Live Weather API', description: 'Replace the simulated forecast with a real weather data provider integration.' },
  { name: 'Real Room IoT Controls', description: 'Connect Room Controls to actual in-room hardware — needs a hotel IoT/BMS integration and security hardening.' },
  { name: 'Expanded Trip Modes', description: 'Business / Leisure / Family / Medical / Relax as first-class categories — needs an intent-taxonomy change across booking, engine and mock data.' },
  { name: 'Emergency Assist', description: 'Real emergency contact routing — needs a duty-of-care and liability review beyond this demo.' },
];
