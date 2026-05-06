import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeDiv } from '@common/math/math-utils';

const CRP_OVERLOAD_THRESHOLD = 100;
const CRP_WARNING_THRESHOLD = 85;
const CRP_HORIZON_WEEKS = 4;
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
    return r.rows ?? [];
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
    return r.rows ?? [];
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
    return r.rows ?? [];
  }

  private computeLoads(
    workCenters: Record<string, unknown>[],
    ops: Record<string, unknown>[],
    planned: Record<string, unknown>[],
  ): CrpRow[] {
    return (workCenters ?? []).map((wc) => {
      const wcId = String(wc['id']);
      const machines = safeNum(wc['machine_count'], 1);
      const hoursPerDay = safeNum(wc['hours_per_day'], 8);
      const efficiency = safeNum(wc['efficiency_rate'], 0.85);
      const utilization = safeNum(wc['utilization_factor'], 1.0);

      // Standard CRP formula: machines × hours/day × working_days × efficiency × utilization
      const availHours = machines * hoursPerDay * CRP_HORIZON_DAYS * efficiency * utilization;

      let requiredMins = 0;
      for (const po of planned) {
        const routingOps = (ops ?? []).filter(
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
