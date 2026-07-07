/**
 * quarantine-workflow.service.ts
 *
 * EXTERNAL_IN to'liq workflow:
 *   DRAFT → KARANTIN → QC_REVIEW → APPROVED → COMPLETED
 */
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, Ok, Err, AppError } from '@common/result';
import { getConfigString } from '@common/config/business-config.helper';
import { QuarantineWorkflowRepository } from '../../infrastructure/repositories/quarantine-workflow.repository';
import { StockLedgerService } from './stock-ledger.service';

// MN-1 (Magic-Numbers Independent Verification 2026-07-07, M6 2/4 gap): quarantine
// routing warehouse codes are now settings-table-tunable -- fall back to the prior
// hardcoded codes when unset. NOTE: 'raw_material' type currently has 2 active
// warehouses (RM-MAIN + RM-ROLLS) live, so a type-based lookup would be ambiguous;
// the code itself (not the type) remains the correct, owner-tunable identifier.
const QUARANTINE_HOLD_WAREHOUSE_CODE_DEFAULT = 'QC-HOLD';
const QUARANTINE_SOURCE_WAREHOUSE_CODE_DEFAULT = 'RM-MAIN';

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

  constructor(
    private readonly repo: QuarantineWorkflowRepository,
    private readonly stockLedger: StockLedgerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async moveToQuarantine(movementId: number): Promise<Result<void, AppError>> {
    try {
      const qcCode = await getConfigString('quarantine_hold_warehouse_code', QUARANTINE_HOLD_WAREHOUSE_CODE_DEFAULT);
      const qcWh = await this.repo.findQcHoldWarehouse(qcCode);
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

      const movBefore = await this.repo.findMovementBasic(movementId);

      await this.repo.updateInventoryPassport(movementId, decision, qcNote ?? null);
      await this.repo.updateMovementStatus(movementId, targetStatus, {
        qcStatus: decision, qcCompletedAt: true, qcCompletedBy: inspectorId,
      });
      this.logger.log(`[QC] Movement ${movementId}: ${decision} → status='${targetStatus}'`);

      if (decision === 'QABUL') {
        const sourceCode = await getConfigString('quarantine_source_warehouse_code', QUARANTINE_SOURCE_WAREHOUSE_CODE_DEFAULT);
        const qcCode = await getConfigString('quarantine_hold_warehouse_code', QUARANTINE_HOLD_WAREHOUSE_CODE_DEFAULT);
        const whs = await this.repo.findWarehousesByCode([sourceCode, qcCode]);
        const mainWh = whs.find(w => w.code === sourceCode);
        const qcWh   = whs.find(w => w.code === qcCode);

        if (mainWh && qcWh) {
          await this.repo.updateMovementStatus(movementId, targetStatus, { toWarehouseId: mainWh.id });
          const lines = await this.repo.findMovementLines(movementId);
          let moved = 0;
          for (const line of lines) {
            const qty = Number(line.quantity);
            if (!Number.isFinite(qty) || qty <= 0) continue;
            // C1.6: a guard failure means QC-HOLD doesn't actually have this much stock to move —
            // do not credit RM-MAIN with quantity that was never actually debited from QC-HOLD.
            const reduced = await this.repo.reduceWarehouseStock(qcWh.id, line.material_card_id, qty);
            if (!reduced) {
              this.logger.warn(`[QC] Movement ${movementId}: QC-HOLD'da material #${line.material_card_id} uchun yetarli qoldiq yo'q (so'ralgan ${qty}) — bu qator o'tkazib yuborildi`);
              continue;
            }
            await this.repo.upsertWarehouseStock(mainWh.id, line.material_card_id, qty, line.unit);
            moved++;
          }
          this.logger.log(`[QC] ✅ Movement ${movementId}: ${moved} ta material QC-HOLD → RM-MAIN ga ko'chirildi`);
        }
      }

      if (decision === 'CHIQARISH') {
        const qcCode = await getConfigString('quarantine_hold_warehouse_code', QUARANTINE_HOLD_WAREHOUSE_CODE_DEFAULT);
        const qcWh = await this.repo.findQcHoldWarehouse(qcCode);
        if (qcWh) {
          const lines = await this.repo.findMovementLines(movementId);
          for (const line of lines) {
            const qty = Number(line.quantity);
            if (qty <= 0) continue;
            // C1.6: same guard as the QABUL branch above — log rather than silently clamp.
            const reduced = await this.repo.reduceWarehouseStock(qcWh.id, line.material_card_id, qty);
            if (!reduced) {
              this.logger.warn(`[QC] Movement ${movementId}: QC-HOLD'da material #${line.material_card_id} uchun yetarli qoldiq yo'q (so'ralgan ${qty}) — bu qator o'tkazib yuborildi`);
            }
          }
          this.logger.log(`[QC] Movement ${movementId}: CHIQARISH — QC-HOLD dan stok qaytarildi`);
        }
      }

      // Audit-trail: 'karantin'/'qc_review' bosqichida qilingan QC qarorini ham
      // "Tasdiqlash Bosqichlari" (movement_confirmations) jadvaliga yozamiz — avval
      // faqat rasmiy qc_pending yo'li orqali kelgan qarorlar yozilardi (World-1),
      // karantin-QC (World-2) qarori umuman ro'yxatga olinmasdi.
      const confirmDecision = decision === 'CHIQARISH' ? 'REJECTED' : decision === 'REWORK' ? 'REWORK' : 'APPROVED';
      await this.stockLedger.recordConfirmation(movementId, 'QC', inspectorId, confirmDecision, qcNote);

      // KARANTIN→QC qabul qilingan kirimni OMBOR_MENEJER + AI_GL bosqichlariga ulash:
      // bu ikki bosqich allaqachon 'pos.movement.data.approved' hodisa-tinglovchisi orqali
      // qurilgan (AutoGL posting, 3-way match, MES signali, ai_processing belgisi) — lekin
      // karantin oqimi (bu servis) hech qachon shu hodisani chiqarmagani uchun ular hech qachon
      // ishga tushmagan edi. Faqat qo'shildi — mavjud QC qarori (targetStatus) o'zgarmadi (Q-39).
      if (targetStatus === 'approved' && movBefore) {
        this.eventEmitter.emit('pos.movement.data.approved', {
          movementId,
          movementNumber: movBefore.movement_number,
          oldStatus: movBefore.status,
          newStatus: targetStatus,
          updatedById: inspectorId,
        });
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
