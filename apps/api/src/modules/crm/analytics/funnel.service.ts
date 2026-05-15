/**
 * @module funnel.service
 * @description Sales-funnel analytics: win-rate, stage-by-stage conversion,
 *   and pipeline velocity. Composes the data shown on the CRM Funnel
 *   Analytics dashboard.
 *
 *   Three formulas:
 *     winRate     = won / (won + lost) × 100
 *     conversion  = movedToNext / entered × 100   (per stage)
 *     velocity    = opportunities × winRate × avgDealSize / avgCycleDays
 *
 *   `velocity` answers "how many UZS of pipeline value do we convert per
 *   day?" — the single number that managers can compare across teams and
 *   across periods. Higher = faster cash collection.
 * @layer Service (CRM analytics)
 *
 * WHY VELOCITY FORMULA INCLUDES winRate
 *   Raw pipeline × deal size doesn't account for the fact that not every
 *   open opportunity closes. Multiplying by historical win-rate weights
 *   the calculation by realistic conversion. This matches the standard
 *   "pipeline velocity" definition (Mark Roberge / Hubspot playbook).
 *
 * WHY avgCycleDays defaults to 30, not 1
 *   With no `close_date` on any row, average cycle is undefined. Defaulting
 *   to 30 days (one month) lets velocity still compute as "monthly revenue
 *   rate"; setting it to 1 would massively over-state velocity.
 *
 * WHY composeFunnelData EXISTS (instead of controller orchestration)
 *   Reviewer Rule 6 forbids the controller from chaining queries and
 *   running formulas. This method does the orchestration so the controller
 *   becomes a single `return service.composeFunnelData()` call.
 *
 *   The `unwrapResult` helper at the top of the file is local on purpose:
 *   we want service-level "fallback on Err" behaviour without exporting an
 *   HTTP-aware unwrap that would tempt callers to throw inside services.
 *
 * WHY STAGE DATA IS FILTERED BY `is_success`/`is_fail` IN SQL
 *   Stage semantics (won/lost flags) belong to the `crm_stages` config,
 *   not to the deal itself — same stage might be "won" for one pipeline
 *   and a pure intermediate for another. Joining on stage keeps the
 *   classification accurate per-pipeline.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

/** Extract Ok data from a Result, or return fallback on Err — service-layer only (no HTTP throw) */
function unwrapResult<T, F>(result: Result<T, AppError>, fallback: F): T | F {
  return result.ok ? result.data : fallback;
}

export interface StageRow {
  stage_name: string;
  count: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface VelocityRow {
  active_deals: number;
  won_count: number;
  closed_count: number;
  avg_deal_size: number;
  avg_cycle_days: number;
}

export interface WinRateInput {
  won: number;
  lost: number;
}

export interface WinRateResult {
  won: number;
  lost: number;
  total: number;
  winRate: number;
  lossRate: number;
}

export interface FunnelStage {
  name: string;
  entered: number;
  movedToNext: number;
}

export interface FunnelConversionResult {
  stages: Array<FunnelStage & { conversionRate: number }>;
  overallConversion: number;
}

export interface PipelineVelocityInput {
  opportunities: number;
  winRateFraction: number;
  avgDealSize: number;
  avgSalesCycleDays: number;
}

export interface PipelineVelocityResult {
  velocity: number;
  opportunities: number;
  winRate: number;
  avgDealSize: number;
  avgSalesCycleDays: number;
}

@Injectable()
export class FunnelService {
  @Calculation('crm.funnel.winRate')
  async calculateWinRate(input: WinRateInput): Promise<Result<WinRateResult, AppError>> {
    const won = safeNum(input.won);
    const lost = safeNum(input.lost);

    if (won < 0 || lost < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'won va lost manfiy bo\'lishi mumkin emas' });
    }
    const total = won + lost;
    if (total === 0) {
      return Err({ code: 'BAD_REQUEST', message: 'Hech qanday bitim yo\'q (won + lost = 0)' });
    }

    const winRate = safeDiv(won, total) * 100;
    const lossRate = safeDiv(lost, total) * 100;

