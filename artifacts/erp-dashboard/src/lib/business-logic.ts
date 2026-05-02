// ─── GSD (Haftalik natija ko'rsatkichi) ───────────────────────────────────────

/**
 * GSD bajarilish foizini hisoblaydi.
 * @param actual - Haqiqiy natija
 * @param target - Maqsad qiymat
 * @returns Foiz (0-∞)
 */
export function calcGsdCompletionPct(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((actual / target) * 100);
}

/**
 * GSD og'ish foizini hisoblaydi (actual vs target).
 * Musbat = maqsaddan yuqori, manfiy = maqsaddan past.
 */
export function calcGsdVariance(actual: number, target: number): number {
  if (target <= 0) return 0;
  return parseFloat(((actual - target) / target * 100).toFixed(1));
}

// ─── Kompaniya holati (Company State) ────────────────────────────────────────

export type CompanyStateKey = 'GROWTH' | 'NORMAL' | 'RISK' | 'CRITICAL';

/**
 * Kompaniya haftalik holatini hisoblaydi.
 * Chegaralar: ≥110% → GROWTH, ≥80% → NORMAL, ≥60% → RISK, <60% → CRITICAL
 * @param perfRatio - Performance nisbati (foiz)
 */
export function calcCompanyState(perfRatio: number): CompanyStateKey {
  if (perfRatio >= 110) return 'GROWTH';
  if (perfRatio >= 80) return 'NORMAL';
  if (perfRatio >= 60) return 'RISK';
  return 'CRITICAL';
}

// ─── ZVS (Xarajat talabi) ─────────────────────────────────────────────────────

export type ZvsLevel = 1 | 2 | 3;

const ZVS_LEVEL1_THRESHOLD = 500_000;
const ZVS_LEVEL2_THRESHOLD = 5_000_000;

/**
 * Xarajat miqdoriga qarab ZVS tasdiqlash darajasini aniqlaydi.
 * ≤500K → Daraja 1, ≤5M → Daraja 2, >5M → Daraja 3
 */
export function computeZvsLevel(amount: number): ZvsLevel {
  if (amount <= ZVS_LEVEL1_THRESHOLD) return 1;
  if (amount <= ZVS_LEVEL2_THRESHOLD) return 2;
  return 3;
}

const ZVS_APPROVERS: Record<ZvsLevel, ReadonlyArray<string>> = {
  1: ["admin", "super_admin", "superadmin", "director", "ceo", "cfo", "finance_manager", "department_head", "manager"],
  2: ["admin", "super_admin", "superadmin", "director", "ceo", "cfo", "finance_manager"],
  3: ["admin", "super_admin", "superadmin", "director", "ceo"],
};

/**
 * Berilgan rol ushbu ZVS darajasini tasdiqlay olishini tekshiradi.
 */
export function canApproveZvs(role: string, level: ZvsLevel): boolean {
  return ZVS_APPROVERS[level]?.includes(role) ?? false;
}

// ─── Hafta boshi hisoblash ────────────────────────────────────────────────────

/**
 * Berilgan sana uchun hafta boshini (Dushanba) qaytaradi.
 * Timezone-safe: YYYY-MM-DD kiritilsa UTC sifatida talqin qilinadi, local TZ ta'sir etmaydi.
 * Yakshanba bugidan himoya: yakshanba kuni o'tgan haftaning Dushanbasi qaytariladi.
 * @param date - ISO sana string 'YYYY-MM-DD' (ixtiyoriy, default: bugungi UTC sana)
 * @returns YYYY-MM-DD formatida Dushanba sanasi
 */
export function getWeekStart(date?: string): string {
  let year: number, month: number, day: number;

  if (date) {
    // Parse YYYY-MM-DD manually — no timezone ambiguity
    const parts = date.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // 0-indexed
    day = parseInt(parts[2], 10);
  } else {
    const now = new Date();
    year = now.getUTCFullYear();
    month = now.getUTCMonth();
    day = now.getUTCDate();
  }

  // Use Date.UTC so all operations are UTC-only
  const ts = Date.UTC(year, month, day);
  const d = new Date(ts);
  const dow = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffDays = dow === 0 ? -6 : 1 - dow; // Mon=0, Sun=-6
  const mondayTs = ts + diffDays * 86_400_000;
  const monday = new Date(mondayTs);

  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(monday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d2}`;
}

// ─── Pul formatlash ───────────────────────────────────────────────────────────

/**
 * Katta pul miqdorlarini qisqartirilgan shaklda ko'rsatadi.
 * Misol: 1_500_000_000 → "1.5B", 2_500_000 → "2.5M", 25_000 → "25K"
 */
export function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
