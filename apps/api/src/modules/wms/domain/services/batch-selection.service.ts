/**
 * @module batch-selection.service
 * @description Pure FIFO/FEFO batch-lot selection for goods-issue (PHASE 4 / PHASE 7).
 *
 * Bu domen servisi DB ga bormaydi — faqat sof tanlash mantiqi:
 *   - strategiyani aniqlash (FEFO sanali materiallar uchun, aks holda FIFO),
 *   - tartiblash (FEFO: expiry ASC; FIFO: received ASC),
 *   - muddati o'tgan partiyani BLOK qilish (EP-WMS-079),
 *   - bir nechta partiya bo'ylab miqdorni bo'lib olish (span).
 *
 * Tanlangan rejani repo qatlami `batch_lots` ga yozadi. Shu sababli bu fayl
 * mock-repo bilan to'liq unit-test qilinadi (DB shart emas).
 */

import { Result, Ok, Err, AppErr } from '@common/result';
import {
  BatchIssueStrategy,
  BATCH_MIN_REMAINING,
  BATCH_QUALITY_ISSUE_RANK,
  BATCH_QUALITY_ISSUE_RANK_DEFAULT,
} from '../constants/wms-batch-issue.constants';

/**
 * Chiqarishga nomzod partiya (batch_lots dan repo o'qigan minimal shakl).
 * `remaining` — joriy qoldiq (batch_lots.remaining_quantity).
 * `expiryDate` — muddat (batch_lots.expiry_date); null = sanasiz material.
 * `receivedAt` — kelgan sana (batch_lots.received_date / created_at).
 */
export interface IssuableBatchLot {
  id: number;
  remaining: number;
  expiryDate: Date | null;
  receivedAt: Date | null;
  /**
   * FAZA K — partiyaning o'z narxi (batch_lots.cost_per_unit). null = narx qayd
   * etilmagan (o'sha qism uchun finance material_cards fallback ishlatadi).
   */
  costPerUnit: number | null;
  /**
   * EP-MM #15 (Q515) — batch_lots.quality_status. Chiqim ustuvorligi: holat > sana.
   * QC "o'tgan" (approved) partiya "shartli" (pending) partiyadan OLDIN chiqariladi.
   * null/undefined = holat noma'lum → sana bo'yicha (eng past ustuvorlik).
   */
  qualityStatus?: string | null;
}

/**
 * Bitta partiyadan qancha olinishini bildiruvchi reja qatori.
 * Repo bu rejani ketma-ket `decrementBatchLot(lotId, qty)` bilan bajaradi.
 */
export interface BatchPick {
  lotId: number;
  qty: number;
  /** FAZA K — tanlangan partiyaning narxi (null = noma'lum). */
  costPerUnit: number | null;
}

/** Tanlash natijasi: nechta partiyadan qancha olinadi + qaysi strategiya. */
export interface BatchSelectionPlan {
  picks: BatchPick[];
  strategy: BatchIssueStrategy;
}

export class BatchSelectionService {
  /**
   * Materialning partiyalari sanaga ega bo'lsa FEFO, aks holda FIFO.
   * (kley/bo'yoq/kimyo qabulda expiry_date oladi → FEFO; EP-WMS-055.)
   * @param lots issuable partiyalar ro'yxati
   * @param override caller aniq strategiya bersa (ixtiyoriy)
   */
  resolveStrategy(
    lots: IssuableBatchLot[],
    override?: BatchIssueStrategy,
  ): BatchIssueStrategy {
    if (override) return override;
    const list = Array.isArray(lots) ? lots : [];
    const anyDated = list.some((l) => l.expiryDate != null);
    return anyDated ? BatchIssueStrategy.FEFO : BatchIssueStrategy.FIFO;
  }

  /**
   * batch_lots.quality_status ni chiqim ustuvorligiga aylantiradi
   * (EP-MM #15 / Q515 — holat > FIFO sana). Kichik son = oldin chiqariladi.
   * approved=0, pending=1, noma'lum/undefined = DEFAULT (eng oxirida).
   */
  private qualityRank(status: string | null | undefined): number {
    if (status == null) return BATCH_QUALITY_ISSUE_RANK_DEFAULT;
    return BATCH_QUALITY_ISSUE_RANK[status] ?? BATCH_QUALITY_ISSUE_RANK_DEFAULT;
  }