    return Ok({ won, lost, total, winRate, lossRate });
  }

  @Calculation('crm.funnel.conversion')
  async calculateConversion(stages: FunnelStage[]): Promise<Result<FunnelConversionResult, AppError>> {
    if (!stages.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Funnel bosqichlari bo\'sh' });
    }

    const enriched = stages.map(s => ({
      ...s,
      entered: safeNum(s.entered),
      movedToNext: safeNum(s.movedToNext),
      conversionRate: safeDiv(safeNum(s.movedToNext), safeNum(s.entered)) * 100,
    }));

    const firstEntered = safeNum(stages[0].entered);
    const lastMoved = safeNum(stages[stages.length - 1].movedToNext);
    const overallConversion = safeDiv(lastMoved, firstEntered) * 100;

    return Ok({ stages: enriched, overallConversion });
  }

  @Calculation('crm.funnel.velocity')
  async calculateVelocity(input: PipelineVelocityInput): Promise<Result<PipelineVelocityResult, AppError>> {
    const { opportunities, winRateFraction, avgDealSize, avgSalesCycleDays } = input;

    const opps = safeNum(opportunities);
    const wr = safeNum(winRateFraction);
    const ads = safeNum(avgDealSize);
    const cycle = safeNum(avgSalesCycleDays);

    if (wr < 0 || wr > 1) {
      return Err({ code: 'BAD_REQUEST', message: 'winRateFraction 0..1 oralig\'ida bo\'lishi kerak' });
    }
    if (opps < 0 || ads < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'opportunities va avgDealSize manfiy bo\'lishi mumkin emas' });
    }
    if (cycle <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'avgSalesCycleDays musbat bo\'lishi kerak' });
    }

    const velocity = safeDiv(opps * wr * ads, cycle);

    return Ok({
      velocity,
      opportunities: opps,
      winRate: wr * 100,
      avgDealSize: ads,
      avgSalesCycleDays: cycle,
    });
  }

  async getStageData(pipelineId?: string): Promise<StageRow[]> {
    return runQuery<StageRow>(
      pipelineId
        ? sql`
          SELECT cs.name AS stage_name, COUNT(*)::int AS count,
            COALESCE(cs.is_success, false) AS is_won,
            COALESCE(cs.is_fail,    false) AS is_lost
          FROM crm_deals d
          JOIN crm_stages cs ON cs.id::text = d.stage_id
          WHERE d.pipeline_id = ${pipelineId} AND d.deleted_at IS NULL
          GROUP BY cs.name, cs.is_success, cs.is_fail, cs.sort_order
          ORDER BY cs.sort_order ASC
        `
        : sql`
          SELECT cs.name AS stage_name, COUNT(*)::int AS count,
            COALESCE(cs.is_success, false) AS is_won,
            COALESCE(cs.is_fail,    false) AS is_lost
          FROM crm_deals d
          JOIN crm_stages cs ON cs.id::text = d.stage_id
          WHERE d.deleted_at IS NULL
          GROUP BY cs.name, cs.is_success, cs.is_fail, cs.sort_order
          ORDER BY cs.sort_order ASC
        `,
    );
  }

  /**
   * Compose the full funnel response — fetches all data, runs all algorithms,
   * and returns the complete response object. Controller calls only this method.
   */
  async composeFunnelData(pipelineId?: string): Promise<{
    winRate: WinRateResult | { won: number; lost: number; total: number; winRate: number; lossRate: number };
    funnel:  FunnelConversionResult;
    velocity: PipelineVelocityResult | { velocity: number; opportunities: number; winRateFraction: number; avgDealSize: number; avgSalesCycleDays: number; winRate: number };
    rawStages: StageRow[];
  }> {
    const [rows, vRow] = await Promise.all([this.getStageData(pipelineId), this.getVelocityData()]);
    const winRateData = await this.computeWinRateBlock(rows);
    const funnel = await this.computeFunnelBlock(rows);
    const velocity = await this.computeVelocityBlock(vRow);
    return { winRate: winRateData, funnel, velocity, rawStages: rows };
  }

  private async computeWinRateBlock(rows: StageRow[]) {
    const won  = rows.filter(r => r.is_won).reduce((s, r) => s + safeNum(r.count), 0);
    const lost = rows.filter(r => r.is_lost).reduce((s, r) => s + safeNum(r.count), 0);
    const total = won + lost;
    return total > 0
      ? unwrapResult(await this.calculateWinRate({ won, lost }), { won, lost, total, winRate: 0, lossRate: 0 })
      : { won, lost, total, winRate: 0, lossRate: 0 };
  }

  private async computeFunnelBlock(rows: StageRow[]): Promise<FunnelConversionResult> {
    const stageRows = rows.length
      ? rows.map((r, i) => ({ name: r.stage_name, entered: safeNum(r.count), movedToNext: safeNum(rows[i + 1]?.count ?? 0) }))
      : [{ name: 'Ma\'lumot yo\'q', entered: 0, movedToNext: 0 }];
    return unwrapResult(await this.calculateConversion(stageRows), {
      stages: stageRows.map(s => ({ ...s, conversionRate: 0 })),
      overallConversion: 0,
    });
  }

  private async computeVelocityBlock(vRow: VelocityRow) {
    const opportunities = safeNum(vRow.active_deals);
    const winRateFraction = safeNum(vRow.closed_count) > 0 ? safeNum(vRow.won_count) / safeNum(vRow.closed_count) : 0;
    const avgDealSize = safeNum(vRow.avg_deal_size);
    const avgCycleDays = Math.max(safeNum(vRow.avg_cycle_days), 1);
    const velocityInput = { opportunities, winRateFraction, avgDealSize, avgSalesCycleDays: avgCycleDays };
    return winRateFraction > 0 && avgDealSize > 0
      ? unwrapResult(await this.calculateVelocity(velocityInput), { velocity: 0, ...velocityInput, winRate: 0 })
      : { velocity: 0, ...velocityInput, winRate: winRateFraction * 100 };
  }

  async getVelocityData(): Promise<VelocityRow> {
    const rows = await runQuery<VelocityRow>(sql`
      SELECT
        COUNT(*) FILTER (WHERE stage_semantic_id NOT IN ('WON','LOST') OR stage_semantic_id IS NULL)::int AS active_deals,
        COUNT(*) FILTER (WHERE stage_semantic_id = 'WON')::int  AS won_count,
        COUNT(*) FILTER (WHERE stage_semantic_id IN ('WON','LOST'))::int AS closed_count,
        COALESCE(AVG(opportunity::numeric), 0)::float            AS avg_deal_size,
        COALESCE(AVG(
          EXTRACT(DAY FROM (close_date::timestamp - date_create))
        ) FILTER (WHERE close_date IS NOT NULL), 30)::float      AS avg_cycle_days
      FROM crm_deals
      WHERE deleted_at IS NULL
    `);
    return rows[0] ?? { active_deals: 0, won_count: 0, closed_count: 0, avg_deal_size: 0, avg_cycle_days: 30 };
  }
}
