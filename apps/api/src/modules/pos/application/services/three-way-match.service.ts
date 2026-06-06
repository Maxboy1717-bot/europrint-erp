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

      const existingR = await this.repo.findByMovement(input.movementId);
      if (!existingR.ok) return Err(existingR.error);
      const existing = existingR.data;
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
        const updateR = await this.repo.update(existing.id, data);
        if (!updateR.ok) return Err(updateR.error);
        this.logger.log(`[3WayMatch] UPDATE movement ${input.movementId}: ${status}`);
        return Ok({ id: existing.id, status });
      } else {
        const insertR = await this.repo.insert({ movementId: input.movementId, ...data });
        if (!insertR.ok) return Err(insertR.error);
        this.logger.log(`[3WayMatch] INSERT movement ${input.movementId}: ${status} (id=${insertR.data})`);
        return Ok({ id: insertR.data, status });
      }
    } catch (e) {
      this.logger.error(`[3WayMatch] xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async listVariances(): Promise<Result<unknown[], AppError>> {
    return this.repo.listVariances();
  }

  /**
   * Legacy compat: used by remaining/ThreeWayMatchController (GET /3way-match/results).
   * Delegates to listVariances() — filters by poId when provided.
   */
  async getResults(poId: number | null, _limit: number): Promise<Result<unknown, AppError>> {
    try {
      const r = await this.repo.listVariances();
      const rows = (r.ok ? r.data : []) as Array<Record<string, unknown>>;
      const data = poId != null
        ? rows.filter(r => Number(r['movementId']) === poId || r['poId'] === poId)
        : rows;
      return Ok({ data });
    } catch (e) {
      this.logger.error(`[3WayMatch] getResults xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /**
   * Legacy compat: used by remaining/ThreeWayMatchController (POST /3way-match/perform).
   * Bridges old poId/grId/vendorInvoiceId payload to match().
   */
  async perform(body: Record<string, unknown>, userId: number): Promise<Result<unknown, AppError>> {
    const { poId, grId, vendorInvoiceId, invoiceAmount } = body as {
      poId?: number; grId?: number; vendorInvoiceId?: string; invoiceAmount?: number;
    };
    if (!poId || !grId || !vendorInvoiceId) {
      return Err({ message: 'poId, grId, vendorInvoiceId talab qilinadi', code: 'BAD_REQUEST' });
    }
    return this.match({
      movementId:    grId,
      purchaseOrderNo: String(poId),
      invoiceNo:     vendorInvoiceId,
      poAmount:      undefined,
      invoiceAmount: invoiceAmount != null ? Number(invoiceAmount) : undefined,
      matchedBy:     userId,
    });
  }

  async autoMatchAll(): Promise<Result<{ processed: number }, AppError>> {
    try {
      const movResult = await this.repo.findUnmatchedCompleted();
      if (!movResult.ok) return Err({ message: String(movResult.error), code: 'DB_ERROR' });
      const movs = movResult.data;
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
