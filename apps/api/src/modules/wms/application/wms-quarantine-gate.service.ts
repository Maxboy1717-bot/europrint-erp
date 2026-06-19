/**
 * @module wms-quarantine-gate.service
 * @description Karantin darvozasini REAL (backend) majburlash — application qatlam.
 *   Tashqi (external) kirim DRAFT → KARANTIN → QC_PASS/REWORK/REJECT → MAIN
 *   bosqichlarini o'tishi shart; stok faqat QC_PASS dan keyin MAIN ga o'tib,
 *   mavjud (available) bo'ladi. Holat-mashinasi va og'irlik bardoshi sof domen
 *   servisi (QuarantineGateService) orqali tekshiriladi; DB esa repo orqali
 *   (CLAUDE.md Qoida 15 — service ichida to'g'ridan db.* YO'Q).
 *   Result<T> qaytaradi; hech qachon throw qilmaydi.
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
   */
  async sendToQuarantine(receiptId: number, userId: number | null): Promise<Result<ReceiptStatusRow, AppError>> {
    const cur = await this.repo.findReceiptStatus(receiptId);
    if (!cur.ok) return cur as Result<ReceiptStatusRow, AppError>;
    if (!cur.data) return Err({ code: 'NOT_FOUND', message: `Qabul topilmadi: ${receiptId}` });

    const transition = this.gate.validateTransition(cur.data.status, QUARANTINE_STATUS.KARANTIN);
    if (!transition.ok) return transition as Result<ReceiptStatusRow, AppError>;

    this.logger.log(`[Karantin] Qabul ${receiptId}: '${cur.data.status}' → KARANTIN`);
    return this.repo.updateReceiptStatus(receiptId, QUARANTINE_STATUS.KARANTIN, { userId });
  }

  /**
   * QC qarorini (QABUL/REWORK/CHIQARISH) qabulga qo'llaydi.
   * Faqat KARANTIN holatidagi qabulda ishlaydi (holat-mashinasi tekshiradi).
   *   QABUL → QC_PASS, REWORK → REWORK, CHIQARISH → REJECT.
   */
  async applyQcDecision(
    receiptId: number,
    decision: QcDecision,
    inspectorId: number | null,
    note?: string | null,
  ): Promise<Result<ReceiptStatusRow, AppError>> {
    const cur = await this.repo.findReceiptStatus(receiptId);
    if (!cur.ok) return cur as Result<ReceiptStatusRow, AppError>;
    if (!cur.data) return Err({ code: 'NOT_FOUND', message: `Qabul topilmadi: ${receiptId}` });

    const resolved = this.gate.resolveQcDecision(cur.data.status, decision);
    if (!resolved.ok) return resolved as Result<ReceiptStatusRow, AppError>;

    this.logger.log(`[QC] Qabul ${receiptId}: ${decision} → '${resolved.data}'`);
    return this.repo.updateReceiptStatus(receiptId, resolved.data, { userId: inspectorId, note: note ?? null });
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
    const cur = await this.repo.findReceiptStatus(receiptId);
    if (!cur.ok) return cur as Result<ReceiptStatusRow, AppError>;
    if (!cur.data) return Err({ code: 'NOT_FOUND', message: `Qabul topilmadi: ${receiptId}` });

    // Darvoza 1: stok faqat QC_PASS dan keyin MAIN ga o'tadi.
    const canPost = this.gate.canPostToMain(cur.data.status);
    if (!canPost.ok) {
      this.logger.warn(`[Karantin BLOK] Qabul ${receiptId}: '${cur.data.status}' MAIN ga o'tolmaydi — ${canPost.error.message}`);
      return canPost as unknown as Result<ReceiptStatusRow, AppError>;
    }

    // Darvoza 2: holat-mashinasi (QC_PASS → MAIN) ham tasdiqlasin.
    const transition = this.gate.validateTransition(cur.data.status, QUARANTINE_STATUS.MAIN);
    if (!transition.ok) return transition as Result<ReceiptStatusRow, AppError>;

    this.logger.log(`[Karantin] Qabul ${receiptId}: QC_PASS → MAIN (stok mavjud bo'ldi)`);
    return this.repo.updateReceiptStatus(receiptId, QUARANTINE_STATUS.MAIN, { userId, completed: true });
  }
}
