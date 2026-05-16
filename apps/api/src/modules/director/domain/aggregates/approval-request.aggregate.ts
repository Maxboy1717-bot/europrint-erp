/**
 * @module approval-request.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { InternalServerErrorException } from '@nestjs/common';
import { HitlDocumentType, ApprovalStatus, HITL_THRESHOLDS } from '../enums/hitl-document-type.enum';

export class ApprovalRequest {
  constructor(public readonly id: string,
    public readonly documentType: HitlDocumentType,
    public readonly documentId: string,
    public readonly documentNumber: string | null,
    public readonly amount: number,
    public readonly currency: string,
    public status: ApprovalStatus,
    public readonly requestedBy: string,
    public approvedBy: string | null,
    public approvedAt: Date | null,
    public rejectedBy: string | null,
    public rejectedAt: Date | null,
    public rejectionReason: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date) {}

  approve(userId: string, notes?: string): void {
    if (this.status !== ApprovalStatus.PENDING) {
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingApprovable'.
      throw new InternalServerErrorException('Faqat pending so\'rov tasdiqlanadi');
    }
    this.status = ApprovalStatus.APPROVED;
    this.approvedBy = userId;
    this.approvedAt = _time.now();
    this.updatedAt = _time.now();
  }

  reject(userId: string, reason: string): void {
    if (this.status !== ApprovalStatus.PENDING) {
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingRejectable'.
      throw new InternalServerErrorException('Faqat pending so\'rov rad etiladi');
    }
    if (!reason || reason.length < 5) {
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.rejectReasonTooShort'.
      throw new InternalServerErrorException('Rad etish sababi kamida 5 ta belgi');
    }
    this.status = ApprovalStatus.REJECTED;
    this.rejectedBy = userId;
    this.rejectedAt = _time.now();
    this.rejectionReason = reason;
    this.updatedAt = _time.now();
  }

  static isHitlRequired(documentType: HitlDocumentType, amount: number): boolean {
    switch (documentType) {
      case HitlDocumentType.PURCHASE_ORDER:
        return amount >= HITL_THRESHOLDS.PURCHASE_ORDER_HIGH_VALUE;
      case HitlDocumentType.PAYMENT:
        return amount >= HITL_THRESHOLDS.PAYMENT_HIGH_VALUE;
      case HitlDocumentType.MRO_REPAIR_HIGH_VALUE:
        return amount >= HITL_THRESHOLDS.MRO_REPAIR_HIGH_VALUE;
      case HitlDocumentType.INVENTORY_WRITEOFF:
        return amount >= HITL_THRESHOLDS.INVENTORY_WRITEOFF_HIGH_VALUE;
      case HitlDocumentType.ADVANCE_BYPASS:
      case HitlDocumentType.THREE_WAY_MATCH:
      case HitlDocumentType.QC_FAIL_CRITICAL:
      case HitlDocumentType.EMPLOYEE_TERMINATION:
        return true; // Always requires HITL
      default:
        return false;
    }
  }
}
