/**
 * @module pos-movement-status.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 *   Transition table, status→step/decision maps, QC maps and DIRECTION_MAP live in
 *   pos-movement-status.constants.ts (Rule 16 — 300 line cap).
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, safeCall } from '@common/result';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { LifecycleBlockService }     from './lifecycle-block.service';
import { EmployeeLedgerService }     from './employee-ledger.service';
import { PosAuditService }           from './pos-audit.service';
import { StockLedgerService }        from './stock-ledger.service';
import { PosNotificationsService }   from './pos-notifications.service';
import { UpdateMovementStatusDto, QcDecisionDto } from '../../dto/movement.dto';
import { PosMovementStatusRepository } from '../../infrastructure/repositories/pos-movement-status.repository';
import { GlPostingLogRepository } from '../../infrastructure/repositories/gl-posting-log.repository';
import { GL_PAIRS } from './pos-gl-auto.service';
import {
  ConfirmDecision,
  isTransitionAllowed,
  statusToConfirmStep,
  statusToConfirmDecision,
  STATUS_NOTIF_MAP,
  QC_STATUS_MAP,
  QC_DECISION_MAP,
  QC_TITLE_MAP,
  QC_TYPE_MAP,
  DIRECTION_MAP,
} from './pos-movement-status.constants';

@Injectable()
export class PosMovementStatusService {
  private readonly logger = new Logger(PosMovementStatusService.name);

  constructor(
    private readonly lifecycleBlock:   LifecycleBlockService,
    private readonly employeeLedger:   EmployeeLedgerService,
    private readonly auditService:     PosAuditService,
    private readonly stockLedger:      StockLedgerService,
    private readonly notifications:    PosNotificationsService,
    private readonly eventEmitter:     EventEmitter2,
    private readonly repo:             PosMovementStatusRepository,
    private readonly glRepo:           GlPostingLogRepository,
    private readonly i18n:             I18nService,
  ) {}

  async updateStatus(movementId: number, dto: UpdateMovementStatusDto, updatedById: number, ipAddress?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const movementR = await this.repo.findMovement(movementId);
      if (!movementR.ok) throw new NotFoundException(await this.i18n.t('errors.movementNotFound', { args: { id: movementId } }));
      const movement = movementR.data as Record<string, unknown>;
      const movStatus = String(movement.status ?? '');
      if (!isTransitionAllowed(movStatus, dto.status)) {
        throw new BadRequestException(await this.i18n.t('errors.movementStatusTransitionNotAllowed', { args: { from: movStatus, to: dto.status } }));
      }
      // Completion-guard (2.2-qc-bypass-blok): quarantine_required=true bo'lsa, qc_status
      // to'ldirilmaguncha 'completed'ga o'tish TAQIQ. pending→approved→completed yo'li
      // (VALID_TRANSITIONS) avval qc_status'ni tekshirmasdan o'tkazib yuborardi — bu QC
      // bosqichini butunlay chetlab o'tishga imkon berardi (jonli: 3/4 EXTERNAL_IN
      // quarantine_required=true, qc_status=NULL, status='completed').
      if (dto.status === 'completed' && movement.quarantineRequired === true && !movement.qcStatus) {
        throw new BadRequestException(
          await this.i18n.t('errors.movementQuarantinePendingQc', { args: { id: movementId } }),
        );
      }
      const oldStatus = movStatus;
      const updated = await this.repo.updateMovementStatus(movementId, {
        status: dto.status,
        approvedBy: ['approved', 'qc_approved'].includes(dto.status) ? updatedById : undefined,
        approvedAt: ['approved', 'qc_approved'].includes(dto.status) ? _time.now() : undefined,
        cancelReason: dto.status === 'cancelled' ? dto.reason : undefined,
        updatedAt: _time.now(),
      });

      if (dto.status === 'completed') await this._processCompletedMovement(movement, updatedById);

      const step = statusToConfirmStep(dto.status);
      if (step) {
        // POS-19 #131: OMBOR bosqichida (status='approved') agar receivedQty
        // kiritilgan bo'lsa, harakat qatorlari yig'indisi (topshirilgan
        // miqdor) bilan solishtiramiz — farq bo'lsa recordConfirmation
        // decision='DISPUTED' ga o'tkazadi (nizo holati).
        let handedOverQty: number | undefined;
        let receivedQty: number | undefined;
        if (step === 'OMBOR' && dto.receivedQty != null) {
          const linesR = await this.repo.getMovementLines(movementId);
          const lines = linesR.ok && Array.isArray(linesR.data) ? linesR.data as Record<string, unknown>[] : [];
          handedOverQty = lines.reduce((s, l) => s + Number(l.quantity ?? 0), 0);
          receivedQty = dto.receivedQty;
        }
        await this.stockLedger.recordConfirmation(
          movementId, step, updatedById,
          statusToConfirmDecision(dto.status),
          dto.reason,
          ipAddress,
          handedOverQty,
          receivedQty,
        );
      }

      await this.auditService.log({
        userId: updatedById, action: 'pos.movement.status_changed', entityType: 'pos_movements',
        entityId: movementId, oldValue: { status: oldStatus }, newValue: { status: dto.status, reason: dto.reason }, ipAddress,
      });

      await this._sendStatusNotification(movement, movementId, dto, updatedById);

      this.eventEmitter.emit(`pos.movement.data.${dto.status}`, { movementId, movementNumber: movement.movementNumber, oldStatus, newStatus: dto.status, updatedById });
      return updated;
    });
  }

  private async _sendStatusNotification(
    movement: Record<string, unknown>,
    movementId: number,
    dto: UpdateMovementStatusDto,
    updatedById: number,
  ) {
    const movNum = String(movement.movementNumber ?? movementId);
    const createdBy = Number(movement.createdBy ?? updatedById);
    const notif = STATUS_NOTIF_MAP[dto.status];
    if (!notif) return;
    await this.notifications.sendNotification(
      createdBy, notif.type, notif.title, notif.bodyFmt(movNum, dto.reason), 'pos_movements', movementId,
    );
    if (dto.status === 'pending') {
      await this.notifications.broadcastNotification(
        'MOVEMENT_PENDING_APPROVAL', 'Tasdiqlash kutilmoqda',
        `Harakat ${movNum} tasdiqlash uchun kutmoqda`, 'pos_movements', movementId,
      );
    }
  }

  async recordQcDecision(dto: QcDecisionDto, qcInspectorId: number, ipAddress?: string) {
    const movementR = await this.repo.findMovement(dto.movementId);
    if (!movementR.ok) throw new NotFoundException(await this.i18n.t('errors.movementNotFound', { args: { id: dto.movementId } }));
    const movement = movementR.data as Record<string, unknown>;
    if (movement.status !== 'qc_pending') throw new BadRequestException(await this.i18n.t('errors.qcOnlyAllowedWhenPending'));

    const newStatus = QC_STATUS_MAP[dto.decision];

    const updated = await this.repo.updateQcDecision(dto.movementId, {
      status: newStatus,
      qcStatus: QC_DECISION_MAP[dto.decision],
      qcCompletedAt: _time.now(), qcCompletedBy: qcInspectorId, updatedAt: _time.now(),
    });

    await this.stockLedger.recordConfirmation(
      dto.movementId, 'QC', qcInspectorId,
      QC_DECISION_MAP[dto.decision],
      dto.notes ?? dto.rejectionReason,
      ipAddress,
    );

    await this.auditService.log({
      userId: qcInspectorId, action: `pos.qc.${dto.decision.toLowerCase()}`, entityType: 'pos_movements',
      entityId: dto.movementId, newValue: { decision: dto.decision, notes: dto.notes, rejectionReason: dto.rejectionReason }, ipAddress,
    });

    const movCreatedBy = Number((movement as Record<string, unknown>).createdBy ?? qcInspectorId);
    const movNum = String((movement as Record<string, unknown>).movementNumber ?? dto.movementId);
    await this.notifications.sendNotification(
      movCreatedBy, QC_TYPE_MAP[dto.decision], QC_TITLE_MAP[dto.decision],
      `Harakat ${movNum}: QC ${dto.decision}${dto.rejectionReason ? ` — ${dto.rejectionReason}` : ''}`,
      'pos_movements', dto.movementId,
    );

    this.eventEmitter.emit('pos.qc.decision', { movementId: dto.movementId, decision: dto.decision, qcInspectorId });
    return updated;
  }

  private async _processCompletedMovement(movement: Record<string, unknown>, processedById: number) {
    const lines = await this.repo.getMovementLines(Number(movement.id));
    const code = String(movement.movementType ?? '');
    const direction = DIRECTION_MAP[code] ?? null;
    const movType = { direction, code };

    for (const line of (lines.ok ? lines.data as Record<string, unknown>[] : [])) {
      const qty = Number(line.quantity);
      const matId = Number(line.materialCardId);
      const movId = Number(movement.id);
      const toWh = String(movement.toWarehouseId ?? '');
      const fromWh = String(movement.fromWarehouseId ?? '');

      if (movType?.direction === 'in') {
        await this.repo.upsertStockIn(matId, toWh, qty);
        await this.stockLedger.recordEntry(matId, toWh, qty, movId, `in:${movType.code}`);
      } else if (movType?.direction === 'out') {
        // VISION-3340 #57: decrementStock() now guards against overdraw at the DB level
        // (available_quantity >= qty) and reports Err(INSUFFICIENT_STOCK) when the guard
        // fails. Previously the Result was discarded here, so an overdrawn line silently
        // floored to 0 and the movement completed as if nothing had gone wrong. Abort the
        // whole completion instead of recording a ledger entry / GL posting for stock that
        // was never actually moved.
        const decR = await this.repo.decrementStock(matId, fromWh, qty);
        if (!decR.ok) {
          throw new BadRequestException(await this.i18n.t('errors.insufficientStockOrMaterialNotInWarehouse'));
        }
        await this.stockLedger.recordEntry(matId, fromWh, -qty, movId, `out:${movType.code}`);
      } else if (movType?.direction === 'transfer') {
        const decR = await this.repo.decrementStock(matId, fromWh, qty);
        if (!decR.ok) {
          throw new BadRequestException(await this.i18n.t('errors.insufficientStockOrMaterialNotInWarehouse'));
        }
        await this.repo.upsertStockIn(matId, toWh, qty);
        await this.stockLedger.recordEntry(matId, fromWh, -qty, movId, `transfer_out:${movType.code}`);
        await this.stockLedger.recordEntry(matId, toWh, qty, movId, `transfer_in:${movType.code}`);
      }

      if (movement.receivedByEmployeeId) {
        const entryType = movType?.direction === 'out' ? 'DEBIT' : 'CREDIT';
        await this.employeeLedger.addEntry({
          userId: Number(movement.receivedByEmployeeId), materialCardId: matId,
          warehouseId: String(Number(movement.toWarehouseId ?? movement.fromWarehouseId)),
          entryType, quantity: qty, unitPrice: Number(line.unitPrice ?? 0),
          referenceType: 'pos_movement', referenceId: movId,
        });
      }

      if (movement.receivedByEmployeeId && movType?.code === 'INTERNAL_ISSUE') {
        const minDaysR = await this.repo.getMaterialMinInterval(matId);
        const minDays = minDaysR.ok ? (minDaysR.data as number | null) : null;
        if (minDays != null) {
          await this.lifecycleBlock.recordIssuance(Number(movement.receivedByEmployeeId), matId, minDays);
        }
      }
    }

    await this.stockLedger.recordConfirmation(
      Number(movement.id), 'FINANCE', processedById, 'APPROVED' as ConfirmDecision,
      `Movement ${String(movement.movementNumber)} completed`,
    );

    // Leverage #4 (Variant C): GL auto-posting INLINE — NOT via the dead PosMovementCompletedEvent.
    // Publishing that event would re-run the WMS-sync listener which ALSO writes stock (already written
    // in the loop above) => double-write (the deferred FIX4 risk). Here we add ONLY the missing GL leg,
    // reusing GL_PAIRS + gl_posting_log (status=AWAITING_REVIEW; Finance reviews manually). One per movement.
    const glLines = lines.ok && Array.isArray(lines.data) ? (lines.data as Record<string, unknown>[]) : [];
    const totalValue = glLines.reduce((s, l) => s + Number(l.quantity ?? 0) * Number(l.unitPrice ?? 0), 0);
    const pairFn = GL_PAIRS[code];
    if (pairFn && totalValue > 0) {
      const glEntries = pairFn(totalValue, code);
      const glResult = await this.glRepo.insertLog({
        movementId: Number(movement.id),
        stage: 5,
        stageName: 'POST',
        status: 'AWAITING_REVIEW',
        glEntries,
        aiConfidence: null,
        processedAt: _time.now(),
      });
      if (glResult.ok) {
        this.logger.log(`[GL-AUTO] gl_posting_log yozildi: movementId=${movement.id} total=${totalValue.toFixed(2)} entries=${glEntries.length}`);
      } else {
        this.logger.error(`[GL-AUTO] GL yozishda xato (movementId=${movement.id}): ${glResult.error}`);
      }
    }

    this.logger.log(`[POS] Harakat yakunlandi: id=${movement.id} number=${movement.movementNumber}`);
  }
}
