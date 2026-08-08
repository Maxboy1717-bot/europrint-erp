/**
 * @module rbac-tier.policy
 * @description Razryad-daraja → RBAC tier xaritasi — EGASI TASDIQLAGAN QOIDA (2026-06-25, AskUserQuestion).
 *
 *   Egasi tanlovi: "Razryad→tier qoidasi (eng tez)" —
 *     razryad 1-2 = operator, 3-4 = specialist, 5 = manager, 6 = executive.
 *
 *   ⭐ DERIVE-ON-READ modeli (org_departments.rbac_tier ustunini razryaddan to'ldirmaymiz):
 *     samarali tier = QO'LDA kiritilgan rbac_tier (override) ?? razryad-darajaga ko'ra shu xarita.
 *   Shunda kartaning razryadi kiritilgan zahoti tier o'zi to'g'ri bo'ladi; razryad o'zgarsa — tier ham.
 *   Qo'lda rbac_tier berilgan bo'lsa, u ustun (egasi "ayrim kartalarni keyin to'g'irlash" kafolati).
 *
 *   FABRIKATSIYA TAQIQ (Q-40): razryad NULL yoki noma'lum daraja → null (taxminiy tier yozilmaydi).
 *   Yagona manba: shu fayl. Iste'molchi: auth resolveCardGate (JWT rbacTier claim).
 */

/** Razryad-daraja (1..6) → RBAC tier. Egasi qoidasi 2026-06-25. */
export const RAZRYAD_LEVEL_TO_RBAC_TIER: Readonly<Record<number, string>> = {
  1: 'operator',
  2: 'operator',
  3: 'specialist',
  4: 'specialist',
  5: 'manager',
  6: 'executive',
};

/**
 * Razryad-darajadan RBAC tier (egasi qoidasi). NULL/noma'lum daraja → null (fabrikatsiya yo'q).
 * @param level razryad_levels.level (1..6) yoki null
 */
export function razryadLevelToRbacTier(level: number | null | undefined): string | null {
  if (level == null || !Number.isFinite(level)) return null;
  return RAZRYAD_LEVEL_TO_RBAC_TIER[level] ?? null;
}

/**
 * Kartaning samarali RBAC tier'i: qo'lda override ustun, aks holda razryaddan.
 * @param explicitTier org_departments.rbac_tier (qo'lda kiritilgan) yoki null
 * @param razryadLevel birlamchi karta razryad-darajasi yoki null
 */
export function resolveEffectiveRbacTier(
  explicitTier: string | null | undefined,
  razryadLevel: number | null | undefined,
): string | null {
  const explicit = explicitTier == null || explicitTier === '' ? null : explicitTier;
  return explicit ?? razryadLevelToRbacTier(razryadLevel);
}
