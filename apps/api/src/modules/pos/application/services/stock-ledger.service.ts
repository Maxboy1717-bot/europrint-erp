/**
 * @module stock-ledger.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '@nestjs/cqrs';
import { Ok, Err, Result, AppError, AppErr } from '@common/result';
import { StockLedgerRepository } from '../../infrastructure/repositories/stock-ledger.repository';
import { movementConfirmations, posStockLedger as stockLedger, stockAlerts } from '@workspace/db';
import { StockUpdatedEvent } from '@modules/wms/application/events/stock-updated.event';

const MIN_LOW_STOCK_THRESHOLD = 5;

type LedgerRow      = typeof stockLedger.$inferSelect;
type AlertRow       = typeof stockAlerts.$inferSelect;
type ConfirmRow     = typeof movementConfirmations.$inferSelect;
type ConfirmStep    = typeof movementConfirmations.$inferInsert['step'];
type ConfirmDecision = typeof movementConfirmations.$inferInsert['decision'];

@Injectable()
export class StockLedgerService {
  private readonly logger = new Logger(StockLedgerService.name);

  constructor(
    private readonly repo:    StockLedgerRepository,
    private readonly emitter: EventEmitter2,
    private readonly eventBus: EventBus,
  ) {}

  async recordEntry(
    materialCardId: number,
    warehouseId: string,
    qtyChange: number,
    movementId: number,
    reason?: string,
    batchId?: number,
  ): Promise<Result<LedgerRow, AppError>> {
    try {
      // Q-53 fix: balance_after must mirror the CANONICAL warehouse_stock value, not an
      // independently-accumulated ledger-only running total (prevBalance + qtyChange derived
      // from this table's own prior row). Every caller of recordEntry() (pos-movement-status
      // .service's _processCompletedMovement, and adjustStock() below) writes warehouse_stock
      // FIRST and calls recordEntry() after, so by this point the canonical balance already
      // reflects qtyChange — read it back instead of re-deriving it. This makes stock_ledger a
      // self-correcting journal that can never drift from warehouse_stock, instead of a second,
      // independently-drifting source of truth (the divergence risk this fix closes).
      const canonicalR = await this.repo.getCanonicalBalance(materialCardId, warehouseId);
      const balanceAfter = canonicalR.ok ? canonicalR.data : 0;

      const entryR = await this.repo.insertLedgerEntry({
        materialCardId,
        warehouseId,
        batchId,
        movementId,
        qtyChange,
        balanceAfter,
        reason,
        ts: new Date(),
      });
      if (!entryR.ok) return Err(entryR.error);
      const entry = entryR.data;

      if (balanceAfter <= MIN_LOW_STOCK_THRESHOLD && balanceAfter > 0) {
        await this.repo.insertStockAlert({
          materialCardId,
          warehouseId,
          alertType: 'LOW_STOCK',
          thresholdValue: MIN_LOW_STOCK_THRESHOLD,
          currentValue: balanceAfter,
          severity: 'WARNING',
        });
      } else if (balanceAfter <= 0) {
        await this.repo.insertStockAlert({
          materialCardId,
          warehouseId,
          alertType: 'OUT_OF_STOCK',
          currentValue: balanceAfter,
          severity: 'CRITICAL',
        });
      }

      // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy
      // @OnEvent(ERP_EVENTS.STOCK_UPDATED) listeners (e.g. wms ROP trigger).
      this.eventBus.publish(new StockUpdatedEvent(materialCardId, balanceAfter));

      return Ok(entry);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  /** Real-time material balance (GET /pos/stock/:warehouseId/:materialId) — Q-53 fix: reads the
   *  CANONICAL warehouse_stock balance, not the ledger's own (potentially stale) running total. */
  async getBalance(materialCardId: number, warehouseId: string): Promise<Result<number, AppError>> {
    try {
      const r = await this.repo.getCanonicalBalance(materialCardId, warehouseId);
      if (!r.ok) return Err(r.error);
      return Ok(r.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async getAllSummary(): Promise<Result<{ materialCardId: number; warehouseId: string; balance: number }[], AppError>> {
    try {
      const r = await this.repo.getAllStockSummary();
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  /** Low-stock list for GET /pos/inventory/low-stock — derived from the ledger balance summary
   *  (NOT the stock_alerts table, which is absent in this DB). Filters balance <= threshold. */
  async getLowStock(): Promise<Result<{ materialCardId: number; warehouseId: string; balance: number }[], AppError>> {
    try {
      const r = await this.repo.getAllStockSummary();
      if (!r.ok) return Err(r.error);
      const low = (Array.isArray(r.data) ? r.data : []).filter((s) => s.balance <= MIN_LOW_STOCK_THRESHOLD);
      return Ok(low);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  /** Monthly inventory report for GET /pos/inventory/monthly-report (kirim/chiqim/count by month). */
  async getMonthlyReport(warehouseId?: string): Promise<Result<Array<{ month: string; inQty: number; outQty: number; movements: number }>, AppError>> {
    try {
      const r = await this.repo.getMonthlyReport(warehouseId);
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  /** Stock-movement journal (all materials) for GET /pos/stock/movements — paginated, newest-first. */
  async getMovements(limit = 50, offset = 0, warehouseId?: string): Promise<Result<LedgerRow[], AppError>> {
    try {
      const r = await this.repo.getMovements(limit, offset, warehouseId);
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async getLowAlerts(): Promise<Result<AlertRow[], AppError>> {
    try {
      const r = await this.repo.getUnresolvedAlerts(undefined, ['LOW_STOCK', 'OUT_OF_STOCK']);
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  @Cron('0 * * * *', { timeZone: 'Asia/Tashkent' })
  async evaluateStockAlerts(): Promise<void> {
    try {
      const summaryR = await this.repo.getAllStockSummary();
      if (!summaryR.ok) { this.logger.warn('[STOCK-CRON] getAllStockSummary failed'); return; }
      for (const item of summaryR.data ?? []) {
        // G9-2 flood-fix: insertStockAlert dedup-aware — ochiq alert bor bo'lsa yangi qator
        // yozilmaydi (updated_at yangilanadi); event faqat YANGI alert yaratilganda emit qilinadi.
        if (item.balance <= 0) {
          const r = await this.repo.insertStockAlert({ materialCardId: item.materialCardId, warehouseId: item.warehouseId, alertType: 'OUT_OF_STOCK', currentValue: item.balance, thresholdValue: 0 });
          if (r.ok && r.data.created) { this.emitter.emit('pos.stock.low_alert', { materialCardId: item.materialCardId, warehouseId: item.warehouseId, balance: item.balance }); }
        } else if (item.balance <= MIN_LOW_STOCK_THRESHOLD) {
          const r = await this.repo.insertStockAlert({ materialCardId: item.materialCardId, warehouseId: item.warehouseId, alertType: 'LOW_STOCK', currentValue: item.balance, thresholdValue: MIN_LOW_STOCK_THRESHOLD });
          if (r.ok && r.data.created) { this.emitter.emit('pos.stock.low_alert', { materialCardId: item.materialCardId, warehouseId: item.warehouseId, balance: item.balance }); }
        }
      }
      this.logger.log(`[STOCK-CRON] Stock alert evaluation complete — ${(summaryR.data ?? []).length} items checked`);
    } catch (err) {
      this.logger.error(`[STOCK-CRON] Error: ${(err as Error).message}`);
    }
  }

  async getExpiryAlerts(daysAhead: number = 7): Promise<Result<{ materialCardId: number; warehouseId: string; balance: number }[], AppError>> {
    try {
      const r = await this.repo.getExpiryAlerts(daysAhead);
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async adjustStock(
    materialCardId: number,
    warehouseId: string,
    newQty: number,
    adjustedBy: number,
  ): Promise<Result<LedgerRow, AppError>> {
    try {
      // Q-53 fix: this used to compute delta from the ledger's own balance and call
      // recordEntry() ONLY — it never touched warehouse_stock, so "Adjust stock" silently had
      // zero effect on the canonical balance everything else reads (getAllStockSummary,
      // getLowStock, WMS issue-guard, GL valuation). Read the canonical balance, write the
      // adjustment to warehouse_stock FIRST, then record the ledger entry (which will read back
      // the now-updated canonical balance — see recordEntry() above).
      const canonicalR = await this.repo.getCanonicalBalance(materialCardId, warehouseId);
      const current = canonicalR.ok ? canonicalR.data : 0;
      const delta = newQty - current;
      this.logger.log(`[STOCK] Adjust: mat=${materialCardId} wh=${warehouseId} delta=${delta} by=${adjustedBy}`);

      const setR = await this.repo.setCanonicalBalance(materialCardId, warehouseId, newQty);
      if (!setR.ok) return Err(setR.error);

      const r = await this.recordEntry(materialCardId, warehouseId, delta, 0, `Manual adjustment by ${adjustedBy}`);
      if (!r.ok) return Err(r.error);
      return Ok(r.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  async getConfirmations(movementId: number): Promise<Result<ConfirmRow[], AppError>> {
    try {
      const r = await this.repo.getMovementConfirmations(movementId);
      if (!r.ok) return Err(r.error);
      return Ok(r.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }

  /**
   * Record a signed movement confirmation to pos_movement_confirmations.
   * signatureHash = SHA-256 of "<userId>:<movementId>:<decision>:<isoTimestamp>"
   * — canonical spec order: userId + movementId + decision + timestamp
   *
   * POS-19 #131 (2026-07-11, owner schema-grant — Q-35): optional handedOverQty/
   * receivedQty — when a caller supplies BOTH and they differ, the recorded
   * decision is forced to 'DISPUTED' regardless of what the caller passed in
   * (no tolerance/threshold — any mismatch is a dispute per the owner grant,
   * docs/audit/_PHASE2-OWNER-DECISIONS-2026-07-11.md #131). Callers that pass
   * neither (all existing call sites) are unaffected — additive only.
   */
  async recordConfirmation(
    movementId: number,
    step: ConfirmStep,
    userId: number,
    decision: ConfirmDecision,
    comment?: string,
    ip?: string,
    handedOverQty?: number,
    receivedQty?: number,
  ): Promise<Result<ConfirmRow, AppError>> {
    try {
      const isDisputed = handedOverQty != null && receivedQty != null && handedOverQty !== receivedQty;
      const finalDecision: ConfirmDecision = isDisputed ? 'DISPUTED' : decision;

      const signedAt = new Date();
      const signaturePayload = `${userId}:${movementId}:${finalDecision}:${signedAt.toISOString()}`;
      const signatureHash = createHash('sha256').update(signaturePayload).digest('hex');

      const r = await this.repo.insertConfirmation({
        movementId,
        step,
        userId,
        decision: finalDecision,
        comment,
        signedAt,
        signatureHash,
        ip,
        handedOverQty,
        receivedQty,
      });
      if (!r.ok) return Err(r.error);
      if (isDisputed) {
        this.logger.warn(`[CONFIRM] DISPUTED: movement=${movementId} step=${step} handedOver=${handedOverQty} received=${receivedQty} user=${userId}`);
      }
      this.logger.log(`[CONFIRM] movement=${movementId} step=${step} decision=${finalDecision} user=${userId} hash=${signatureHash.slice(0, 12)}...`);
      return Ok(r.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err(AppErr('INTERNAL', message));
    }
  }
}
