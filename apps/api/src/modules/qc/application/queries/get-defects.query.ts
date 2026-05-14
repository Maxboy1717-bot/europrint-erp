/**
 * @module get-defects.query
 * @description Source module. See exports for details.
 */

import { DefectSeverity, DefectStatus } from '../../domain/aggregates/defect.aggregate';

export class GetDefectsQuery {
  constructor(public readonly severity?: DefectSeverity,
    public readonly status?: DefectStatus,
    public readonly productionOrderId?: string,
    public readonly from?: Date,
    public readonly to?: Date,
    public readonly page: number = 1,
    public readonly limit: number = 20) {}
}
