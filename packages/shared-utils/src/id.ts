let counter = 0;

/** Deterministic-ish id generator: prefix + monotonic counter, stable across a session. */
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter.toString(36)}${Date.now().toString(36).slice(-4)}`;
}

/** Mock transaction/QR reference in a bank-statement-like format, clearly not a real payment rail id. */
export function makeMockRef(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-MOCK-${random}`;
}
