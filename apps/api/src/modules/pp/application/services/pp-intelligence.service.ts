import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery, ddlRun } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { RunMrpHandler, LotSizingMethod } from '../commands/run-mrp.handler';
import type { MpsRow, MaterialPolicy, MrpRunResult } from '../commands/run-mrp.handler';
import type { BomEdge } from '../../domain/services/bom-explosion.service';
import { LearningCurveService } from '../../domain/services/learning-curve.service';
import type { LearningCurveResult } from '../../domain/services/learning-curve.service';

export interface EnrichedMrpResult extends MrpRunResult {
  openingOnHand: Record<string, number>;
  scheduledReceiptsByMaterial: Record<string, number[]>;
  policies: MaterialPolicy[];
}

export interface MrpRunInput {
  lotSizingMethod?: LotSizingMethod;
  horizonPeriods?: number;
  mpsRows?: MpsRow[];
}

const MRP_DEFAULT_HORIZON = 12;

@Injectable()
export class PpIntelligenceService implements OnModuleInit {
  private readonly logger = new Logger(PpIntelligenceService.name);

  constructor(
    private readonly mrpHandler: RunMrpHandler,
    private readonly lcSvc: LearningCurveService,
  ) {}

  onModuleInit(): void {
    runQuery(sql`UPDATE pp_mrp_runs SET status = 'failed' WHERE status = 'running'`)
      .catch((e: Error) => this.logger.warn(`Stale MRP run cleanup skipped: ${e.message}`));
    ddlRun(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS mrp_single_running_idx
      ON pp_mrp_runs ((status)) WHERE status = 'running'
    `).catch((e: Error) => this.logger.warn(`Unique running index skipped: ${e.message}`));
  }

  async runMrp(input: MrpRunInput): Promise<Result<EnrichedMrpResult, AppError>> {
    let runId: number | undefined;
    try {
      const method = input.lotSizingMethod ?? 'L4L';
      const horizon = input.horizonPeriods ?? MRP_DEFAULT_HORIZON;
      runId = await this.insertRun(method, horizon);
      const inputs = await this.loadRunInputs(method, horizon, input.mpsRows);
      const result = await this.mrpHandler.runMrp({ ...inputs, horizonPeriods: horizon });
      if (!result.ok) {
        await this.setRunStatus(runId, 'failed');
        return Err(result.error);
      }
      await this.setRunStatus(runId, 'completed');
      await this.persistRunLines(runId, result.data, inputs.onHandByMaterial);
      return Ok({ ...result.data, openingOnHand: inputs.onHandByMaterial, scheduledReceiptsByMaterial: inputs.scheduledReceiptsByMaterial, policies: inputs.policies });
    } catch (e) {
      if (runId) await this.setRunStatus(runId, 'failed').catch(() => {});
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  private async insertRun(method: string, horizon: number): Promise<number> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO pp_mrp_runs (lot_sizing_method, status, horizon_periods, run_at)
        VALUES (${method}, 'running', ${horizon}, NOW())
        RETURNING id
      `);
      return r.rows[0]['id'];
    } catch {
      throw Object.assign(new Error('MRP hisoblash allaqachon bajarilmoqda'), { code: 'CONFLICT' });
    }
  }

  private async setRunStatus(runId: number, status: string): Promise<void> {
    await runQuery(sql`UPDATE pp_mrp_runs SET status = ${status} WHERE id = ${runId}`)
      .catch((e: Error) => this.logger.warn(`Failed to set run ${runId} status=${status}: ${e.message}`));
  }

  private async loadRunInputs(method: string, horizon: number, mpsInput?: MpsRow[]) {
    const [bomRows, mpsRows, onHandRows, policyRows] = await Promise.all([
      runQuery<BomEdge>(sql`
        SELECT bh.product_id::text AS "parentId", bi.material_id::text AS "childId",
               COALESCE(bi.quantity, 1)::numeric AS "qtyPerUnit"
        FROM bom_headers bh JOIN bom_items bi ON bi.bom_id = bh.id
        WHERE bh.is_active = true AND bh.deleted_at IS NULL LIMIT 1000
      `),
      mpsInput?.length ? Promise.resolve(mpsInput) : this.loadMpsFromDb(horizon),
      runQuery(sql`SELECT id::text AS material_id, GREATEST(current_stock, 0)::numeric AS qty_on_hand FROM material_cards WHERE is_active = true`),
      runQuery(sql`
        SELECT mc.id::text AS material_id, COALESCE(ip.safety_stock, 0)::numeric AS safety_stock,
               COALESCE(ip.lead_time_days, 1)::integer AS lead_time_days, COALESCE(ip.eoq, 0)::numeric AS eoq_qty
        FROM material_cards mc LEFT JOIN inventory_policy ip ON ip.material_id = mc.id
        WHERE mc.is_active = true LIMIT 500
      `),
    ]);

    const onHand: Record<string, number> = {};
    for (const r of onHandRows.rows ?? []) onHand[String(r['material_id'])] = safeNum(r['qty_on_hand']);

    const policies: MaterialPolicy[] = (policyRows.rows ?? []).map((r) => ({
      materialId: String(r['material_id']),
      lotSizingMethod: method as LotSizingMethod,
      leadTimeDays: safeNum(r['lead_time_days']),
      safetyStock: safeNum(r['safety_stock']),
      eoq: safeNum(r['eoq_qty']),
    }));

    const srRows = await runQuery(sql`
      SELECT poi.material_id::text AS material_id, COALESCE(poi.quantity, 0)::numeric AS qty,
             GREATEST(0, EXTRACT(DAY FROM (po.expected_delivery_date - NOW()))::integer / 7) AS period_offset
      FROM mm_purchase_order_items poi
      JOIN mm_purchase_orders po ON po.id = poi.purchase_order_id
      WHERE po.status IN ('approved', 'sent', 'partial')
        AND po.expected_delivery_date IS NOT NULL AND po.expected_delivery_date >= NOW()
        AND po.expected_delivery_date <= NOW() + (${horizon} || ' weeks')::interval
      LIMIT 2000
    `);

    const scheduledReceiptsByMaterial: Record<string, number[]> = {};
    for (const r of srRows.rows ?? []) {
      const matId = String(r['material_id']);
      const idx = Math.min(Math.max(0, Number(r['period_offset']) || 0), horizon - 1);
      if (!scheduledReceiptsByMaterial[matId]) scheduledReceiptsByMaterial[matId] = new Array(horizon).fill(0);
      scheduledReceiptsByMaterial[matId][idx] = (scheduledReceiptsByMaterial[matId][idx] ?? 0) + safeNum(r['qty']);
    }

    return {
      bomEdges: (bomRows.rows ?? []) as BomEdge[],
      mpsRows: Array.isArray(mpsRows) ? mpsRows : [],
      onHandByMaterial: onHand,
      policies,
      scheduledReceiptsByMaterial,
    };
  }

  private async loadMpsFromDb(horizon: number): Promise<MpsRow[]> {
    // Errors propagate; only fall back to production_orders when mps_periods is empty
    // Uses Sprint-2 mps_periods schema (period, quantity, due_date).
    // Migration backfills these columns on pre-existing tables.
    const r = await runQuery(sql`
      SELECT product_id::text AS product_id,
             COALESCE(quantity, 0)::numeric AS quantity,
             ROW_NUMBER() OVER (ORDER BY due_date NULLS LAST) - 1 AS row_idx
      FROM mps_periods
      ORDER BY due_date NULLS LAST
      LIMIT ${horizon * 20}
    `);

    if (r.rows && r.rows.length > 0) {
      return (r?.rows ?? []).map((row) => ({ productId: String(row['product_id']), periodIndex: Number(row['row_idx']) % horizon, quantity: safeNum(row['quantity']) }));
    }

    const po = await runQuery(sql`
      SELECT product_id::text AS product_id, planned_quantity::numeric AS quantity
      FROM production_orders WHERE status NOT IN ('completed','cancelled') AND planned_start_date IS NOT NULL
      ORDER BY planned_start_date LIMIT ${horizon * 20}
    `);
    return (po.rows ?? []).map((row, i) => ({ productId: String(row['product_id']), periodIndex: i % horizon, quantity: safeNum(row['quantity']) }));
  }

  private async persistRunLines(runId: number, data: MrpRunResult, onHand: Record<string, number>): Promise<void> {
    if (!data.netRequirements.length) return;
    const poByPeriod = new Map<string, number>();
    for (const po of data.plannedOrders) {
      const key = `${po.materialId}:${po.periodIndex}`;
      poByPeriod.set(key, (poByPeriod.get(key) ?? 0) + po.qty);
    }
    for (const nr of data.netRequirements) {
      const poQty = poByPeriod.get(`${nr.materialId}:${nr.period}`) ?? 0;
      await runQuery(sql`
        INSERT INTO pp_mrp_run_lines (run_id, material_id, period, gross_req, on_hand, net_req, planned_order)
        VALUES (${runId}, ${nr.materialId}, ${`W${nr.period + 1}`}, ${nr.gr}, ${onHand[nr.materialId] ?? 0}, ${nr.nr}, ${poQty})
        ON CONFLICT DO NOTHING
      `).catch((e: Error) => this.logger.warn(`MRP line insert failed: ${e.message}`));
    }
  }

  async getLearningCurve(productId: string): Promise<Result<LearningCurveResult, AppError>> {
    try {
      const rows = await runQuery<{ rate: string; t1_minutes: string; units_produced: number }>(sql`
        SELECT learning_rate::numeric AS rate, (t1_hours * 60)::numeric AS t1_minutes,
               COALESCE(units_produced, 0)::integer AS units_produced
        FROM product_learning_curves WHERE product_id::text = ${productId} LIMIT 1
      `);
      const row = rows.rows[0];
      if (!row) return this.lcSvc.calculate({ t1Minutes: 60, rate: 0.80, cumulativeUnits: 100 });

      const prodRows = await runQuery(sql`
        SELECT COALESCE(SUM(planned_quantity), 0)::integer AS total_produced
        FROM production_orders WHERE product_id::text = ${productId} AND status = 'completed'
      `);
      const cumUnits = Math.max(safeNum(row['units_produced'], 0) + safeNum(prodRows.rows[0]?.['total_produced']), 10);
      return this.lcSvc.calculate({ t1Minutes: safeNum(row['t1_minutes'], 60), rate: safeNum(row['rate'], 0.80), cumulativeUnits: cumUnits });
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }
}
