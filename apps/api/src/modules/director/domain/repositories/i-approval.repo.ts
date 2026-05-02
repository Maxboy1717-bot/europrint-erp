import { Result } from '@common/types/result.type';
import { ApprovalRequest } from '../aggregates/approval-request.aggregate';
import { HitlDocumentType, ApprovalStatus } from '../enums/hitl-document-type.enum';

export interface IApprovalRepo {
  findById(id: string): Promise<Result<ApprovalRequest>>;
  findPending(filters: {
    documentType?: HitlDocumentType;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: ApprovalRequest[]; total: number }>>;
  findHistory(filters: {
    documentType?: HitlDocumentType;
    status?: ApprovalStatus;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: ApprovalRequest[]; total: number }>>;
  findExistingPending(
    documentType: HitlDocumentType,
    documentId: string,
  ): Promise<Result<ApprovalRequest | null>>;
  save(approval: Partial<ApprovalRequest>): Promise<Result<ApprovalRequest>>;
  update(
    id: string,
    data: Partial<ApprovalRequest>,
  ): Promise<Result<ApprovalRequest>>;
  getStats(): Promise<
    Result<{
      pending: number;
      approvedToday: number;
      rejectedToday: number;
      avgApprovalTimeHours: number;
    }>
  >;
}

export const APPROVAL_REPO = Symbol('APPROVAL_REPO');
