/**
 * test/director/approval-request.aggregate.spec.ts
 * Unit tests for ApprovalRequest aggregate — HITL approve/reject lifecycle
 * and HITL threshold check.
 */
import { InternalServerErrorException } from '@nestjs/common';
import { ApprovalRequest } from '../../src/modules/director/domain/aggregates/approval-request.aggregate';
import {
  HitlDocumentType,
  ApprovalStatus,
  HITL_THRESHOLDS,
} from '../../src/modules/director/domain/enums/hitl-document-type.enum';
import { applicationFactory } from '../_fixtures/factories';

function makeRequest(overrides: Partial<{
  id: string;
  documentType: HitlDocumentType;
  documentId: string;
  documentNumber: string | null;
  amount: number;
  currency: string;
  status: ApprovalStatus;
  requestedBy: string;
}> = {}): ApprovalRequest {
  const a = applicationFactory();
  return new ApprovalRequest(
    overrides.id ?? a.id,
    overrides.documentType ?? HitlDocumentType.PURCHASE_ORDER,
    overrides.documentId ?? 'doc-1',
    overrides.documentNumber ?? 'PO-2026-0001',
    overrides.amount ?? 60_000_000,
    overrides.currency ?? 'UZS',
    overrides.status ?? ApprovalStatus.PENDING,
    overrides.requestedBy ?? String(a.applicantUserId),
    null, null, null, null, null, null,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );
}

describe('ApprovalRequest aggregate', () => {
  describe('approve()', () => {
    it('moves a PENDING request to APPROVED and stamps approver', () => {
      const r = makeRequest({ status: ApprovalStatus.PENDING });
      r.approve('user-42', 'OK');
      expect(r.status).toBe(ApprovalStatus.APPROVED);
      expect(r.approvedBy).toBe('user-42');
      expect(r.approvedAt).toBeInstanceOf(Date);
    });

    it('throws when approving an already-APPROVED request', () => {
      const r = makeRequest({ status: ApprovalStatus.APPROVED });
      expect(() => r.approve('user-1')).toThrow(InternalServerErrorException);
    });

    it('throws when approving a REJECTED request', () => {
      const r = makeRequest({ status: ApprovalStatus.REJECTED });
      expect(() => r.approve('user-1')).toThrow(InternalServerErrorException);
    });

    it('refreshes updatedAt on approval', () => {
      const r = makeRequest({ status: ApprovalStatus.PENDING });
      const before = r.updatedAt.getTime();
      r.approve('user-1');
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('reject()', () => {
    it('moves a PENDING request to REJECTED with reason', () => {
      const r = makeRequest({ status: ApprovalStatus.PENDING });
      r.reject('user-7', 'Insufficient budget justification');
      expect(r.status).toBe(ApprovalStatus.REJECTED);
      expect(r.rejectedBy).toBe('user-7');
      expect(r.rejectionReason).toBe('Insufficient budget justification');
      expect(r.rejectedAt).toBeInstanceOf(Date);
    });

    it('throws when reason is empty string', () => {
      const r = makeRequest({ status: ApprovalStatus.PENDING });
      expect(() => r.reject('user-7', '')).toThrow(InternalServerErrorException);
    });

    it('throws when reason is shorter than 5 characters', () => {
      const r = makeRequest({ status: ApprovalStatus.PENDING });
      expect(() => r.reject('user-7', 'no')).toThrow(InternalServerErrorException);
    });

    it('throws when rejecting an already-APPROVED request', () => {
      const r = makeRequest({ status: ApprovalStatus.APPROVED });
      expect(() => r.reject('user-1', 'valid reason here'))
        .toThrow(InternalServerErrorException);
    });

    it('throws when rejecting an already-REJECTED request', () => {
      const r = makeRequest({ status: ApprovalStatus.REJECTED });
      expect(() => r.reject('user-1', 'valid reason here'))
        .toThrow(InternalServerErrorException);
    });
  });

  describe('static isHitlRequired()', () => {
    it('returns true for PURCHASE_ORDER at or above 50M UZS', () => {
      const at = HITL_THRESHOLDS.PURCHASE_ORDER_HIGH_VALUE;
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.PURCHASE_ORDER, at)).toBe(true);
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.PURCHASE_ORDER, at + 1)).toBe(true);
    });

    it('returns false for PURCHASE_ORDER below 50M UZS', () => {
      const below = HITL_THRESHOLDS.PURCHASE_ORDER_HIGH_VALUE - 1;
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.PURCHASE_ORDER, below)).toBe(false);
    });

    it('returns true for PAYMENT at or above 100M UZS', () => {
      const at = HITL_THRESHOLDS.PAYMENT_HIGH_VALUE;
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.PAYMENT, at)).toBe(true);
    });

    it('returns false for PAYMENT below 100M UZS', () => {
      const below = HITL_THRESHOLDS.PAYMENT_HIGH_VALUE - 1;
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.PAYMENT, below)).toBe(false);
    });

    it('always returns true for ADVANCE_BYPASS regardless of amount', () => {
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.ADVANCE_BYPASS, 0)).toBe(true);
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.ADVANCE_BYPASS, 1_000_000_000)).toBe(true);
    });

    it('always returns true for QC_FAIL_CRITICAL', () => {
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.QC_FAIL_CRITICAL, 1)).toBe(true);
    });

    it('always returns true for EMPLOYEE_TERMINATION', () => {
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.EMPLOYEE_TERMINATION, 0)).toBe(true);
    });

    it('returns false for CREDIT_LIMIT_EXCEED (no threshold rule)', () => {
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.CREDIT_LIMIT_EXCEED, 1_000_000_000)).toBe(false);
    });

    it('returns true for MRO_REPAIR at threshold and false below', () => {
      const at = HITL_THRESHOLDS.MRO_REPAIR_HIGH_VALUE;
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.MRO_REPAIR_HIGH_VALUE, at)).toBe(true);
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.MRO_REPAIR_HIGH_VALUE, at - 1)).toBe(false);
    });

    it('returns true for INVENTORY_WRITEOFF at threshold', () => {
      const at = HITL_THRESHOLDS.INVENTORY_WRITEOFF_HIGH_VALUE;
      expect(ApprovalRequest.isHitlRequired(HitlDocumentType.INVENTORY_WRITEOFF, at)).toBe(true);
    });
  });
});
