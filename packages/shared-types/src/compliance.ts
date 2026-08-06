/**
 * Lightweight Compliance & Trust surface (added beyond the master build prompt,
 * per project decision, for pitch credibility). identityVerificationMethod is
 * always the generic form — never name a real government ID system (e.g. Aadhaar)
 * in UI copy or data.
 */
export interface ComplianceBadge {
  consentGiven: boolean;
  dataEncrypted: true;
  retentionPolicySummary: string;
  identityVerificationMethod: 'government_id_verification';
}
