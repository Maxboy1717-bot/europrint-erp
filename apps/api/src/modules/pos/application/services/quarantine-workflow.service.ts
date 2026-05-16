/**
 * quarantine-workflow.service.ts
 *
 * EXTERNAL_IN to'liq workflow:
 *   DRAFT → KARANTIN → QC_REVIEW → APPROVED → COMPLETED
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import { QuarantineWorkflowRepository } from '../../infrastructure/repositories/quarantine-workflow.repository';

export type MovementStatus =
  | 'draft' | 'pending' | 'karantin' | 'qc_review'
  | 'approved' | 'rejected' | 'completed' | 'cancelled';

export const STATUS_FLOW: Record<string, MovementStatus[]> = {
  draft:     ['pending', 'karantin', 'cancelled'],
  pending:   ['karantin', 'qc_review', 'approved', 'rejected', 'cancelled'],
  karantin:  ['qc_review', 'cancelled'],
  qc_review: ['approved', 'rejected', 'cancelled'],
  approved:  ['completed', 'cancelled'],
  rejected:  ['cancelled'],
  completed: [],
  cancelled: [],
};

@Injectable()
export class QuarantineWorkflowService {
  private readonly logger = new Logger(QuarantineWorkflowService.name);

  constructor(private readonly repo: QuarantineWorkflowRepository) {}

  async moveToQuarantine(movementId: number): Promise<Result<void, AppError>> {
    try {
      const qcWh = await this.repo.findQcHoldWarehouse();
      if (!qcWh) {
        this.logger.warn('[Quarantine] QC-HOLD ombor topilmadi');
        return Err({ message: 'QC-HOLD ombor topilmadi', code: 'NOT_FOUND' });
      }

      await this.repo.updateMovementStatus(movementId, 'karantin', {
        toWarehouseId: qcWh.id,
        quarantineRequired: true,
      });
      this.logger.log(`[Quarantine] Movement ${movementId} → 'karantin' (QC-HOLD ${qcWh.id})`);

      const lines = await this.repo.findMovementLines(movementId);
      let stockAdded = 0;
      for (const line of lines) {
        const qty = Number(line.quantity);
        if (!Number.isFinite(qty) || qty <= 0) continue;
        await this.repo.upsertWarehouseStock(qcWh.id, line.material_card_id, qty, line.unit);
        stockAdded++;
      }

      this.logger.log(`[Quarantine] ✅ Movement ${movementId}: ${stockAdded} ta material QC-HOLD omborga qo'shildi`);
      return Ok(undefined);
    } catch (e) {
      this.logger.error(`[Quarantine] xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async escalateExpiredQuarantine(): Promise<Result<{ moved: number }, AppError>> {
    try {
      const rows = await this.repo.escalateExpiredQuarantine();
      if (rows.length > 0) {
        this.logger.log(`[Quarantine Cron] ${rows.length} ta movement → 'qc_review' ga ko'chirildi`);
        for (const row of rows) {
          this.logger.log(`   - ${row.movement_number} (id=${row.id})`);
        }
      }
      return Ok({ moved: rows.length });
    } catch (e) {
      this.logger.error(`[Quarantine Cron] xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async qcDecision(
    movementId: number,
    decision: 'QABUL' | 'REWORK' | 'CHIQARISH',
    qcNote: string | undefined,
    inspectorId: number,
  ): Promise<Result<void, AppError>> {
    try {
      const targetStatus: MovementStatus =
        decision === 'QABUL'  ? 'approved' :
        decision === 'REWORK' ? 'approved' :
        'rejected';

      await this.repo.updateInventoryPassport(movementId, decision, qcNote ?? null);
      await this.repo.updateMovementStatus(movementId, targetStatus, {
        qcStatus: decision, qcCompletedAt: true, qcCompletedBy: inspectorId,
      });
      this.logger.log(`[QC] Movement ${movementId}: ${decision} → status='${targetStatus}'`);

      if (decision === 'QABUL') {
        const whs = await this.repo.findWarehousesByCode(['RM-MAIN', 'QC-HOLD']);
        const mainWh = whs.find(w => w.code === 'RM-MAIN');
        const qcWh   = whs.find(w => w.code === 'QC-HOLD');

        if (mainWh && qcWh) {
          await this.repo.updateMovementStatus(movementId, targetStatus, { toWarehouseId: mainWh.id });
          const lines = await this.repo.findMovementLines(movementId);
          let moved = 0;
          for (const line of lines) {
            const qty = Number(line.quantity);
            if (!Number.isFinite(qty) || qty <= 0) continue;
            await this.repo.reduceWarehouseStock(qcWh.id, line.material_card_id, qty);
            await this.repo.upsertWarehouseStock(mainWh.id, line.material_card_id, qty, line.unit);
            moved++;
          }
          this.logger.log(`[QC] ✅ Movement ${movementId}: ${moved} ta material QC-HOLD → RM-MAIN ga ko'chirildi`);
        }
      }

      if (decision === 'CHIQARISH') {
        const qcWh = await this.repo.findQcHoldWarehouse();
        if (qcWh) {
          const lines = await this.repo.findMovementLines(movementId);
          for (const line of lines) {
            const qty = Number(line.quantity);
            if (qty > 0) await this.repo.reduceWarehouseStock(qcWh.id, line.material_card_id, qty);
          }
          this.logger.log(`[QC] Movement ${movementId}: CHIQARISH — QC-HOLD dan stok qaytarildi`);
        }
      }

      return Ok(undefined);
    } catch (e) {
      this.logger.error(`[QC] xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async listQuarantine(): Promise<Result<unknown[], AppError>> {
    try {
      const rows = await this.repo.listQuarantine();
      return Ok(rows ?? []);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
