/**
 * @module pos-movement-status.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { LifecycleBlockService }     from '../lifecycle-block.service';
import { EmployeeLedgerService }     from '../employee-ledger.service';
import { PosAuditService }           from './pos-audit.service';
import { StockLedgerService }        from './stock-ledger.service';
import { PosNotificationsService }   from './pos-notifications.service';
import { UpdateMovementStatusDto, MovementStatus, QcDecisionDto, QcDecision } from '../dto/movement.dto';
import { PosMovementStatusRepository } from './pos-movement-status.repository';
import { movementConfirmations } from '@workspace/db';

type ConfirmStep     = typeof movementConfirmations.$inferInsert['step'];
type ConfirmDecision = typeof movementConfirmations.$inferInsert['decision'];

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:        ['karantin', 'qc_pending', 'pending', 'cancelled'],
  karantin:     ['qc_pending', 'cancelled'],
  qc_pending:   ['qc_approved', 'qc_rework', 'qc_rejected'],
  qc_approved:  ['pending', 'cancelled'],
  qc_rework:    ['qc_pending'],
  qc_rejected:  ['cancelled'],
  pending:      ['approved', 'cancelled'],
  approved:     ['ai_processing', 'completed'],
  ai_processing:['completed', 'cancelled'],
  completed:    [],
  cancelled:    [],
};

function isTransitionAllowed(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Map movement status to pos_confirm_step_enum value */
function statusToConfirmStep(status: string): ConfirmStep | null {
  const map: Record<string, ConfirmStep> = {
    qc_approved:    'QC',
    qc_rejected:    'QC',
    qc_rework:      'QC',
    approved:       'OMBOR',
    ai_processing:  'AI_GL',
    completed:      'FINANCE',
  };
  return map[status] ?? null;
}

