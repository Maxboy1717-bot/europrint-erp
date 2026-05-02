/**
 * 10 ta HITL feature flag — ARCHITECTURE.md §7.6.
 * Faqat aniq lavozimlar bu funksiyalarni bajara oladi.
 */
export interface FeatureFlagSeed {
  positionCode: string;
  featureKey: string;
  isAllowed: true;
}

export const FEATURE_FLAGS_SEED: ReadonlyArray<FeatureFlagSeed> = [
  // 1. Xarid buyurtmasi > 50 mln UZS
  { positionCode: 'SUPPLY_HEAD',     featureKey: 'purchase.approve_high_value', isAllowed: true },
  { positionCode: 'TECH_DIRECTOR',   featureKey: 'purchase.approve_high_value', isAllowed: true },
  { positionCode: 'CEO',             featureKey: 'purchase.approve_high_value', isAllowed: true },
  { positionCode: 'OWNER',           featureKey: 'purchase.approve_high_value', isAllowed: true },

  // 2. To'lov > 100 mln UZS
  { positionCode: 'CHIEF_ACCOUNTANT', featureKey: 'finance.approve_payment', isAllowed: true },
  { positionCode: 'CEO',              featureKey: 'finance.approve_payment', isAllowed: true },
  { positionCode: 'OWNER',            featureKey: 'finance.approve_payment', isAllowed: true },

  // 3. Yangi yetkazib beruvchi
  { positionCode: 'TECH_DIRECTOR',    featureKey: 'mm.approve_new_vendor', isAllowed: true },
  { positionCode: 'SUPPLY_HEAD',      featureKey: 'mm.approve_new_vendor', isAllowed: true },
  { positionCode: 'OWNER',            featureKey: 'mm.approve_new_vendor', isAllowed: true },

  // 4. Bank rekvizitlari o'zgarishi
  { positionCode: 'CHIEF_ACCOUNTANT', featureKey: 'finance.change_bank_details', isAllowed: true },
  { positionCode: 'CEO',              featureKey: 'finance.change_bank_details', isAllowed: true },
  { positionCode: 'OWNER',            featureKey: 'finance.change_bank_details', isAllowed: true },

  // 5. Kredit limiti +20%
  { positionCode: 'CHIEF_ACCOUNTANT', featureKey: 'crm.approve_credit_limit', isAllowed: true },
  { positionCode: 'CEO',              featureKey: 'crm.approve_credit_limit', isAllowed: true },
  { positionCode: 'OWNER',            featureKey: 'crm.approve_credit_limit', isAllowed: true },

  // 6. Ishlab chiqarish rejasi o'zgarishi
  { positionCode: 'TECH_DIRECTOR',    featureKey: 'pp.modify_plan', isAllowed: true },
  { positionCode: 'CEO',              featureKey: 'pp.modify_plan', isAllowed: true },
  { positionCode: 'OWNER',            featureKey: 'pp.modify_plan', isAllowed: true },
  { positionCode: 'PRODUCTION_HEAD',  featureKey: 'pp.modify_plan', isAllowed: true },

  // 7. Narx chegirmasi > 10%
  { positionCode: 'SALES_HEAD',       featureKey: 'sd.approve_discount', isAllowed: true },
  { positionCode: 'CEO',              featureKey: 'sd.approve_discount', isAllowed: true },
  { positionCode: 'OWNER',            featureKey: 'sd.approve_discount', isAllowed: true },

  // 8. Avans istisnosi (70% qoidasidan)
  { positionCode: 'CEO',              featureKey: 'sd.advance_exception', isAllowed: true },
  { positionCode: 'OWNER',            featureKey: 'sd.advance_exception', isAllowed: true },

  // 9. Xodim yollash
  { positionCode: 'HR_HEAD',          featureKey: 'hr.approve_hire', isAllowed: true },
  { positionCode: 'ADMIN_DIRECTOR',   featureKey: 'hr.approve_hire', isAllowed: true },
  { positionCode: 'CEO',              featureKey: 'hr.approve_hire', isAllowed: true },

  // 10. Xodim ishdan bo'shatish
  { positionCode: 'HR_HEAD',          featureKey: 'hr.approve_dismiss', isAllowed: true },
  { positionCode: 'ADMIN_DIRECTOR',   featureKey: 'hr.approve_dismiss', isAllowed: true },
  { positionCode: 'CEO',              featureKey: 'hr.approve_dismiss', isAllowed: true },
  { positionCode: 'OWNER',            featureKey: 'hr.approve_dismiss', isAllowed: true },
];
