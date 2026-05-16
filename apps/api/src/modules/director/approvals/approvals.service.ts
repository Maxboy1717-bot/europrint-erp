/**
 * @module approvals.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { approvalRequests } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { ApprovalsRepository } from './approvals.repository';
import { ApprovalRequestedEvent } from '../domain/events/approval-requested.event';
import { ApprovalApprovedEvent } from '../domain/events/approval-approved.event';
import { ApprovalRejectedEvent } from '../domain/events/approval-rejected.event';

export const HITL_THRESHOLDS = {
  PURCHASE_ORDER_HIGH_VALUE: 50_000_000,
  PAYMENT_HIGH_VALUE: 100_000_000,
  DISCOUNT_PERCENT_MAX: 15,
  MRO_REPAIR_HIGH_VALUE: 20_000_000,
  INVENTORY_WRITEOFF_HIGH_VALUE: 10_000_000,
  EMPLOYEE_TARDINESS_MINUTES: 60,
};

const APPROVER_ROLES: Record<string, string[]> = {
  purchase_order: ['purchase_manager', 'director'],
  payment: ['cfo', 'director'],
  discount: ['sales_director'],
  mro_repair: ['maintenance_manager'],
  inventory_writeoff: ['warehouse_manager'],
  discount_override: ['sales_director'],
};

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);
  constructor(
    private readonly repo: ApprovalsRepository,
    @Optional() private readonly eventBus?: EventBus,
  ) {}

  async createApprovalRequest(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      this.logger.log(`approvals: yaratilmoqda`);
      const existing = await this.repo.findExistingPending(
        String(dto['documentType'] ?? ''),
        String(dto['documentId'] ?? ''),
      );
      if (existing.ok && existing.data) {
        const existingRow = existing.data as Record<string, unknown>;
        return { approvalRequestId: existingRow['id'], isNew: false, approverRoles: APPROVER_ROLES[String(dto['documentType'])] || ['manager'], ...existingRow };
      }

      const record = await this.repo.create({ ...dto, status: 'pending' } as typeof approvalRequests.$inferInsert);
      const approverRoles = APPROVER_ROLES[String(dto['documentType'])] || ['manager'];

      const approvalRequestId = (record.data as Record<string, unknown>)['id'] as number | string;
      if (this.eventBus) {
        await this.eventBus.publish(new ApprovalRequestedEvent(
          approvalRequestId,
          { ...(record.data as Record<string, unknown>), ...dto },
        ));
      }

      return { approvalRequestId, isNew: true, approverRoles, ...(record.data as Record<string, unknown>), ...dto };
    });
  }

  async approve(id: number, approvedBy: string, notes?: string) {
    return safeCall(async () => {
      this.logger.log(`Tasdiqlash so'rovi qabul qilinmoqda id=${id}`);
      const row = await this.repo.findById(id);
      if (!row) throw new NotFoundException(`Tasdiqlash #${id} topilmadi`);
      if ((row as Record<string, unknown>)['status'] === 'approved') throw new BadRequestException(`Tasdiqlash #${id} allaqachon approved`);

      const result = await this.repo.approve(id, approvedBy, notes);

      if (this.eventBus) {
        await this.eventBus.publish(new ApprovalApprovedEvent(id, { ...result }));
      }

      return result;
    });
  }

  async reject(id: number, rejectedBy: string, reason?: string) {
    return safeCall(async () => {
      this.logger.log(`Tasdiqlash so'rovi rad etilmoqda id=${id}`);
      const row = await this.repo.findById(id);
      if (!row) throw new NotFoundException(`Tasdiqlash #${id} topilmadi`);
      if ((row as Record<string, unknown>)['status'] === 'rejected') throw new BadRequestException(`Tasdiqlash #${id} allaqachon rejected`);

      const result = await this.repo.reject(id, reason);

      if (this.eventBus) {
        await this.eventBus.publish(new ApprovalRejectedEvent(id, { ...result }));
      }

      return result;
    });
  }

  needsApproval(type: string, amount: number): boolean {
    switch (type) {
      case 'purchase_order': return amount >= HITL_THRESHOLDS.PURCHASE_ORDER_HIGH_VALUE;
      case 'payment': return amount >= HITL_THRESHOLDS.PAYMENT_HIGH_VALUE;
      case 'mro_repair': return amount >= HITL_THRESHOLDS.MRO_REPAIR_HIGH_VALUE;
      case 'inventory_writeoff': return amount >= HITL_THRESHOLDS.INVENTORY_WRITEOFF_HIGH_VALUE;
      default: return false;
    }
  }
}