/** Map movement status or decision to pos_confirm_decision_enum value */
function statusToConfirmDecision(status: string): ConfirmDecision {
  if (status === 'qc_rejected' || status === 'cancelled') return 'REJECTED';
  if (status === 'qc_rework') return 'REWORK';
  return 'APPROVED';
}

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
  ) {}

  async updateStatus(movementId: number, dto: UpdateMovementStatusDto, updatedById: number, ipAddress?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const movementR = await this.repo.findMovement(movementId);
      if (!movementR.ok) throw new NotFoundException(`Harakat topilmadi: ${movementId}`);
      const movement = movementR.data as Record<string, unknown>;
      const movStatus = String(movement.status ?? '');
      if (!isTransitionAllowed(movStatus, dto.status)) {
        throw new BadRequestException(`${movStatus} → ${dto.status} o'tish ruxsat etilmagan`);
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
        await this.stockLedger.recordConfirmation(
          movementId, step, updatedById,
          statusToConfirmDecision(dto.status),
          dto.reason,
          ipAddress,
        );
      }

      await this.auditService.log({
        userId: updatedById, action: 'pos.movement.status_changed', entityType: 'pos_movements',
        entityId: movementId, oldValue: { status: oldStatus }, newValue: { status: dto.status, reason: dto.reason }, ipAddress,
      });

      const movNum = String(movement.movementNumber ?? movementId);
      const createdBy = Number(movement.createdBy ?? updatedById);

      const notifMap: Record<string, { type: string; title: string; body: string }> = {
        pending: {
          type: 'MOVEMENT_SUBMITTED',
          title: 'Harakat yuborildi',
          body: `Harakat ${movNum} tasdiqlash uchun yuborildi`,
        },
        qc_pending: {
          type: 'MOVEMENT_QC_PENDING',
          title: 'QC tekshiruvi kutilmoqda',
          body: `Harakat ${movNum} sifat nazoratiga yuborildi`,
        },
        qc_approved: {
          type: 'MOVEMENT_QC_PASSED',
          title: "QC tekshiruvi o'tdi",
          body: `Harakat ${movNum} sifat nazoratidan otdi`,
        },
        qc_rework: {
          type: 'MOVEMENT_QC_REWORK',
          title: 'QC qayta ishlash',
          body: `Harakat ${movNum} qayta ishlash uchun qaytarildi${dto.reason ? `: ${dto.reason}` : ''}`,
        },
        qc_rejected: {
          type: 'MOVEMENT_QC_REJECTED',
          title: 'QC rad etildi',
          body: `Harakat ${movNum} sifat nazoratidan rad etildi${dto.reason ? `: ${dto.reason}` : ''}`,
        },
        approved: {
          type: 'MOVEMENT_APPROVED',
          title: 'Harakat tasdiqlandi',
          body: `Harakat ${movNum} ombor mudiri tomonidan tasdiqlandi`,
        },
        ai_processing: {
          type: 'MOVEMENT_AI_PROCESSING',
          title: 'AI qayta ishlash',
          body: `Harakat ${movNum} AI tomonidan qayta ishlanmoqda`,
        },
        completed: {
          type: 'MOVEMENT_COMPLETED',
          title: 'Harakat yakunlandi',
          body: `Harakat ${movNum} muvaffaqiyatli yakunlandi`,
        },
        cancelled: {
          type: 'MOVEMENT_CANCELLED',
          title: 'Harakat bekor qilindi',
          body: `Harakat ${movNum} bekor qilindi${dto.reason ? `: ${dto.reason}` : ''}`,
        },
      };

      const notif = notifMap[dto.status];
      if (notif) {
        await this.notifications.sendNotification(
          createdBy, notif.type, notif.title, notif.body, 'pos_movements', movementId,
        );
        if (dto.status === 'pending') {
          await this.notifications.broadcastNotification(
            'MOVEMENT_PENDING_APPROVAL', 'Tasdiqlash kutilmoqda',
            `Harakat ${movNum} tasdiqlash uchun kutmoqda`, 'pos_movements', movementId,
          );
        }
      }

      this.eventEmitter.emit(`pos.movement.data.${dto.status}`, { movementId, movementNumber: movement.movementNumber, oldStatus, newStatus: dto.status, updatedById });
      return updated;
    });
  }

  async recordQcDecision(dto: QcDecisionDto, qcInspectorId: number, ipAddress?: string) {
    const movementR = await this.repo.findMovement(dto.movementId);
    if (!movementR.ok) throw new NotFoundException(`Harakat topilmadi: ${dto.movementId}`);
    const movement = movementR.data as Record<string, unknown>;
    if (movement.status !== 'qc_pending') throw new BadRequestException('QC faqat qc_pending holatida amalga oshiriladi');

    const statusMap: Record<QcDecision, MovementStatus> = {
      [QcDecision.APPROVED]: MovementStatus.QC_APPROVED,
      [QcDecision.REWORK]: MovementStatus.QC_REWORK,
      [QcDecision.REJECTED]: MovementStatus.QC_REJECTED,
    };
    const newStatus = statusMap[dto.decision];

    const updated = await this.repo.updateQcDecision(dto.movementId, {
      status: newStatus,
      qcStatus: dto.decision === QcDecision.APPROVED ? 'APPROVED' : dto.decision === QcDecision.REWORK ? 'REWORK' : 'REJECTED',
      qcCompletedAt: _time.now(), qcCompletedBy: qcInspectorId, updatedAt: _time.now(),
    });

    const decisionMap: Record<QcDecision, ConfirmDecision> = {
      [QcDecision.APPROVED]: 'APPROVED',
      [QcDecision.REWORK]:   'REWORK',
      [QcDecision.REJECTED]: 'REJECTED',
    };
    await this.stockLedger.recordConfirmation(
      dto.movementId, 'QC', qcInspectorId,
      decisionMap[dto.decision],
      dto.notes ?? dto.rejectionReason,
      ipAddress,
    );

    await this.auditService.log({
      userId: qcInspectorId, action: `pos.qc.${dto.decision.toLowerCase()}`, entityType: 'pos_movements',
      entityId: dto.movementId, newValue: { decision: dto.decision, notes: dto.notes, rejectionReason: dto.rejectionReason }, ipAddress,
    });

    const movCreatedBy = Number((movement as Record<string, unknown>).createdBy ?? qcInspectorId);
    const movNum = String((movement as Record<string, unknown>).movementNumber ?? dto.movementId);
    const qcTitleMap: Record<QcDecision, string> = {
      [QcDecision.APPROVED]: 'QC tasdiqladi',
      [QcDecision.REWORK]:   'QC qayta ishlash',
      [QcDecision.REJECTED]: 'QC rad etdi',
    };
    const qcTypeMap: Record<QcDecision, string> = {
      [QcDecision.APPROVED]: 'QC_APPROVED',
      [QcDecision.REWORK]:   'QC_REWORK',
      [QcDecision.REJECTED]: 'QC_REJECTED',
    };
    await this.notifications.sendNotification(
      movCreatedBy, qcTypeMap[dto.decision], qcTitleMap[dto.decision],
      `Harakat ${movNum}: QC ${dto.decision}${dto.rejectionReason ? ` — ${dto.rejectionReason}` : ''}`,
      'pos_movements', dto.movementId,
    );

    this.eventEmitter.emit('pos.qc.decision', { movementId: dto.movementId, decision: dto.decision, qcInspectorId });
    return updated;
  }

  private static readonly DIRECTION_MAP: Record<string, 'in' | 'out' | 'transfer'> = {
    EXTERNAL_IN:          'in',
    INTERNAL_RETURN:      'in',
    INVENTORY_ADJ_PLUS:   'in',
    EXTERNAL_OUT:         'out',
    INTERNAL_ISSUE:       'out',
    DAMAGE:               'out',
    INVENTORY_ADJ_MINUS:  'out',
    INTERNAL_TRANSFER:    'transfer',
  };

  private async _processCompletedMovement(movement: Record<string, unknown>, processedById: number) {
    const lines = await this.repo.getMovementLines(Number(movement.id));
    const code = String(movement.movementType ?? '');
    const direction = PosMovementStatusService.DIRECTION_MAP[code] ?? null;
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
        await this.repo.decrementStock(matId, fromWh, qty);
        await this.stockLedger.recordEntry(matId, fromWh, -qty, movId, `out:${movType.code}`);
      } else if (movType?.direction === 'transfer') {
        await this.repo.decrementStock(matId, fromWh, qty);
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
      Number(movement.id), 'FINANCE', processedById, 'APPROVED',
      `Movement ${String(movement.movementNumber)} completed`,
    );

    this.logger.log(`[POS] Harakat yakunlandi: id=${movement.id} number=${movement.movementNumber}`);
  }
}
