/**
 * @module report-defect.command
 * @description Source module. See exports for details.
 */

import { DefectSeverity } from '../../domain/aggregates/defect.aggregate';

/** QC-birlashtirish (2026-07-02): brak-yozuvlarga xos ixtiyoriy maydonlar (qc_braks-dan
 *  ko'chirilgan). Faqat POST /qc/braks -> createBrak oqimi to'ldiradi. */
export interface ReportDefectBrakExtras {
  papkaOrderId?: number | null;
  stage?: string | null;
  costImpact?: number | null;
  isReworkable?: boolean | null;
  reworked?: boolean | null;
  brakDate?: string | null;
}

export class ReportDefectCommand {
  constructor(public readonly inspectionId: string | null,
    public readonly productionOrderId: string | null,
    public readonly workCenterId: string | null,
    public readonly defectCode: string,
    public readonly description: string,
    public readonly severity: DefectSeverity,
    public readonly quantity: number,
    public readonly unit: string,
    public readonly reportedBy: string,
    public readonly brakExtras: ReportDefectBrakExtras | null = null) {}
}
