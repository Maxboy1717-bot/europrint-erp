/**
 * @module atp-check.handler
 * @description CQRS query handler: SD order-entry ATP (Available-To-Promise) check.
 *
 * Vision: EP-PP-066 / EP-PP-024 / CHAT-TARIXI line 25 — at order entry the salesperson
 * sees, in real time, whether materials are in stock and an estimated availability date
 * ("yetmasa qizil + taxminiy sana"). This is the DETERMINISTIC, NON-AI part of the
 * planning vision: stock + per-material lead time only. No AI key, no owner-gated number.
 *
 * Logic (per line):
 *   demand     = ordered quantity
 *   available  = SUM(warehouse_stock.available_quantity) for the material (fallback card)
 *   shortage   = max(0, demand - available)
 *   leadDays   = inventory_policy.lead_time_days, else ATP_DEFAULT_LEAD_TIME_DAYS (EP-PP-065)
 *   status     = in_stock (shortage == 0) | short (shortage > 0) | unknown_material (no card)
 *   availableOn= today                  when in_stock
 *              = today + leadDays (days) when short
 * Order-level:
 *   overallStatus  = unknown_material > short > in_stock (worst line wins)
 *   estimatedReady = latest availableOn across lines (max)
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { TashkentTimeService } from '@common/time';
import {
  ATP_DEFAULT_LEAD_TIME_DAYS,
  ATP_IN_STOCK_DAYS,
} from '@common/constants/business.constants';
import {
  DrizzleSdAtpRepository,
  AtpDemandLine,
  AtpSupplyRow,
} from '../../infrastructure/repositories/drizzle-sd-atp.repo';
import { AtpLine } from '../../presentation/dto/atp-check.dto';

export type AtpLineStatus = 'in_stock' | 'short' | 'unknown_material';

export interface AtpLineResult {
  materialId: number;
  materialName: string | null;
  unit: string | null;
  demand: number;
  available: number;
  shortage: number;
  leadTimeDays: number;
  leadTimeIsDefault: boolean;
  status: AtpLineStatus;
  /** ISO date (yyyy-mm-dd) when this line can be promised. */
  availableOn: string;
}

export interface AtpCheckResult {
  orderId: number | null;
  overallStatus: AtpLineStatus;
  /** Latest availableOn across all lines (ISO yyyy-mm-dd). The order's estimated ready date. */
  estimatedReadyDate: string;
  /** Whole calendar days from today to estimatedReadyDate (0 = ready today). */
  estimatedReadyInDays: number;
  allInStock: boolean;
  lines: AtpLineResult[];
}

export class AtpCheckQuery {
  constructor(
    public readonly orderId: number | null,
    public readonly items: AtpLine[] | null,
  ) {}
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@QueryHandler(AtpCheckQuery)
export class AtpCheckHandler implements IQueryHandler<AtpCheckQuery> {
  private readonly logger = new Logger(AtpCheckHandler.name);

  constructor(
    private readonly atpRepo: DrizzleSdAtpRepository,
    private readonly time: TashkentTimeService,
  ) {}

  async execute(query: AtpCheckQuery): Promise<Result<AtpCheckResult>> {
    // 1) Resolve demand lines — either from the saved order or the inline preview body.
    let demand: AtpDemandLine[];
    if (query.orderId != null) {
      const linesRes = await this.atpRepo.findOrderDemandLines(query.orderId);
      if (!linesRes.ok) return Err(linesRes.error);
      if (linesRes.data.length === 0) {
        return Err(AppErr('NOT_FOUND', 'Order has no material-bound lines to check'));
      }
      demand = linesRes.data;
    } else {
      demand = (query.items ?? []).map((it) => ({ materialId: it.materialId, quantity: it.quantity }));
      if (demand.length === 0) {
        return Err(AppErr('VALIDATION', 'No lines supplied for ATP check'));
      }
    }

    // 2) Aggregate demand per material (same material may appear on multiple lines).
    const demandByMaterial = new Map<number, number>();
    for (const d of demand) {
      demandByMaterial.set(d.materialId, (demandByMaterial.get(d.materialId) ?? 0) + d.quantity);
    }

    // 3) Read real supply facts in one query.
    const supplyRes = await this.atpRepo.findSupply([...demandByMaterial.keys()]);
    if (!supplyRes.ok) return Err(supplyRes.error);
    const supplyByMaterial = new Map<number, AtpSupplyRow>();
    for (const s of supplyRes.data) supplyByMaterial.set(s.materialId, s);

    // 4) Compute per-line ATP.
    const today = this.time.today();
    const lines: AtpLineResult[] = [];
    for (const [materialId, totalDemand] of demandByMaterial.entries()) {
      const supply = supplyByMaterial.get(materialId);
      const available = supply?.available ?? 0;
      const shortage = Math.max(0, totalDemand - available);
      const materialExists = supply?.materialExists ?? false;

      const leadTimeIsDefault = supply?.leadTimeDays == null;
      const leadTimeDays = leadTimeIsDefault ? ATP_DEFAULT_LEAD_TIME_DAYS : Number(supply!.leadTimeDays);

      let status: AtpLineStatus;
      if (!materialExists) status = 'unknown_material';
      else if (shortage > 0) status = 'short';
      else status = 'in_stock';

      // In-stock ⇒ today; short or unknown ⇒ today + lead time (must be procured).
      const daysOut = status === 'in_stock' ? ATP_IN_STOCK_DAYS : leadTimeDays;
      const availableOn = this.time.addDays(today, daysOut);

      lines.push({
        materialId,
        materialName: supply?.materialName ?? null,
        unit: supply?.unit ?? null,
        demand: totalDemand,
        available,
        shortage,
        leadTimeDays,
        leadTimeIsDefault,
        status,
        availableOn: isoDate(availableOn),
      });
    }

    // 5) Order-level rollup: worst status, latest date.
    const hasUnknown = lines.some((l) => l.status === 'unknown_material');
    const hasShort = lines.some((l) => l.status === 'short');
    const overallStatus: AtpLineStatus = hasUnknown ? 'unknown_material' : hasShort ? 'short' : 'in_stock';

    let estimatedReady = today;
    for (const l of lines) {
      const d = new Date(`${l.availableOn}T00:00:00.000Z`);
      if (d.getTime() > estimatedReady.getTime()) estimatedReady = d;
    }
    const estimatedReadyInDays = Math.max(
      0,
      Math.round((this.time.startOfDay(estimatedReady).getTime() - today.getTime()) / 86_400_000),
    );

    this.logger.debug({
      msg: 'ATP check computed',
      orderId: query.orderId,
      overallStatus,
      lines: lines.length,
    });

    return Ok({
      orderId: query.orderId ?? null,
      overallStatus,
      estimatedReadyDate: isoDate(estimatedReady),
      estimatedReadyInDays,
      allInStock: overallStatus === 'in_stock',
      lines,
    });
  }
}
