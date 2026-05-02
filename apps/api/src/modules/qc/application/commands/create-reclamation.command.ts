import { DefectSeverity } from '../../domain/aggregates/defect.aggregate';

export class CreateReclamationCommand {
  constructor(public readonly customerName: string,
    public readonly customerId: string | null,
    public readonly orderId: string | null,
    public readonly description: string,
    public readonly severity: DefectSeverity) {}
}
