import { DefectSeverity } from '../../domain/aggregates/defect.aggregate';
import { ReclamationStatus } from '../../domain/aggregates/reclamation.aggregate';

export class GetReclamationsQuery {
  constructor(public readonly status?: ReclamationStatus,
    public readonly severity?: DefectSeverity,
    public readonly from?: Date,
    public readonly to?: Date,
    public readonly page: number = 1,
    public readonly limit: number = 20) {}
}
