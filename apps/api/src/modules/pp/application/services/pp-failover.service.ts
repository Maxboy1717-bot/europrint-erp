/**
 * @module pp-failover.service
 * @description Vision 07-pp#24 — when a machine goes down (IoT/MRO downtime), re-route
 *   its operations to their declared alternative work-center, then recompute CRP so the
 *   planner immediately sees the new capacity picture. Fail-over moves the load; the
 *   subsequent CRP call is the read-only diagnostic that reflects the new routing.
 * @layer Application Service (PP)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';
import {
  PpFailoverRepository,
  ReroutedOperation,
} from '../../infrastructure/repositories/pp-failover.repo';
import { PpCrpService, CrpRow } from './pp-crp.service';

export interface FailoverResult {
  downWorkCenterId: number;
  reroutedCount: number;
  rerouted: ReroutedOperation[];
  crp: CrpRow[];
}

@Injectable()
export class PpFailoverService {
  private readonly logger = new Logger(PpFailoverService.name);

  constructor(
    private readonly failoverRepo: PpFailoverRepository,
    private readonly crpService: PpCrpService,
  ) {}

  /**
   * Fail-over on downtime + CRP recompute. Returns Ok even when nothing re-routes
   * (reroutedCount 0) — a downed machine with no alternatives is a valid no-op and
   * the fresh CRP snapshot is still worth returning to the caller.
   */
  async failoverOnDowntime(downWorkCenterId: number): Promise<Result<FailoverResult>> {
    const routed = await this.failoverRepo.rerouteOnDowntime(downWorkCenterId);
    if (!routed.ok) return Err(routed.error);

    const crp = await this.crpService.getCrp();
    if (!crp.ok) return Err(crp.error);

    if (routed.data.length > 0) {
      this.logger.log(
        `Fail-over: wc=${downWorkCenterId} down, ${routed.data.length} operatsiya muqobil stanokka o'tkazildi, CRP qayta hisoblandi`,
      );
    }
    return Ok({
      downWorkCenterId,
      reroutedCount: routed.data.length,
      rerouted: routed.data,
      crp: crp.data,
    });
  }
}
