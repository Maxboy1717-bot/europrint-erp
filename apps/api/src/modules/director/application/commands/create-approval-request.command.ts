/**
 * @module create-approval-request.command
 * @description Source module. See exports for details.
 */

import { HitlDocumentType } from '../../domain/enums/hitl-document-type.enum';

export class CreateApprovalRequestCommand {
  constructor(public readonly documentType: HitlDocumentType,
    public readonly documentId: string,
    public readonly documentNumber: string | null,
    public readonly amount: number,
    public readonly currency: string,
    public readonly requestedBy: string,
    public readonly notes: string | null) {}
}
