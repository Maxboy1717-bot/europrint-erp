/**
 * @module scheduling.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import {
  Job, JohnsonResult,
  Activity, CpmResult,
  PertActivity, PertResult,
  WorkCenterLoad, TocResult,
} from './scheduling.types';
import { SchedulingJohnsonService } from './scheduling-johnson.service';
import { SchedulingNetworkService } from './scheduling-network.service';
import { SchedulingCapacityService } from './scheduling-capacity.service';

export type {
  Job, JohnsonResult,
  Activity, CpmActivity, CpmResult,
  PertActivity, PertResult,
  WorkCenterLoad, TocResult,
} from './scheduling.types';

/**
 * SchedulingService — PP scheduling facade.
 *
 * Delegates to:
 *   SchedulingJohnsonService  — TZ-13 Johnson Rule
 *   SchedulingNetworkService  — TZ-14 CPM + PERT
 *   SchedulingCapacityService — TZ-16 TOC / Bottleneck
 */
@Injectable()
export class SchedulingService {
  private readonly johnson: SchedulingJohnsonService;
  private readonly network: SchedulingNetworkService;
  private readonly capacity: SchedulingCapacityService;

  constructor(
    johnson?: SchedulingJohnsonService,
    network?: SchedulingNetworkService,
    capacity?: SchedulingCapacityService,
  ) {
    // Allow zero-arg construction for unit tests; production DI passes injected
    // singletons.
    this.johnson  = johnson  ?? new SchedulingJohnsonService();
    this.network  = network  ?? new SchedulingNetworkService();
    this.capacity = capacity ?? new SchedulingCapacityService();
  }

  johnsonRule(jobs: readonly Job[]): Result<JohnsonResult, AppError> {
    return this.johnson.johnsonRule(jobs);
  }

  calculateCpm(activities: Activity[]): Result<CpmResult, AppError> {
    return this.network.calculateCpm(activities);
  }

  calculatePert(activities: PertActivity[]): Promise<Result<PertResult, AppError>> {
    return this.network.calculatePert(activities);
  }

  detectBottleneck(workCenters: WorkCenterLoad[]): Result<TocResult, AppError> {
    return this.capacity.detectBottleneck(workCenters);
  }
}
