/**
 * @module stock-ledger.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '@nestjs/cqrs';
import { Result, AppError, safeCall } from '@common/result';
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
    return safeCall(async () => {
      const balanceR = await this.repo.getBalance(materialCardId, warehouseId);
      const prevBalance = balanceR.ok && balanceR.data ? balanceR.data.balance : 0;
      const balanceAfter = prevBalance + qtyChange;

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
      if (!entryR.ok) throw new Error(entryR.error.message);
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

      return entry;
    });
  }

  async getBalance(materialCardId: number, warehouseId: string): Promise<Result<number, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getBalance(materialCardId, warehouseId);
      if (!r.ok) throw new Error(r.error.message);
      return r.data ? r.data.balance : 0;
    });
  }

  async getAllSummary(): Promise<Result<{ materialCardId: number; warehouseId: string; balance: number }[], AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getAllStockSummary();
      if (!r.ok) throw new Error(r.error.message);
      return r.data ?? [];
    });
  }

  async getLowAlerts(): Promise<Result<AlertRow[], AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getUnresolvedAlerts(undefined, ['LOW_STOCK', 'OUT_OF_STOCK']);
      if (!r.ok) throw new Error(r.error.message);
      return r.data ?? [];
    });
  }

  @Cron('0 * * * *', { timeZone: 'Asia/Tashkent' })
  async evaluateStockAlerts(): Promise<void> {
    try {
      const summaryR = await this.repo.getAllStockSummary();
      if (!summaryR.ok) { this.logger.warn('[STOCK-CRON] getAllStockSummary failed'); return; }
      for (const item of summaryR.data ?? []) {
        if (item.balance <= 0) {
          const r = await this.repo.insertStockAlert({ materialCardId: item.materialCardId, warehouseId: item.warehouseId, alertType: 'OUT_OF_STOCK', currentValue: item.balance, thresholdValue: 0 });
          if (r.ok) { this.emitter.emit('pos.stock.low_alert', { materialCardId: item.materialCardId, warehouseId: item.warehouseId, balance: item.balance }); }
        } else if (item.balance <= MIN_LOW_STOCK_THRESHOLD) {
          const r = await this.repo.insertStockAlert({ materialCardId: item.materialCardId, warehouseId: item.warehouseId, alertType: 'LOW_STOCK', currentValue: item.balance, thresholdValue: MIN_LOW_STOCK_THRESHOLD });
          if (r.ok) { this.emitter.emit('pos.stock.low_alert', { materialCardId: item.materialCardId, warehouseId: item.warehouseId, balance: item.balance }); }
        }
      }
      this.logger.log(`[STOCK-CRON] Stock alert evaluation complete — ${(summaryR.data ?? []).length} items checked`);
    } catch (err) {
      this.logger.error(`[STOCK-CRON] Error: ${(err as Error).message}`);
    }
  }

  async getExpiryAlerts(daysAhead: number = 7): Promise<Result<{ materialCardId: number; warehouseId: string; balance: number }[], AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getExpiryAlerts(daysAhead);
      if (!r.ok) throw new Error(r.error.message);
      return r.data ?? [];
    });
  }

  async adjustStock(
    materialCardId: number,
    warehouseId: string,
    newQty: number,
    adjustedBy: number,
  ): Promise<Result<LedgerRow, AppError>> {
    return safeCall(async () => {
      const balanceR = await this.repo.getBalance(materialCardId, warehouseId);
      const current = balanceR.ok && balanceR.data ? balanceR.data.balance : 0;
      const delta = newQty - current;
      this.logger.log(`[STOCK] Adjust: mat=${materialCardId} wh=${warehouseId} delta=${delta} by=${adjustedBy}`);
      const r = await this.recordEntry(materialCardId, warehouseId, delta, 0, `Manual adjustment by ${adjustedBy}`);
      if (!r.ok) throw new Error(r.error.message);
      return r.data;
    });
  }

  async getConfirmations(movementId: number): Promise<Result<ConfirmRow[], AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getMovementConfirmations(movementId);
      if (!r.ok) throw new Error(r.error.message ?? String(r.error));
      return r.data ?? [];
    });
  }

  /**
   * Record a signed movement confirmation to pos_movement_confirmations.
   * signatureHash = SHA-256 of "<userId>:<movementId>:<decision>:<isoTimestamp>"
   * — canonical spec order: userId + movementId + decision + timestamp
   */
  async recordConfirmation(
    movementId: number,
    step: ConfirmStep,
    userId: number,
    decision: ConfirmDecision,
    comment?: string,
    ip?: string,
  ): Promise<Result<ConfirmRow, AppError>> {
    return safeCall(async () => {
      const signedAt = new Date();
      const signaturePayload = `${userId}:${movementId}:${decision}:${signedAt.toISOString()}`;
      const signatureHash = createHash('sha256').update(signaturePayload).digest('hex');

      const r = await this.repo.insertConfirmation({
        movementId,
        step,
        userId,
        decision,
        comment,
        signedAt,
        signatureHash,
        ip,
      });
      if (!r.ok) throw new Error(r.error.message);
      this.logger.log(`[CONFIRM] movement=${movementId} step=${step} decision=${decision} user=${userId} hash=${signatureHash.slice(0, 12)}...`);
      return r.data;
    });
  }
}
