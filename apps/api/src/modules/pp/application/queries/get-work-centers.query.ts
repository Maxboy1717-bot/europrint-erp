/**
 * @module get-work-centers.query
 * @description Source module. See exports for details.
 */

import { WorkCenterType } from '../../domain/aggregates/work-center.aggregate';

export class GetWorkCentersQuery {
  constructor(public readonly filters: {
      type?: WorkCenterType;
      isActive?: boolean;
      department?: string;
      departmentKind?: string; // Wave 1: FLEKSO | OFSET (sex taxonomy)
    }) {}
}
