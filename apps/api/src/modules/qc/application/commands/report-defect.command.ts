/**
 * @module report-defect.command
 * @description Source module. See exports for details.
 */

import { DefectSeverity } from '../../domain/aggregates/defect.aggregate';

export class ReportDefectCommand {
  constructor(public readonly inspectionId: string | null,
    public readonly productionOrderId: string | null,
    public readonly workCenterId: string | null,
    public readonly defectCode: string,
    public readonly description: string,
    public readonly severity: DefectSeverity,
    public readonly quantity: number,
    public readonly unit: string,
    public readonly reportedBy: string) {}
}
