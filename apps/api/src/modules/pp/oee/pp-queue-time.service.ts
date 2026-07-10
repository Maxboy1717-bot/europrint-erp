/**
 * @module pp-queue-time.service
 * @description Application service for the operation queue-time tracker (vision 07-pp#46).
 *   Delegates persistence to the repo (Rule 15 -- no db.* here) and owns the small OEE
 *   arithmetic: per work center, the availability denominator is ACTIVE WORK minutes with
 *   QUEUE minutes excluded. Also surfaces what the denominator would be if queue were
 *   (wrongly) included, so the exclusion is auditable.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, type Result } from '@common/result';
import {
  PP_QUEUE_TIME_REPO,
  type IPpQueueTimeRepo,
  type QueuedOperationRow,
} from './i-pp-queue-time.repo';

/** One work center's OEE availability denominator with queue time excluded. */
export interface WorkCenterQueueExclusion {
  workCenterId: number | null;
  queuedOps: number;
  /** WAITING time excluded from OEE. */
  queueMinutes: number;
  /** OEE availability denominator = active machine work (queue excluded). */
  oeeDenominatorMinutes: number;
  /** What the denominator would be if queue were included (audit/contrast). */
  denominatorIfQueueIncluded: number;
  /** Queue share of (queue + work), 0-100 (1 dp); 0 when nothing tracked. */
  queueSharePct: number;
}

/** Queue-exclusion report envelope over a window. */
export interface QueueExclusionReport {
  from: string;
  to: string;
  totalQueueMinutes: number;
  totalOeeDenominatorMinutes: number;
  workCenters: WorkCenterQueueExclusion[];
}

@Injectable()
export class PpQueueTimeService {
  constructor(
    @Inject(PP_QUEUE_TIME_REPO) private readonly repo: IPpQueueTimeRepo,
  ) {}

  /** Idempotently stamp queued_at for an op entering the queue. Ok(null) if id not found -> 404. */
  markQueued(operationId: number): Promise<Result<QueuedOperationRow | null>> {
    return this.repo.markQueued(operationId);
  }

  /**
   * Per-work-center OEE availability denominator with queue time excluded, over
   * [from, to) (ISO timestamps, pre-validated by the caller). Empty window -> zeroed report.
   */
  async getQueueExclusion(from: string, to: string): Promise<Result<QueueExclusionReport>> {
    const res = await this.repo.getQueueExclusionByWorkCenter(from, to);
    if (!res.ok) return Err(res.error);

    const workCenters: WorkCenterQueueExclusion[] = res.data.map((r) => {
      const denom = r.queueMinutes + r.activeWorkMinutes;
      const queueSharePct = denom > 0 ? Math.round((r.queueMinutes / denom) * 1000) / 10 : 0;
      return {
        workCenterId: r.workCenterId,
        queuedOps: r.queuedOps,
        queueMinutes: r.queueMinutes,
        oeeDenominatorMinutes: r.activeWorkMinutes,
        denominatorIfQueueIncluded: Math.round(denom * 100) / 100,
        queueSharePct,
      };
    });

    return Ok({
      from,
      to,
      totalQueueMinutes: Math.round(workCenters.reduce((s, w) => s + w.queueMinutes, 0) * 100) / 100,
      totalOeeDenominatorMinutes:
        Math.round(workCenters.reduce((s, w) => s + w.oeeDenominatorMinutes, 0) * 100) / 100,
      workCenters,
    });
  }
}