  /**
   * Partiyalarni tartiblaydi. EP-MM #15 (Q515): AVVAL sifat holati (approved
   * "o'tgan" partiya pending "shartli" dan OLDIN), keyin strategiya sanasi:
   * FEFO: expiry_date ASC (NULL oxirida), keyin received ASC.
   * FIFO: received ASC, keyin expiry ASC (NULL oxirida).
   */
  private order(
    lots: IssuableBatchLot[],
    strategy: BatchIssueStrategy,
  ): IssuableBatchLot[] {
    const list = Array.isArray(lots) ? [...lots] : [];
    const exp = (d: Date | null): number =>
      d ? new Date(d).getTime() : Number.POSITIVE_INFINITY; // NULLS LAST
    const rec = (d: Date | null): number =>
      d ? new Date(d).getTime() : Number.POSITIVE_INFINITY;
    list.sort((a, b) => {
      // EP-MM #15: ustuvorlik holat > sana — "o'tgan" partiya "shartli" dan oldin.
      const q = this.qualityRank(a.qualityStatus) - this.qualityRank(b.qualityStatus);
      if (q !== 0) return q;
      if (strategy === BatchIssueStrategy.FEFO) {
        const e = exp(a.expiryDate) - exp(b.expiryDate);
        if (e !== 0) return e;
        return rec(a.receivedAt) - rec(b.receivedAt);
      }
      const r = rec(a.receivedAt) - rec(b.receivedAt);
      if (r !== 0) return r;
      return exp(a.expiryDate) - exp(b.expiryDate);
    });
    return list;
  }

  /**
   * Miqdorni tanlangan tartibdagi partiyalar bo'ylab bo'lib oladi (span).
   * Muddati o'tgan partiyalar BLOK (EP-WMS-079) — selection chaqirilishidan
   * oldin repo expired-partiyani aniqlab BLOK qiladi; bu yerda ham xavfsizlik
   * uchun tekshiriladi (sof mantiq, `now` injektsiya qilinadi).
   *
   * @param lots issuable partiyalar (faqat ruxsat etilgan quality_status)
   * @param amount chiqariladigan umumiy miqdor
   * @param now joriy vaqt (expiry solishtirish uchun; test uchun injektsiya)
   * @param override aniq strategiya (ixtiyoriy)
   * @returns reja yoki xato (yetarli partiya yo'q / muddati o'tgan)
   */
  buildPlan(
    lots: IssuableBatchLot[],
    amount: number,
    now: Date,
    override?: BatchIssueStrategy,
  ): Result<BatchSelectionPlan> {
    if (!(amount > 0)) {
      return Err(AppErr('INVALID_QUANTITY', "Miqdor 0 dan katta bo'lishi kerak"));
    }
    const list = Array.isArray(lots) ? lots : [];

    // EP-WMS-079: muddati o'tgan partiyani chiqarish BLOK.
    const nowMs = new Date(now).getTime();
    const hasExpired = list.some(
      (l) =>
        l.expiryDate != null &&
        new Date(l.expiryDate).getTime() < nowMs &&
        l.remaining > BATCH_MIN_REMAINING,
    );
    if (hasExpired) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          'Muddati o\'tgan partiya chiqarib bo\'lmaydi (FEFO BLOK)',
        ),
      );
    }

    const strategy = this.resolveStrategy(list, override);
    const ordered = this.order(
      list.filter((l) => l.remaining > BATCH_MIN_REMAINING),
      strategy,
    );

    const picks: BatchPick[] = [];
    let remaining = amount;
    for (const lot of ordered) {
      if (remaining <= 0) break;
      const take = Math.min(lot.remaining, remaining);
      if (take > 0) {
        picks.push({ lotId: lot.id, qty: take, costPerUnit: lot.costPerUnit });
        remaining -= take;
      }
    }

    if (remaining > 0) {
      return Err(
        AppErr('INVALID_QUANTITY', "Partiyalarda yetarli qoldiq yo'q"),
      );
    }
    return Ok({ picks, strategy });
  }
}
