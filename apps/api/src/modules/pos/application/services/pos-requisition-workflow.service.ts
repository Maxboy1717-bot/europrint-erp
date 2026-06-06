/**
 * @module pos-requisition-workflow.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *   Helpers split into ./pos-requisition-workflow/pos-requisition.helpers.ts to satisfy Rule 16.
 *
 * POS — Requisition Workflow Service
 *   submitRequisition / approveRequisition / rejectRequisition / fulfillRequisition / cancelRequisition
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();

import {
  Injectable, Logger, BadRequestException,
  ForbiddenException, InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { posMaterialRequests } from '@workspace/db';

import { PosMovementService } from './pos-movement.service';
import { PosNotificationsService } from './pos-notifications.service';
import { EmployeeLedgerService } from './employee-ledger.service';
import { PosRequestExtRepository } from '../../infrastructure/repositories/pos-request-ext.repository';
import { PosEmployeeBalanceRepository } from '../../infrastructure/repositories/pos-employee-balance.repository';
import {
  fetchRequest, fetchLines, setStatus, reserveStock,
  releaseReservedStock, validateBarcodes,
  type RequestRow, type ReqStatus,
} from './pos-requisition-workflow/pos-requisition.helpers';

@Injectable()
export class PosRequisitionWorkflowService {
  private readonly logger = new Logger(PosRequisitionWorkflowService.name);

  constructor(
    private readonly movementService: PosMovementService,
    private readonly notifService: PosNotificationsService,
    private readonly employeeLedger: EmployeeLedgerService,
    private readonly requestExtRepo: PosRequestExtRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly balanceRepo: PosEmployeeBalanceRepository,
  ) {}

  // ─── 1. submitRequisition ─────────────────────────────────────────────────
  async submitRequisition(requestId: number, submittedById: number): Promise<Result<RequestRow, AppError>> {
    return safeCall(async () => {
      const req = await fetchRequest(requestId);
      if (req.status !== 'DRAFT') {
        throw new BadRequestException(`submitRequisition: so'rov DRAFT holatida emas — joriy holat: ${req.status}`);
      }
      if (req.requestedBy !== submittedById) {
        throw new ForbiddenException(`submitRequisition: faqat so'rov yaratuvchisi topshira oladi`);
      }
      const updated = await setStatus(requestId, 'SUBMITTED');

      // fire-and-forget: no listener by design (owner decision 2026-06-06)
      this.eventEmitter.emit('pos.requisition.submitted', {
        requestId, departmentId: req.departmentCode, requestedById: req.requestedBy,
      });
      await this.notifService.sendNotification(
        submittedById, 'REQUISITION_SUBMITTED', 'Material so\'rov topshirildi',
        `So'rov #${req.requestNumber} tasdiqlash uchun yuborildi`,
        'pos_material_requests', requestId,
      ).catch((e: unknown) => this.logger.warn(`Notify sendRequisition failed: ${String(e)}`));

      this.logger.log(`Requisition submitted: #${req.requestNumber} by userId=${submittedById}`);
      return updated;
    });
  }

  // ─── 2. approveRequisition ────────────────────────────────────────────────
  async approveRequisition(requestId: number, approverId: number, note?: string): Promise<Result<RequestRow, AppError>> {
    return safeCall(async () => {
      const req = await fetchRequest(requestId);
      if (req.status !== 'SUBMITTED') {
        throw new BadRequestException(`approveRequisition: so'rov PENDING/SUBMITTED holatida emas — joriy holat: ${req.status}`);
      }
      if (req.targetWarehouseId) {
        const reserveR = await reserveStock(requestId, String(req.targetWarehouseId), this.balanceRepo, this.logger);
        if (!reserveR.ok) throw new BadRequestException(reserveR.error.message);
      }
      const updated = await setStatus(requestId, 'APPROVED', {
        approvedBy: approverId,
        approvedAt: _time.now(),
        ...(note ? { justification: note } : {}),
      } as Partial<typeof posMaterialRequests.$inferInsert>);

      // fire-and-forget: no listener by design (owner decision 2026-06-06)
      this.eventEmitter.emit('pos.requisition.approved', {
        requestId, approverId, requestNumber: req.requestNumber,
      });
      await this.notifService.sendNotification(
        req.requestedBy, 'REQUISITION_APPROVED', 'So\'rovingiz tasdiqlandi',
        `So'rov #${req.requestNumber} tasdiqlandi${note ? ': ' + note : ''}`,
        'pos_material_requests', requestId,
      ).catch((e: unknown) => this.logger.warn(`Notify approveRequisition failed: ${String(e)}`));

      this.logger.log(`Requisition approved: #${req.requestNumber} by approverId=${approverId}`);
      return updated;
    });
  }

  // ─── 3. rejectRequisition ─────────────────────────────────────────────────
  async rejectRequisition(requestId: number, approverId: number, reason: string): Promise<Result<RequestRow, AppError>> {
    return safeCall(async () => {
      if (!reason || reason.trim().length === 0) {
        throw new BadRequestException('rejectRequisition: sabab (reason) majburiy');
      }
      const req = await fetchRequest(requestId);
      if (req.status !== 'SUBMITTED') {
        throw new BadRequestException(`rejectRequisition: so'rov PENDING/SUBMITTED holatida emas — joriy holat: ${req.status}`);
      }
      const updated = await setStatus(requestId, 'REJECTED', {
        rejectionReason: reason,
      } as Partial<typeof posMaterialRequests.$inferInsert>);

      // fire-and-forget: no listener by design (owner decision 2026-06-06)
      this.eventEmitter.emit('pos.requisition.rejected', {
        requestId, approverId, reason, requestNumber: req.requestNumber,
      });
      await this.notifService.sendNotification(
        req.requestedBy, 'REQUISITION_REJECTED', 'So\'rovingiz rad etildi',
        `So'rov #${req.requestNumber} rad etildi. Sabab: ${reason}`,
        'pos_material_requests', requestId, { reason },
      ).catch((e: unknown) => this.logger.warn(`Notify rejectRequisition failed: ${String(e)}`));

      this.logger.log(`Requisition rejected: #${req.requestNumber} by approverId=${approverId}`);
      return updated;
    });
  }

  // ─── 4. fulfillRequisition ────────────────────────────────────────────────
  async fulfillRequisition(
    requestId: number, fulfilledById: number, barcodes: string[],
  ): Promise<Result<{ request: RequestRow; movementId: number }, AppError>> {
    return safeCall(async () => {
      const req = await fetchRequest(requestId);
      if (req.status !== 'APPROVED') {
        throw new BadRequestException(`fulfillRequisition: so'rov APPROVED holatida emas — joriy holat: ${req.status}`);
      }
      if (barcodes && barcodes.length > 0) {
        const validateR = await validateBarcodes(barcodes, this.balanceRepo);
        if (!validateR.ok) throw new BadRequestException(validateR.error.message);
      }
      const requestLines = await fetchLines(requestId);

      const issueTypeR = await this.requestExtRepo.getInternalIssueTypeId();
      if (!issueTypeR || !issueTypeR.ok || !issueTypeR.data) {
        throw new InternalServerErrorException('INTERNAL_ISSUE harakati turi topilmadi');
      }

      const movLines = requestLines.map((line) => ({
        materialCardId: line.materialCardId,
        quantity: Number(line.approvedQty ?? line.requestedQty),
        unitPrice: 0,
      }));

      const movementR = await this.movementService.createMovement(
        {
          movementTypeId: Number((issueTypeR.data as { id: unknown }).id),
          fromWarehouseId: req.targetWarehouseId ? String(req.targetWarehouseId) : undefined,
          receivedByEmployeeId: req.requestedBy,
          lines: movLines,
          notes: `Requisition bajarildi: ${req.requestNumber}`,
          submit: true,
        },
        fulfilledById,
      );

      if (!movementR.ok) {
        throw new InternalServerErrorException(movementR.error.message);
      }
      const movement = movementR.data as { id: number };

      if (req.targetWarehouseId) {
        const releaseR = await releaseReservedStock(requestId, String(req.targetWarehouseId), this.balanceRepo, this.logger);
        if (!releaseR.ok) this.logger.warn(`releaseReservedStock failed (fulfillment): ${releaseR.error.message}`);
      }

      for (const line of requestLines) {
        const qty = Number(line.approvedQty ?? line.requestedQty);
        await this.employeeLedger.addEntry({
          userId: req.requestedBy,
          materialCardId: line.materialCardId,
          warehouseId: req.targetWarehouseId ? String(req.targetWarehouseId) : 'default',
          entryType: 'DEBIT',
          quantity: qty, unitPrice: 0,
          referenceType: 'pos_movement', referenceId: movement.id,
          notes: `Requisition #${req.requestNumber}`,
        });
      }

      const updated = await setStatus(requestId, 'FULLY_ISSUED', {
        posMovementId: movement.id,
      } as Partial<typeof posMaterialRequests.$inferInsert>);

      // fire-and-forget: no listener by design (owner decision 2026-06-06)
      this.eventEmitter.emit('pos.requisition.fulfilled', {
        requestId, movementId: movement.id, fulfilledById, requestNumber: req.requestNumber,
      });
      await this.notifService.sendNotification(
        req.requestedBy, 'REQUISITION_FULFILLED', 'Materialingiz berildi',
        `So'rov #${req.requestNumber} bo'yicha materiallar berildi`,
        'pos_material_requests', requestId, { movementId: movement.id },
      ).catch((e: unknown) => this.logger.warn(`Notify fulfillRequisition failed: ${String(e)}`));

      this.logger.log(`Requisition fulfilled: #${req.requestNumber} movementId=${movement.id}`);
      return { request: updated, movementId: movement.id };
    });
  }

  // ─── 5. cancelRequisition ─────────────────────────────────────────────────
  async cancelRequisition(requestId: number, cancelledById: number, reason: string): Promise<Result<RequestRow, AppError>> {
    return safeCall(async () => {
      if (!reason || reason.trim().length === 0) {
        throw new BadRequestException('cancelRequisition: sabab (reason) majburiy');
      }
      const req = await fetchRequest(requestId);
      const cancellableStatuses: ReqStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED'];
      if (!cancellableStatuses.includes(req.status as ReqStatus)) {
        throw new BadRequestException(`cancelRequisition: so'rov bekor qilib bo'lmaydi — joriy holat: ${req.status}`);
      }
      if (req.status === 'APPROVED' && req.targetWarehouseId) {
        const releaseR = await releaseReservedStock(requestId, String(req.targetWarehouseId), this.balanceRepo, this.logger);
        if (!releaseR.ok) this.logger.warn(`releaseReservedStock failed (cancellation): ${releaseR.error.message}`);
      }
      const updated = await setStatus(requestId, 'CANCELLED', {
        rejectionReason: reason,
      } as Partial<typeof posMaterialRequests.$inferInsert>);

      // fire-and-forget: no listener by design (owner decision 2026-06-06)
      this.eventEmitter.emit('pos.requisition.cancelled', {
        requestId, cancelledById, reason, requestNumber: req.requestNumber,
      });
      if (req.requestedBy !== cancelledById) {
        await this.notifService.sendNotification(
          req.requestedBy, 'REQUISITION_CANCELLED', 'So\'rovingiz bekor qilindi',
          `So'rov #${req.requestNumber} bekor qilindi. Sabab: ${reason}`,
          'pos_material_requests', requestId, { reason },
        ).catch((e: unknown) => this.logger.warn(`Notify cancelRequisition failed: ${String(e)}`));
      }

      this.logger.log(`Requisition cancelled: #${req.requestNumber} by userId=${cancelledById}`);
      return updated;
    });
  }
}
