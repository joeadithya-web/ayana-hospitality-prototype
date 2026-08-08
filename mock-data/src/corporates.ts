import type { CorporateAccount } from '@ayana/shared-types';

/**
 * Demo corporate accounts. Each stands for a signed AYANA agreement, so the app can show
 * contracted rates and wire-transfer settlement without any real company or banking data.
 */
export function generateCorporates(): CorporateAccount[] {
  return [
    {
      id: 'corp_meridian_tech',
      name: 'Meridian Technologies',
      code: 'MERIDIAN-TECH',
      industry: 'Software & IT Services',
      logoEmoji: '💻',
      contractRef: 'AYANA/CORP/2026/0142',
      negotiatedDiscountPercent: 15,
      wireTransferEnabled: true,
      creditLimitINR: 2_500_000,
      billingEmail: 'travel.desk@meridiantech.example',
      settlementTerms: 'Net 30',
    },
    {
      id: 'corp_sterling_consult',
      name: 'Sterling Consulting Group',
      code: 'STERLING-CG',
      industry: 'Management Consulting',
      logoEmoji: '📊',
      contractRef: 'AYANA/CORP/2026/0087',
      negotiatedDiscountPercent: 12,
      wireTransferEnabled: true,
      creditLimitINR: 1_200_000,
      billingEmail: 'accounts@sterlingcg.example',
      settlementTerms: 'Net 45',
    },
    {
      id: 'corp_northwind_pharma',
      name: 'Northwind Pharmaceuticals',
      code: 'NORTHWIND-PH',
      industry: 'Pharmaceuticals',
      logoEmoji: '🧪',
      contractRef: 'AYANA/CORP/2026/0219',
      negotiatedDiscountPercent: 10,
      // Agreement signed, banking details still being verified — shows the pre-wire state.
      wireTransferEnabled: false,
      creditLimitINR: 800_000,
      billingEmail: 'finance@northwindpharma.example',
      settlementTerms: 'Net 30',
    },
  ];
}
