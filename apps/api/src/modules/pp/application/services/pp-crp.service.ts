/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   GREATEST/LEAST clamping inside SELECT projection, regex-pattern date
 *   validation on text column (planned_start_date ~ '^[0-9]{4}-...'),
 *   conditional CAST after regex check, and INTERVAL arithmetic with a
 *   parameterised day-count (CURRENT_DATE + INTERVAL '1 day' * ${days}).
 *   These appear in loadWorkCenters/loadPlannedOrders which feed the CRP math.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module pp-crp.service
 * @description Capacity Requirements Planning. Takes the planned-orders
 *   from MRP and loads them against each work-center's available capacity
 *   over a rolling 4-week horizon, returning per-center utilization %.
 *
 *   For each work center over the horizon:
 *     requiredHours  = Σ (operation time × planned qty) for ops routed here
 *     availableHours = workingDays × hoursPerDay × machines × efficiency
 *     utilization%   = requiredHours / availableHours × 100
 *
 *   Classification:
 *     ≥ 100%  Overloaded     — schedule will slip without action
 *     ≥  85%  Bottleneck     — at risk; watch closely
 *     <  85%  Normal
 *
 *   The "bottleneck" tier is computed AFTER overload — meaning bottleneck
 *   refers to centers near capacity (85-100%), not yet over. The single
 *   highest-utilisation center is also flagged as THE bottleneck of the
 *   period (drum of the system, in TOC terms).
 * @layer Application Service (PP — answers "can we make the plan?")
 *
 * WHY 4-WEEK HORIZON
 *   Matches our planning cycle. MRP's 12-period default is monthly buckets;
 *   CRP zooms in to the immediate 4 weeks where capacity action is still
 *   possible (overtime, subcontracting, schedule shifts). Beyond 4 weeks
 *   the planner has time to rebalance via the MRP run itself.
 *
 * WHY 5 WORKING DAYS / WEEK (not 7)
 *   Our shop runs Mon-Fri at full capacity, Sat half-shift, Sun off. The
 *   simple 5-day model under-states real availability slightly — useful
 *   because it makes the planner conservative (Saturday is reserved as
 *   overflow). If a center is "100% utilized" on M-F, Saturday becomes
 *   the safety valve.
 *
 * WHY 85% WARNING THRESHOLD
 *   Industry convention (TOC, Goldratt). Above 85% utilization, queue
 *   times grow non-linearly because of variability — that's where small
 *   disturbances become big slips. 85-100% is "running hot, watch it";
 *   100%+ is "definitely will slip".
 *
 * WHY EFFICIENCY FACTOR IS BAKED INTO availableHours
 *   Sometimes called OEE-adjustment. A machine with 90% Availability ×
 *   95% Performance × 99% Quality = 84.6% OEE → 84.6% of nominal hours
 *   are actually productive. CRP uses the OEE-adjusted hours as
 *   "available" so the utilization % matches reality.
 *
 *   `efficiency_rate` column stores this composite OEE factor; updated
 *   nightly from MES feedback.
 *
 * WHY THIS IS READ-ONLY (no schedule writes)
 *   CRP is diagnostic: it *reports* overload. The planner decides whether
 *   to add overtime, sub-contract, or push out the schedule. Auto-action
 *   would be too aggressive given the cost of unnecessary overtime.
 *   When the AI planner agent matures, it MAY propose actions — those
 *   still need human approval.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeDiv } from '@common/math/math-utils';

/** Above this utilization, the work center cannot finish the plan on time. */
const CRP_OVERLOAD_THRESHOLD = 100;
/** Above this, queue times grow non-linearly — bottleneck watch zone. */
const CRP_WARNING_THRESHOLD = 85;
/** Match the planner's action horizon — beyond 4 weeks rebalancing handles it. */
const CRP_HORIZON_WEEKS = 4;
/** Mon-Fri primary capacity; Sat reserved as overflow (see top-of-file). */
const CRP_WORKING_DAYS_PER_WEEK = 5;
const CRP_HORIZON_DAYS = CRP_HORIZON_WEEKS * CRP_WORKING_DAYS_PER_WEEK;

export interface CrpRow {
  workCenterId: string;
  workCenterName: string;
  requiredHours: number;
  availableHours: number;
  utilizationPct: number;
  isBottleneck: boolean;
  isOverloaded: boolean;
}

@Injectable()
export class PpCrpService {
  private readonly logger = new Logger(PpCrpService.name);

