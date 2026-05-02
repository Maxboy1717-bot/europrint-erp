import { WorkCenterType } from '../../domain/aggregates/work-center.aggregate';

export class GetWorkCentersQuery {
  constructor(public readonly filters: {
      type?: WorkCenterType;
      isActive?: boolean;
      department?: string;
    }) {}
}
