/**
 * @module wms-quarantine.constants
 * @description WMS karantin (quarantine) 5-bosqichli darvoza konstantalari.
 *
 * Bu konstantalar faqat karantin darvozasi (QuarantineGateService /
 * WmsQuarantineGateService) uchun mo'ljallangan. Ularni formula yoki
 * holat-mashinasida hardcode qilish TAQIQLANGAN — faqat shu fayldan import
 * qilinadi (CLAUDE.md Qoida 12, magic-number taqiq).
 *
 * OMBOR VIZYON manbalari:
 *   - docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 2 (kirim + QC karantin darvozasi)
 *   - EP-WMS-047 (egasi override): qabul ±2% auto-qabul; yuqorisi = menejer + majburiy sabab.
 *   - EP-WMS-003/016/017: DRAFT → KARANTIN → QC_PASS/REWORK/REJECT → MAIN (5-bosqich, POS Q21/Q30).
 *
 * Tashqi (external) kirim HAR DOIM avval karantinga tushadi — istisnosiz
 * (OMBOR-KASSIR-INTERVYU §3). Stok faqat QC_PASS dan keyin MAIN ga o'tib,
 * mavjud (available) bo'ladi.
 */

/**
 * Karantin darvozasining kanonik 5-bosqichli holatlari.
 *
 *   DRAFT     — qoralama; qabul yangi yaratilgan, hali karantinga yuborilmagan.
 *   KARANTIN  — karantinda; tashqi kirim majburan shu yerga tushadi, stok BLOK.
 *   QC_PASS   — QC o'tdi; faqat shu holatdan MAIN ga o'tish mumkin.
 *   REWORK    — qayta ishlash (MES ga qaytadi); MAIN ga o'tolmaydi.
 *   REJECT    — rad etildi (yetkazib beruvchiga qaytariladi); MAIN ga o'tolmaydi.
 *   MAIN      — asosiy omborga o'tdi; stok endi mavjud (available).
 *
 * Eslatma: bu qiymatlar `mm_goods_receipts.status` ustunida (varchar) saqlanadi.
 * Kichik harfli legacy holatlar (`draft`/`pending`/`completed`) bilan to'qnashmasligi
 * uchun normalizatsiya `normalizeStatus()` orqali amalga oshiriladi.
 */
export const QUARANTINE_STATUS = {
  DRAFT: 'DRAFT',
  KARANTIN: 'KARANTIN',
  QC_PASS: 'QC_PASS',
  REWORK: 'REWORK',
  REJECT: 'REJECT',
  MAIN: 'MAIN',
} as const;

export type QuarantineStatus =
  (typeof QUARANTINE_STATUS)[keyof typeof QUARANTINE_STATUS];

/**
 * Ruxsat etilgan o'tishlar (holat-mashinasi).
 * Kalit = joriy holat; qiymat = ruxsat etilgan keyingi holatlar ro'yxati.
 *
 * Asosiy invariant: MAIN ga FAQAT QC_PASS dan o'tish mumkin.
 * KARANTIN holatidan to'g'ridan-to'g'ri MAIN ga o'tish MUMKIN EMAS.
 */
export const QUARANTINE_TRANSITIONS: Record<QuarantineStatus, QuarantineStatus[]> = {
  [QUARANTINE_STATUS.DRAFT]: [QUARANTINE_STATUS.KARANTIN],
  [QUARANTINE_STATUS.KARANTIN]: [
    QUARANTINE_STATUS.QC_PASS,
    QUARANTINE_STATUS.REWORK,
    QUARANTINE_STATUS.REJECT,
  ],
  [QUARANTINE_STATUS.QC_PASS]: [QUARANTINE_STATUS.MAIN],
  [QUARANTINE_STATUS.REWORK]: [QUARANTINE_STATUS.KARANTIN],
  [QUARANTINE_STATUS.REJECT]: [],
  [QUARANTINE_STATUS.MAIN]: [],
};

/**
 * QC qarori (uch-yo'nalishli darvoza) → keyingi holat xaritasi.
 * EP-WMS-088/QC three-decision gate:
 *   QABUL     → QC_PASS (so'ngra MAIN ga o'tishga ruxsat)
 *   REWORK    → REWORK  (MES ga qaytadi)
 *   CHIQARISH → REJECT  (yetkazib beruvchiga qaytariladi)
 */
export const QC_DECISION_TO_STATUS = {
  QABUL: QUARANTINE_STATUS.QC_PASS,
  REWORK: QUARANTINE_STATUS.REWORK,
  CHIQARISH: QUARANTINE_STATUS.REJECT,
} as const;

export type QcDecision = keyof typeof QC_DECISION_TO_STATUS;

/**
 * Og'irlik (gramaj) bardosh chegarasi — EP-WMS-047 (egasi override).
 *
 * Kutilgan miqdorga nisbatan ±2% gacha chetlanish auto-qabul qilinadi.
 * 2% dan yuqori chetlanish → menejer tasdig'i (managerFlag) + majburiy sabab
 * (reason) talab qilinadi; aks holda darvoza BLOK qiladi.
 *
 * Birlik: ulush (0.02 = 2%). Foizga emas, ulushga normalizatsiya qilingan.
 */
export const RECEIPT_WEIGHT_TOLERANCE = 0.02;

/**
 * Karantin uchun kichik harfli legacy holatlardan kanonik holatlarga
 * normalizatsiya xaritasi. Mavjud yozuvlar (`draft`/`pending`/`completed`)
 * yangi 5-bosqichli mashinaga moslanadi — regressiyani oldini olish uchun.
 */
const LEGACY_STATUS_MAP: Record<string, QuarantineStatus> = {
  draft: QUARANTINE_STATUS.DRAFT,
  pending: QUARANTINE_STATUS.DRAFT,
  karantin: QUARANTINE_STATUS.KARANTIN,
  quarantine: QUARANTINE_STATUS.KARANTIN,
  qc_pass: QUARANTINE_STATUS.QC_PASS,
  qc_review: QUARANTINE_STATUS.KARANTIN,
  passed: QUARANTINE_STATUS.QC_PASS,
  approved: QUARANTINE_STATUS.QC_PASS,
  rework: QUARANTINE_STATUS.REWORK,
  reject: QUARANTINE_STATUS.REJECT,
  rejected: QUARANTINE_STATUS.REJECT,
  main: QUARANTINE_STATUS.MAIN,
  completed: QUARANTINE_STATUS.MAIN,
};

/**
 * Xom holat satrini kanonik QuarantineStatus ga normalizatsiya qiladi.
 * Tanib bo'lmaydigan qiymat uchun `null` qaytaradi (darvoza buni xato deb hisoblaydi).
 * @param raw - DB dan kelgan xom status satri (yoki null/undefined)
 */
export function normalizeStatus(raw: string | null | undefined): QuarantineStatus | null {
  if (!raw) return null;
  const upper = String(raw).trim().toUpperCase();
  if ((Object.values(QUARANTINE_STATUS) as string[]).includes(upper)) {
    return upper as QuarantineStatus;
  }
  const mapped = LEGACY_STATUS_MAP[String(raw).trim().toLowerCase()];
  return mapped ?? null;
}
