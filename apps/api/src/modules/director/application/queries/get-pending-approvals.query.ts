import { HitlDocumentType } from '../../domain/enums/hitl-document-type.enum';

export class GetPendingApprovalsQuery {
  constructor(public readonly documentType?: HitlDocumentType,
    public readonly page?: number,
    public readonly limit?: number) {}
}
