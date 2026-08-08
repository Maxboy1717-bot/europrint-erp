/**
 * @module wms-quarantine-gate.service
 * @description Karantin darvozasini REAL (backend) majburlash — application qatlam.
 *   Tashqi (external) kirim DRAFT → KARANTIN → QC_PASS/REWORK/REJECT → MAIN
 *   bosqichlarini o'tishi shart; stok faqat QC_PASS dan keyin MAIN ga o'tib,
 *   mavjud (available) bo'ladi. Holat-mashinasi va og'irlik bardoshi sof domen
 *   servisi (QuarantineGateService) orqali tekshiriladi; DB esa repo orqali
 *   (CLAUDE.md Qoida 15 — service ichida to'g'ridan db.* YO'Q).
 *   Result<T> qaytaradi; hech qachon throw qilmaydi.
 *
 *   TOCTOU himoyasi (VISION-3340 #41): har bir yozuv o'qilgan holatga
 *   SHARTLANGAN (optimistik guard — repo `expectedStatus`). O'qish ↔ yozish
 *   oynasida holat parallel o'zgargan bo'lsa 0-qator RETURNING →
 *   Err('CONFLICT') — muvaffaqiyat deb hisoblanMAYdi.
 * @layer Application (WMS)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { QuarantineGateService, WeightToleranceInput } from '../domain/services/quarantine-gate.service';
import {
  IWmsQuarantineRepo,
  WMS_QUARANTINE_REPO,
  ReceiptStatusRow,
} from '../domain/repositories/i-wms-quarantine.repo';
import {
  QUARANTINE_STATUS,
  QcDecision,
} from '../domain/constants/wms-quarantine.constants';

@Injectable()
export class WmsQuarantineGateService {
  private readonly logger = new Logger(WmsQuarantineGateService.name);

  constructor(
    private readonly gate: QuarantineGateService,
    @Inject(WMS_QUARANTINE_REPO) private readonly repo: IWmsQuarantineRepo,
  ) {}

  /**
   * Tashqi kirimni karantinga yuboradi: DRAFT → KARANTIN.
   * Stok bu bosqichda MAIN omborga TUSHMAYDI (bloklangan holatda saqlanadi).
   * VISION-3340 QC#1: o'qish→tekshiruv→yozish atomik (SERIALIZABLE + FOR UPDATE).
   */
  async sendToQuarantine(receiptId: number, userId: number | null): Promise<Result<ReceiptStatusRow, AppError>> {
    return this.repo.transitionReceiptStatusAtomic(receiptId, (status) => {
      const transition = this.gate.validateTransition(status, QUARANTINE_STATUS.KARANTIN);
      if (!transition.ok) return Err(transition.error);
      this.logger.log(`[Karantin] Qabul ${receiptId}: '${status}' → KARANTIN`);
      return Ok({ target: QUARANTINE_STATUS.KARANTIN, audit: { userId } });
    });
  }

  /**
   * QC qarorini (QABUL/REWORK/CHIQARISH) qabulga qo'llaydi.
   * Faqat KARANTIN holatidagi qabulda ishlaydi (holat-mashinasi tekshiradi).
   *   QABUL → QC_PASS, REWORK → REWORK, CHIQARISH → REJECT.
   * VISION-3340 QC#1: qaror bloklangan qatorning HAQIQIY holatiga qarab beriladi.
   */
  async applyQcDecision(
    receiptId: number,
    decision: QcDecision,
    inspectorId: number | null,
    note?: string | null,
  ): Promise<Result<ReceiptStatusRow, AppError>> {
    return this.repo.transitionReceiptStatusAtomic(receiptId, (status) => {
      const resolved = this.gate.resolveQcDecision(status, decision);
      if (!resolved.ok) return Err(resolved.error);
      this.logger.log(`[QC] Qabul ${receiptId}: ${decision} → '${resolved.data}'`);
      return Ok({ target: resolved.data, audit: { userId: inspectorId, note: note ?? null } });
    });
  }

  /**
   * Og'irlik bardoshini tekshiradi — EP-WMS-047 (±2%).
   * Bardoshdan yuqori chetlanish menejer bayrog'i + majburiy sababsiz BLOK.
   * DB ga tegmaydi — sof biznes-qoida darvozasi (qabul yozishdan oldin chaqiriladi).
   */
  checkWeightTolerance(input: WeightToleranceInput): Result<{ deviation: number; withinTolerance: boolean; requiresApproval: boolean }, AppError> {
    return this.gate.checkWeightTolerance(input);
  }

  /**
   * Qabulni MAIN omborga o'tkazadi (stok mavjud bo'ladi).
   * REAL ENFORCEMENT: faqat QC_PASS holatidagi qabul o'tadi; karantindagi
   * yoki QC o'tmagan qabul BLOK qilinadi (BUSINESS_RULE_VIOLATION).
   * Bu — completeGoodsReceipt darvozasining yagona ruxsat nuqtasi.
   */
  async releaseToMain(receiptId: number, userId: number | null): Promise<Result<ReceiptStatusRow, AppError>> {
    // VISION-3340 QC#1: ikkala darvoza ham qulf ostidagi HAQIQIY holatga qarab
    // atomik tekshiriladi — "tayyor"dan (MAIN) oldin, poyga oynasisiz.
    return this.repo.transitionReceiptStatusAtomic(receiptId, (status) => {
      // Darvoza 1: stok faqat QC_PASS dan keyin MAIN ga o'tadi.
      const canPost = this.gate.canPostToMain(status);
      if (!canPost.ok) {
        this.logger.warn(`[Karantin BLOK] Qabul ${receiptId}: '${status}' MAIN ga o'tolmaydi — ${canPost.error.message}`);
        return Err(canPost.error);
      }
      // Darvoza 2: holat-mashinasi (QC_PASS → MAIN) ham tasdiqlasin.
      const transition = this.gate.validateTransition(status, QUARANTINE_STATUS.MAIN);
      if (!transition.ok) return Err(transition.error);

      this.logger.log(`[Karantin] Qabul ${receiptId}: QC_PASS → MAIN (stok mavjud bo'ldi)`);
      return Ok({ target: QUARANTINE_STATUS.MAIN, audit: { userId, completed: true } });
    });
  }
}
