/**
 * @module get-approval-history.query
 * @description Source module. See exports for details.
 */

import { HitlDocumentType, ApprovalStatus } from '../../domain/enums/hitl-document-type.enum';

export class GetApprovalHistoryQuery {
  constructor(public readonly documentType?: HitlDocumentType,
    public readonly status?: ApprovalStatus,
    public readonly page?: number,
    public readonly limit?: number) {}
}
