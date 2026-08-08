/**
 * @module wms-batch-issue.constants
 * @description WMS goods-issue batch-selection (FIFO/FEFO) konstantalari.
 *
 * Bu konstantalar faqat batch-selection (FIFO/FEFO) chiqim yo'li uchun.
 * Magic-numberni handler/service/repo ichida hardcode qilish TAQIQLANGAN
 * (CLAUDE.md Qoida 12) — faqat shu fayldan import qilinadi. Bu fayl
 * `business.constants.ts` EMAS — modul-maxsus konstantalar shu yerda turadi.
 *
 * OMBOR VIZYON manbalari:
 *   - docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 4 (FIFO/FEFO),
 *     §PHASE 7 (batch/partiya + expiry FEFO + block expired)
 *   - EP-WMS-055 (FEFO dated materiallar: kley/bo'yoq/kimyo),
 *     EP-WMS-079/018 (expired BLOCK)
 */

/**
 * Chiqim partiya tanlash strategiyasi.
 *
 * FIFO — eng avval kelgan partiya birinchi (received_date ASC).
 *        Sanasi yo'q materiallar uchun (qog'oz, karton, h.k.).
 * FEFO — eng erta tugaydigan partiya birinchi (expiry_date ASC).
 *        Sanali materiallar uchun (kley/bo'yoq/kimyo — EP-WMS-055).
 */
export enum BatchIssueStrategy {
  FIFO = 'FIFO',
  FEFO = 'FEFO',
}

/**
 * batch_lots.quality_status — chiqarishga RUXSAT etilgan holatlar.
 * Faqat QC dan o'tgan ("approved") yoki hali tekshirilmagan ("pending")
 * partiyalardan chiqarish mumkin. quarantine / defective / rejected — BLOK.
 * Manba: live DB DISTINCT quality_status (approved/pending/quarantine/
 * defective/rejected) + EP-WMS-016/017 karantin gate.
 */
export const BATCH_ISSUABLE_QUALITY_STATUSES = ['approved', 'pending'] as const;

/**
 * batch_lots.quality_status — chiqarishga BLOK qilingan holatlar.
 * Bu holatdagi partiyalar selection'dan chetlatiladi (karantin gate).
 */
export const BATCH_BLOCKED_QUALITY_STATUSES = ['quarantine', 'defective', 'rejected'] as const;

/**
 * Minimal qoldiq — bundan past partiyalar "bo'sh" deb hisoblanadi va
 * selection'ga kirmaydi (raqamli artefaktlardan himoya).
 * Birlik: material birligi (kg / dona / litr ...).
 */
export const BATCH_MIN_REMAINING = 0;

/**
 * batch_lots.quality_status → chiqim USTUVORLIK darajasi (EP-MM #15 / Q515:
 * "Ustuvorlik: holat > FIFO sana"). QC dan "o'tgan" (approved) partiya
 * "shartli/hali tekshirilmagan" (pending) partiyadan OLDIN chiqariladi; holat
 * teng bo'lsa FIFO/FEFO sana qo'llanadi. Kichik son = oldin chiqariladi.
 * Faqat issuable holatlar (approved/pending) bu yerda tartiblanadi; noma'lum
 * holat xavfsizlik uchun eng oxirida (DEFAULT).
 */
export const BATCH_QUALITY_ISSUE_RANK: Readonly<Record<string, number>> = {
  approved: 0,
  pending: 1,
};

/** Noma'lum/ro'yxatda yo'q quality_status uchun ustuvorlik (eng past = oxirida). */
export const BATCH_QUALITY_ISSUE_RANK_DEFAULT = 2;
