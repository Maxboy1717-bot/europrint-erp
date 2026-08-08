/**
 * @module pp-gang-runs.service
 * @description Application service for gang-run per-order acceptance + lot-split brak
 *   (vision 07-pp#37). Owns the split arithmetic (Rule 15 — no db.* here; the repo owns DB):
 *   on acceptance the whole run's brak is divided across member orders proportionally to each
 *   order's snapshotted quantity, and each order is stamped with its own generated
 *   acceptance-act reference. Proportional-by-quantity is the vision default (no owner data).
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, AppErr, type Result } from '@common/result';
import {
  PP_GANG_RUNS_REPO,
  type IPpGangRunsRepo,
  type GangRunHeaderRow,
  type GangRunMemberRow,
  type GangRunAllocation,
} from './i-pp-gang-runs.repo';

/** A gang run with its member orders (per-order brak + acceptance act). */
export interface GangRunDetail extends GangRunHeaderRow {
  members: GangRunMemberRow[];
}

/** Round to 4 dp — matches the NUMERIC(18,4) precision of the brak columns. */
function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

/**
 * Split `totalBrak` across `members` proportionally by orderQuantity. To keep the parts
 * summing to the whole exactly (no rounding drift), every member but the last gets its
 * rounded proportional share and the last member absorbs the residual. When the total
 * quantity is 0 (no weights), the split degrades to an equal division. Each allocation also
 * carries the per-order acceptance-act reference `ACT-G{gangRunId}-O{orderId}`.
 */
function computeAllocations(
  members: GangRunMemberRow[],
  totalBrak: number,
  gangRunId: number,
): GangRunAllocation[] {
  const totalQty = members.reduce((s, m) => s + m.orderQuantity, 0);
  let running = 0;
  return members.map((m, i) => {
    let brakQty: number;
    if (i === members.length - 1) {
      brakQty = round4(totalBrak - running);
    } else {
      const share = totalQty > 0 ? (totalBrak * m.orderQuantity) / totalQty : totalBrak / members.length;
      brakQty = round4(share);
      running += brakQty;
    }
    return {
      productionOrderId: m.productionOrderId,
      brakQty,
      acceptanceActId: `ACT-G${gangRunId}-O${m.productionOrderId}`,
    };
  });
}

@Injectable()
export class PpGangRunsService {
  constructor(
    @Inject(PP_GANG_RUNS_REPO) private readonly repo: IPpGangRunsRepo,
  ) {}

  /** All gang runs, newest first. */
  listGangRuns(): Promise<Result<GangRunHeaderRow[]>> {
    return this.repo.listHeaders();
  }

  /** One gang run with its members; NOT_FOUND when the id has no header. */
  async getGangRun(id: number): Promise<Result<GangRunDetail>> {
    const h = await this.repo.findHeader(id);
    if (!h.ok) return Err(h.error);
    if (!h.data) return Err(AppErr('NOT_FOUND', 'Gang-run topilmadi'));
    const m = await this.repo.findMembers(id);
    if (!m.ok) return Err(m.error);
    return Ok({ ...h.data, members: m.data });
  }

  /**
   * Create a gang run over >= 2 distinct existing production orders. Each member's split
   * weight (order_quantity) is snapshotted from production_orders now, so a later change to
   * the order does not retro-alter the accepted brak split. VALIDATION when < 2 distinct ids
   * or when any requested order is missing/deleted.
   */
  async createGangRun(input: {
    printJobRef: string;
    orderIds: number[];
    createdBy: number | null;
  }): Promise<Result<GangRunDetail>> {
    const uniqueIds = Array.from(new Set(input.orderIds));
    if (uniqueIds.length < 2) {
      return Err(AppErr('VALIDATION', 'Gang-run uchun kamida 2 ta noyob buyurtma kerak'));
    }
    const qres = await this.repo.orderQuantities(uniqueIds);
    if (!qres.ok) return Err(qres.error);
    if (qres.data.length !== uniqueIds.length) {
      return Err(AppErr('VALIDATION', "Ba'zi buyurtmalar topilmadi yoki o'chirilgan"));
    }
    const members = qres.data.map((o) => ({ productionOrderId: o.id, orderQuantity: o.quantity }));
    const ins = await this.repo.insertGangRun(input.printJobRef, input.createdBy, members);
    if (!ins.ok) return Err(ins.error);
    return this.getGangRun(ins.data.id);
  }

  /**
   * Accept a gang run: split `totalBrakQty` proportionally across its members, stamp each
   * with its per-order acceptance act, and finalize the header. NOT_FOUND when the run does
   * not exist; CONFLICT when it was already accepted or has no members.
   */
  async acceptGangRun(id: number, totalBrakQty: number): Promise<Result<GangRunDetail>> {
    const h = await this.repo.findHeader(id);
    if (!h.ok) return Err(h.error);
    if (!h.data) return Err(AppErr('NOT_FOUND', 'Gang-run topilmadi'));
    if (h.data.status === 'accepted') {
      return Err(AppErr('CONFLICT', 'Gang-run allaqachon qabul qilingan'));
    }
    const m = await this.repo.findMembers(id);
    if (!m.ok) return Err(m.error);
    if (m.data.length === 0) {
      return Err(AppErr('CONFLICT', "Gang-run a'zolari yo'q"));
    }
    const allocations = computeAllocations(m.data, totalBrakQty, id);
    const applied = await this.repo.applyAcceptance(id, totalBrakQty, allocations);
    if (!applied.ok) return Err(applied.error);
    if (!applied.data) return Err(AppErr('NOT_FOUND', 'Gang-run topilmadi'));
    return this.getGangRun(id);
  }
}
