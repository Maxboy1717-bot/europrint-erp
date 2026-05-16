/**
 * three-way-match.service.ts
 *
 * 3-Tomonlama solishtirish:
 *   PO (Purchase Order) ↔ Receipt (Qabul akti) ↔ Invoice (Hisob-faktura)
 *
 * Variance > 5% bo'lsa — alert va manual review kerak.
 * Status: PENDING / MATCHED / VARIANCE / FAILED
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import { ThreeWayMatchRepository } from '../../infrastructure/repositories/three-way-match.repository';

const QTY_TOLERANCE_PCT    = 0.05;
const AMOUNT_TOLERANCE_PCT = 0.05;

@Injectable()
export class ThreeWayMatchService {
  private readonly logger = new Logger(ThreeWayMatchService.name);

  constructor(private readonly repo: ThreeWayMatchRepository) {}

  async match(input: {
    movementId:        number;
    purchaseOrderNo?:  string;
    receiptNo?:        string;
    invoiceNo?:        string;
    poQuantity?:       number;
    receivedQuantity?: number;
    invoicedQuantity?: number;
    poAmount?:         number;
    invoiceAmount?:    number;
    matchedBy?:        number;
  }): Promise<Result<{ id: number; status: string }, AppError>> {
    try {
      const qtyVar = input.receivedQuantity != null && input.poQuantity != null
        ? Math.abs((input.receivedQuantity - input.poQuantity) / Math.max(input.poQuantity, 1))
        : 0;
      const amountVar = input.invoiceAmount != null && input.poAmount != null
        ? Math.abs((input.invoiceAmount - input.poAmount) / Math.max(input.poAmount, 1))
        : 0;

      const status = (qtyVar > QTY_TOLERANCE_PCT || amountVar > AMOUNT_TOLERANCE_PCT) ? 'VARIANCE' : 'MATCHED';

      const existing = await this.repo.findByMovement(input.movementId);
      const data = {
        purchaseOrderNo:  input.purchaseOrderNo  ?? null,
        receiptNo:        input.receiptNo        ?? null,
        invoiceNo:        input.invoiceNo        ?? null,
        poQuantity:       input.poQuantity       ?? null,
        receivedQuantity: input.receivedQuantity ?? null,
        invoicedQuantity: input.invoicedQuantity ?? null,
        poAmount:         input.poAmount         ?? null,
        invoiceAmount:    input.invoiceAmount    ?? null,
        status,
        matchedBy:        input.matchedBy        ?? null,
      };

      if (existing) {
        await this.repo.update(existing.id, data);
        this.logger.log(`[3WayMatch] UPDATE movement ${input.movementId}: ${status}`);
        return Ok({ id: existing.id, status });
      } else {
        const id = await this.repo.insert({ movementId: input.movementId, ...data });
        this.logger.log(`[3WayMatch] INSERT movement ${input.movementId}: ${status} (id=${id})`);
        return Ok({ id, status });
      }
    } catch (e) {
      this.logger.error(`[3WayMatch] xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async listVariances(): Promise<Result<unknown[], AppError>> {
    try {
      return Ok(await this.repo.listVariances());
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async autoMatchAll(): Promise<Result<{ processed: number }, AppError>> {
    try {
      const movs = await this.repo.findUnmatchedCompleted();
      let processed = 0;
      for (const m of movs) {
        await this.match({
          movementId:       m.id,
          purchaseOrderNo:  m.purchase_order_id ?? undefined,
          invoiceNo:        m.invoice_id        ?? undefined,
          poQuantity:       Number(m.qty)        || 0,
          receivedQuantity: Number(m.qty)        || 0,
          invoicedQuantity: Number(m.qty)        || 0,
          poAmount:         Number(m.total_amount) || 0,
          invoiceAmount:    Number(m.total_amount) || 0,
        });
        processed++;
      }
      this.logger.log(`[3WayMatch Cron] ${processed} ta movement avtomatik solishtirildi`);
      return Ok({ processed });
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
