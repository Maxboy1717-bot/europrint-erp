/**
 * @module pos-requisition-workflow.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * POS — Requisition Workflow Service
 *
 * To'liq so'rov ish jarayoni:
 *   DRAFT → PENDING → APPROVED → FULFILLED
 *                  ↘ REJECTED
 *   DRAFT/PENDING/APPROVED → CANCELLED
 *
 * submitRequisition   — xodim so'rovni topshiradi (DRAFT→PENDING)
 * approveRequisition  — bo'lim mudiri tasdiqlaydi  (PENDING→APPROVED)
 * rejectRequisition   — rad etadi                  (PENDING→REJECTED)
 * fulfillRequisition  — ombor xodimi beradi         (APPROVED→FULFILLED)
 * cancelRequisition   — bekor qiladi               (DRAFT/PENDING/APPROVED→CANCELLED)
 */

import {
  Injectable, Logger, BadRequestException,
  NotFoundException, ForbiddenException, InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';

import {
  posMaterialRequests, posMaterialRequestLines,
  db, eq,
} from '@workspace/db';

import { PosMovementService }           from './pos-movement.service';
import { PosNotificationsService }      from './pos-notifications.service';
import { EmployeeLedgerService }        from '../employee-ledger.service';
import { PosRequestExtRepository }      from '../pos-request-ext.repository';
import { PosEmployeeBalanceRepository } from '../repositories/pos-employee-balance.repository';

// DB row short types
type RequestRow = typeof posMaterialRequests.$inferSelect;
type LineRow    = typeof posMaterialRequestLines.$inferSelect;

// Status literals used in this module
type ReqStatus =
  | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  | 'FULLY_ISSUED' | 'CANCELLED' | 'PARTIALLY_ISSUED';

@Injectable()
export class PosRequisitionWorkflowService {
  private readonly logger = new Logger(PosRequisitionWorkflowService.name);

  constructor(
    private readonly movementService:    PosMovementService,
    private readonly notifService:       PosNotificationsService,
    private readonly employeeLedger:     EmployeeLedgerService,
    private readonly requestExtRepo:     PosRequestExtRepository,
    private readonly eventEmitter:       EventEmitter2,
    private readonly balanceRepo:        PosEmployeeBalanceRepository,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async fetchRequest(requestId: number): Promise<RequestRow> {
    const [req] = await db
      .select()
      .from(posMaterialRequests)
      .where(eq(posMaterialRequests.id, requestId));
    if (!req) throw new NotFoundException(`So'rov topilmadi: ${requestId}`);
    return req;
  }

  private async fetchLines(requestId: number): Promise<LineRow[]> {
    return db
      .select()
      .from(posMaterialRequestLines)
      .where(eq(posMaterialRequestLines.requestId, requestId));
  }

  private async setStatus(
    requestId: number,
    status: ReqStatus,
    extra?: Partial<typeof posMaterialRequests.$inferInsert>,
  ): Promise<RequestRow> {
    const [updated] = await db
      .update(posMaterialRequests)
      .set({ status: status as ReqStatus, updatedAt: _time.now(), ...extra } as Partial<typeof posMaterialRequests.$inferInsert>)
      .where(eq(posMaterialRequests.id, requestId))
      .returning();
    return updated;
  }

  // ─── reserveStock ──────────────────────────────────────────────────────────

  private async reserveStock(requestId: number, warehouseId: string): Promise<void> {
    const lines = await this.fetchLines(requestId);
    for (const line of lines) {
      const qty = Number(line.approvedQty ?? line.requestedQty);
      await this.balanceRepo.reserveStock(warehouseId, Number(line.materialCardId), qty);
    }
    this.logger.debug(`Stock reserved for request ${requestId} in warehouse ${warehouseId}`);
  }

  // ─── releaseReservedStock ─────────────────────────────────────────────────

  private async releaseReservedStock(requestId: number, warehouseId: string): Promise<void> {
    const lines = await this.fetchLines(requestId);
    for (const line of lines) {
      const qty = Number(line.approvedQty ?? line.requestedQty);
      await this.balanceRepo.releaseStock(warehouseId, Number(line.materialCardId), qty);
    }
    this.logger.debug(`Stock reservation released for request ${requestId}`);
  }

  // ─── validateBarcodes ─────────────────────────────────────────────────────

  private async validateBarcodes(barcodes: string[]): Promise<void> {
    for (const barcode of barcodes) {
      const exists = await this.balanceRepo.barcodeExists(barcode);
      if (!exists) throw new BadRequestException(`Barcode topilmadi: ${barcode}`);
    }
  }

  // ─── 1. submitRequisition ─────────────────────────────────────────────────

  async submitRequisition(
    requestId: number,
    submittedById: number,
  ): Promise<Result<RequestRow, AppError>> {
    return safeCall(async () => {
      const req = await this.fetchRequest(requestId);

      if (req.status !== 'DRAFT') {
        throw new BadRequestException(
          `submitRequisition: so'rov DRAFT holatida emas — joriy holat: ${req.status}`,
        );
      }

      if (req.requestedBy !== submittedById) {
        throw new ForbiddenException(
          `submitRequisition: faqat so'rov yaratuvchisi topshira oladi`,
        );
      }

      const updated = await this.setStatus(requestId, 'SUBMITTED');

      this.eventEmitter.emit('pos.requisition.submitted', {
        requestId,
        departmentId:  req.departmentCode,
        requestedById: req.requestedBy,
      });

      // Notify department manager (best-effort)
      await this.notifService.sendNotification(
        submittedById,
        'REQUISITION_SUBMITTED',
        'Material so\'rov topshirildi',
        `So'rov #${req.requestNumber} tasdiqlash uchun yuborildi`,
        'pos_material_requests',
        requestId,
      ).catch((e: unknown) => this.logger.warn(`Notify sendRequisition failed: ${String(e)}`));

      this.logger.log(`Requisition submitted: #${req.requestNumber} by userId=${submittedById}`);
      return updated;
    });
  }

  // ─── 2. approveRequisition ────────────────────────────────────────────────

  async approveRequisition(
    requestId: number,
    approverId: number,
    note?: string,
  ): Promise<Result<RequestRow, AppError>> {
    return safeCall(async () => {
      const req = await this.fetchRequest(requestId);

      if (req.status !== 'SUBMITTED') {
        throw new BadRequestException(
          `approveRequisition: so'rov PENDING/SUBMITTED holatida emas — joriy holat: ${req.status}`,
        );
      }

      // Reserve stock in the target warehouse
      if (req.targetWarehouseId) {
        await this.reserveStock(requestId, String(req.targetWarehouseId));
      }

      const updated = await this.setStatus(requestId, 'APPROVED', {
        approvedBy: approverId,
        approvedAt: _time.now(),
        ...(note ? { justification: note } : {}),
      } as Partial<typeof posMaterialRequests.$inferInsert>);

      this.eventEmitter.emit('pos.requisition.approved', {
        requestId,
        approverId,
        requestNumber: req.requestNumber,
      });

      // Notify requester
      await this.notifService.sendNotification(
        req.requestedBy,
        'REQUISITION_APPROVED',
        'So\'rovingiz tasdiqlandi',
        `So'rov #${req.requestNumber} tasdiqlandi${note ? ': ' + note : ''}`,
        'pos_material_requests',
        requestId,
      ).catch((e: unknown) => this.logger.warn(`Notify approveRequisition failed: ${String(e)}`));

      this.logger.log(`Requisition approved: #${req.requestNumber} by approverId=${approverId}`);
      return updated;
    });
  }

  // ─── 3. rejectRequisition ─────────────────────────────────────────────────

  async rejectRequisition(
    requestId: number,
    approverId: number,
    reason: string,
  ): Promise<Result<RequestRow, AppError>> {
    return safeCall(async () => {
      if (!reason || reason.trim().length === 0) {
        throw new BadRequestException('rejectRequisition: sabab (reason) majburiy');
      }

      const req = await this.fetchRequest(requestId);

      if (req.status !== 'SUBMITTED') {
        throw new BadRequestException(
          `rejectRequisition: so'rov PENDING/SUBMITTED holatida emas — joriy holat: ${req.status}`,
        );
      }

      const updated = await this.setStatus(requestId, 'REJECTED', {
        rejectionReason: reason,
      } as Partial<typeof posMaterialRequests.$inferInsert>);

      this.eventEmitter.emit('pos.requisition.rejected', {
        requestId,
        approverId,
        reason,
        requestNumber: req.requestNumber,
      });

      // Notify requester with reason
      await this.notifService.sendNotification(
        req.requestedBy,
        'REQUISITION_REJECTED',
        'So\'rovingiz rad etildi',
        `So'rov #${req.requestNumber} rad etildi. Sabab: ${reason}`,
        'pos_material_requests',
        requestId,
        { reason },
      ).catch((e: unknown) => this.logger.warn(`Notify rejectRequisition failed: ${String(e)}`));

      this.logger.log(`Requisition rejected: #${req.requestNumber} by approverId=${approverId}`);
      return updated;
    });
  }

  // ─── 4. fulfillRequisition ────────────────────────────────────────────────

  async fulfillRequisition(
    requestId: number,
    fulfilledById: number,
    barcodes: string[],
  ): Promise<Result<{ request: RequestRow; movementId: number }, AppError>> {
    return safeCall(async () => {
      const req = await this.fetchRequest(requestId);

      if (req.status !== 'APPROVED') {
        throw new BadRequestException(
          `fulfillRequisition: so'rov APPROVED holatida emas — joriy holat: ${req.status}`,
        );
      }

      // Validate each scanned barcode
      if (barcodes && barcodes.length > 0) {
        await this.validateBarcodes(barcodes);
      }

      const requestLines = await this.fetchLines(requestId);

      // Resolve INTERNAL_ISSUE movement type id
      const issueTypeR = await this.requestExtRepo.getInternalIssueTypeId();
      if (!issueTypeR || !issueTypeR.ok || !issueTypeR.data) {
        throw new InternalServerErrorException('INTERNAL_ISSUE harakati turi topilmadi');
      }

      // Build movement lines from request lines (approved qty or requested qty)
      const movLines = requestLines.map((line) => ({
        materialCardId: line.materialCardId,
        quantity:       Number(line.approvedQty ?? line.requestedQty),
        unitPrice:      0,
      }));

      // Create INTERNAL_ISSUE movement (auto-submitted to pending)
      const movementR = await this.movementService.createMovement(
        {
          movementTypeId:       Number((issueTypeR.data as { id: unknown }).id),
          fromWarehouseId:      req.targetWarehouseId ? String(req.targetWarehouseId) : undefined,
          receivedByEmployeeId: req.requestedBy,
          lines:                movLines,
          notes:                `Requisition bajarildi: ${req.requestNumber}`,
          submit:               true,
        },
        fulfilledById,
      );

      if (!movementR.ok) {
        throw new InternalServerErrorException(movementR.error.message);
      }
      const movement = movementR.data as { id: number };

      // Release reserved stock
      if (req.targetWarehouseId) {
        await this.releaseReservedStock(requestId, String(req.targetWarehouseId));
      }

      // Add DEBIT entry to employee ledger for each line
      for (const line of requestLines) {
        const qty = Number(line.approvedQty ?? line.requestedQty);
        await this.employeeLedger.addEntry({
          userId:        req.requestedBy,
          materialCardId: line.materialCardId,
          warehouseId:   req.targetWarehouseId ? String(req.targetWarehouseId) : 'default',
          entryType:     'DEBIT',
          quantity:      qty,
          unitPrice:     0,
          referenceType: 'pos_movement',
          referenceId:   movement.id,
          notes:         `Requisition #${req.requestNumber}`,
        });
      }

      // Mark request as FULLY_ISSUED and link the movement
      const updated = await this.setStatus(requestId, 'FULLY_ISSUED', {
        posMovementId: movement.id,
      } as Partial<typeof posMaterialRequests.$inferInsert>);

      this.eventEmitter.emit('pos.requisition.fulfilled', {
        requestId,
        movementId: movement.id,
        fulfilledById,
        requestNumber: req.requestNumber,
      });

      // Notify requester: "Materialingiz berildi"
      await this.notifService.sendNotification(
        req.requestedBy,
        'REQUISITION_FULFILLED',
        'Materialingiz berildi',
        `So'rov #${req.requestNumber} bo'yicha materiallar berildi`,
        'pos_material_requests',
        requestId,
        { movementId: movement.id },
      ).catch((e: unknown) => this.logger.warn(`Notify fulfillRequisition failed: ${String(e)}`));

      this.logger.log(`Requisition fulfilled: #${req.requestNumber} movementId=${movement.id}`);
      return { request: updated, movementId: movement.id };
    });
  }

  // ─── 5. cancelRequisition ─────────────────────────────────────────────────

  async cancelRequisition(
    requestId: number,
    cancelledById: number,
    reason: string,
  ): Promise<Result<RequestRow, AppError>> {
    return safeCall(async () => {
      if (!reason || reason.trim().length === 0) {
        throw new BadRequestException('cancelRequisition: sabab (reason) majburiy');
      }

      const req = await this.fetchRequest(requestId);

      const cancellableStatuses: ReqStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED'];
      if (!cancellableStatuses.includes(req.status as ReqStatus)) {
        throw new BadRequestException(
          `cancelRequisition: so'rov bekor qilib bo'lmaydi — joriy holat: ${req.status}`,
        );
      }

      // If APPROVED, release reserved stock first
      if (req.status === 'APPROVED' && req.targetWarehouseId) {
        await this.releaseReservedStock(requestId, String(req.targetWarehouseId));
      }

      const updated = await this.setStatus(requestId, 'CANCELLED', {
        rejectionReason: reason,
      } as Partial<typeof posMaterialRequests.$inferInsert>);

      this.eventEmitter.emit('pos.requisition.cancelled', {
        requestId,
        cancelledById,
        reason,
        requestNumber: req.requestNumber,
      });

      // Notify requester (if cancelled by someone else)
      if (req.requestedBy !== cancelledById) {
        await this.notifService.sendNotification(
          req.requestedBy,
          'REQUISITION_CANCELLED',
          'So\'rovingiz bekor qilindi',
          `So'rov #${req.requestNumber} bekor qilindi. Sabab: ${reason}`,
          'pos_material_requests',
          requestId,
          { reason },
        ).catch((e: unknown) => this.logger.warn(`Notify cancelRequisition failed: ${String(e)}`));
      }

      this.logger.log(`Requisition cancelled: #${req.requestNumber} by userId=${cancelledById}`);
      return updated;
    });
  }
}
