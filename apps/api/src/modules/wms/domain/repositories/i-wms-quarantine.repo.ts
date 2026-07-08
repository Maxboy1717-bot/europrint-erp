/**
 * @module i-wms-quarantine.repo
 * @description Karantin darvozasi uchun domen repository interfeysi.
 *   Mavjud `mm_goods_receipts` jadvalini qayta ishlatadi (yangi jadval YO'Q).
 *   Konkret implementatsiya:
 *   `infrastructure/repositories/wms-quarantine.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

/** Karantin darvozasi uchun zarur bo'lgan minimal qabul yozuvi. */
export interface ReceiptStatusRow {
  id: number;
  status: string | null;
}

export interface IWmsQuarantineRepo {
  /** Qabulning joriy holatini (status) o'qiydi. */
  findReceiptStatus(receiptId: number): Promise<Result<ReceiptStatusRow | null>>;

  /**
   * Qabul holatini yangilaydi (holat-mashinasi tasdiqlangandan keyin).
   * Ixtiyoriy audit maydonlari (qcBy, completedBy) ham yoziladi.
   *
   * TOCTOU himoyasi (VISION-3340 #41): `audit.expectedStatus` berilsa UPDATE
   * `AND status = <expectedStatus>` sharti bilan bajariladi (optimistik guard).
   * O'qish ↔ yozish orasida holat parallel o'zgargan bo'lsa 0 qator qaytadi
   * va Err('CONFLICT') beriladi — muvaffaqiyat deb hisoblanMAYdi.
   */
  updateReceiptStatus(
    receiptId: number,
    status: string,
    audit?: {
      userId?: number | null;
      completed?: boolean;
      note?: string | null;
      /** O'qilgan (kutilgan) joriy XOM holat — optimistik guard; undefined = guard yo'q. */
      expectedStatus?: string | null;
    },
  ): Promise<Result<ReceiptStatusRow>>;
}

export const WMS_QUARANTINE_REPO = Symbol('WMS_QUARANTINE_REPO');