  async getCrp(): Promise<Result<CrpRow[], AppError>> {
    try {
      const workCenters = await this.loadWorkCenters();
      const ops = await this.loadRoutingOps();
      const planned = await this.loadPlannedOrders();
      const rows = this.computeLoads(workCenters, ops, planned);
      return Ok(this.markBottleneck(rows));
    } catch (e) {
      this.logger.error(`CRP computation failed: ${String(e)}`);
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  private async loadWorkCenters(): Promise<Record<string, unknown>[]> {
    // capacity  = number of parallel machines in this work center
    // efficiency_rate = decimal (0–1) — covers both machine efficiency and scheduled utilization
    // utilization_factor defaults to 1.0 when the column is absent (not all ERP tables have it)
    const r = await runQuery(sql`
      SELECT id::text AS id,
             COALESCE(name, code, 'Ish markaz') AS name,
             GREATEST(COALESCE(capacity, 1)::numeric, 1) AS machine_count,
             COALESCE(hours_per_day, 8)::numeric AS hours_per_day,
             GREATEST(LEAST(COALESCE(efficiency_rate, 0.85)::numeric, 1), 0.01) AS efficiency_rate,
             1.0::numeric AS utilization_factor
      FROM work_centers
      WHERE is_active = true AND deleted_at IS NULL
      ORDER BY id
    `);
    return Array.isArray(r?.rows) ? r.rows : (Array.isArray(r) ? r : []);
  }

  private async loadRoutingOps(): Promise<Record<string, unknown>[]> {
    // Sprint-2 schema: pp_routing_operations has product_id directly (no routing join)
    // setup_time_min and run_time_per_unit_min are in minutes
    const r = await runQuery(sql`
      SELECT product_id::text AS product_id,
             work_center_id::text AS work_center_id,
             COALESCE(setup_time_min, 0)::numeric AS setup_time_min,
             COALESCE(run_time_per_unit_min, 0)::numeric AS run_time_per_unit_min
      FROM pp_routing_operations
      WHERE is_active = true
        AND work_center_id IS NOT NULL
    `);
    return Array.isArray(r?.rows) ? r.rows : (Array.isArray(r) ? r : []);
  }

  private async loadPlannedOrders(): Promise<Record<string, unknown>[]> {
    const r = await runQuery(sql`
      SELECT product_id::text AS product_id,
             COALESCE(planned_quantity, 0)::numeric AS qty
      FROM production_orders
      WHERE status NOT IN ('completed', 'cancelled')
        AND planned_quantity > 0
        AND (planned_start_date IS NULL
             OR (planned_start_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                 AND planned_start_date::date <= CURRENT_DATE + (INTERVAL '1 day' * ${CRP_HORIZON_DAYS})))
      ORDER BY planned_start_date
      LIMIT 200
    `);
    return Array.isArray(r?.rows) ? r.rows : (Array.isArray(r) ? r : []);
  }

  private computeLoads(
    workCenters: Record<string, unknown>[],
    ops: Record<string, unknown>[],
    planned: Record<string, unknown>[],
  ): CrpRow[] {
    return (Array.isArray(workCenters) ? workCenters : []).map((wc) => {
      const wcId = String(wc['id']);
      const machines = safeNum(wc['machine_count'], 1);
      const hoursPerDay = safeNum(wc['hours_per_day'], 8);
      const efficiency = safeNum(wc['efficiency_rate'], 0.85);
      const utilization = safeNum(wc['utilization_factor'], 1.0);

      // Standard CRP formula: machines × hours/day × working_days × efficiency × utilization
      const availHours = machines * hoursPerDay * CRP_HORIZON_DAYS * efficiency * utilization;

      let requiredMins = 0;
      for (const po of planned) {
        const routingOps = (Array.isArray(ops) ? ops : []).filter(
          (op) => String(op['work_center_id']) === wcId &&
                  String(op['product_id']) === String(po['product_id']),
        );
        for (const op of routingOps) {
          // setup_time_min per order + run_time_per_unit_min × quantity
          requiredMins +=
            safeNum(op['setup_time_min']) +
            safeNum(op['run_time_per_unit_min']) * safeNum(po['qty']);
        }
      }

      const requiredHours = safeDiv(requiredMins, 60);
      const utilizationPct = availHours > 0 ? safeDiv(requiredHours * 100, availHours) : 0;
      return {
        workCenterId: wcId,
        workCenterName: String(wc['name'] ?? ''),
        requiredHours,
        availableHours: availHours,
        utilizationPct,
        isBottleneck: false,
        isOverloaded: utilizationPct >= CRP_OVERLOAD_THRESHOLD,
      };
    });
  }

  private markBottleneck(rows: CrpRow[]): CrpRow[] {
    const sorted = rows.sort((a, b) => b.utilizationPct - a.utilizationPct);
    if (sorted.length > 0 && sorted[0].utilizationPct >= CRP_WARNING_THRESHOLD) {
      sorted[0].isBottleneck = true;
    }
    return sorted;
  }
}
