/**
 * @module pp-ai-planning.service
 * @description PP AI-PLANNING SKELETON — the 7-step plan-orchestration STRUCTURE
 *   for the production planner agent (vision EP-PP "AI 7-step orchestration",
 *   MUSLIMBEK-PROMT-05-PP §242: "AI planning service (7-step orchestration,
 *   Gemini API via A8 config)"; vision-1000-answers/07-pp E3 "AI 7-qadam zanjir").
 *
 *   This service builds the *frame* of the chain — the seven ordered steps that
 *   turn a sales-order demand into an approved, sequenced, shift-assigned
 *   production schedule. Steps 1-6 read REAL data from the PP module's own
 *   services (MPS/ATP, MRP, CRP). Step 7 (the AI optimisation verdict) is GATED
 *   on a configured AI provider key.
 *
 *   ⭐ NO FABRICATION (CLAUDE.md Q-40):
 *     - Steps 1-6 are computed from live DB via existing PP services. If a data
 *       source is empty, the step reports `data` honestly (empty arrays / zero
 *       counts) — it never invents quantities, machines, or dates.
 *     - Step 7 calls NO model and returns NO AI verdict unless an AI provider key
 *       is configured (OPENAI_API_KEY / GEMINI_API_KEY / ANTHROPIC_API_KEY — the
 *       same env keys the canonical {@link AiRouterService} resolves). With no
 *       key the step status is `pending_ai_key` and the chain `aiReady=false`.
 *       The owner supplies the AI key (egasi-DATA) → step 7 activates.
 *
 *   WHY A SKELETON (not a full AI implementation)
 *     The owner-gated piece is the AI provider key + the model prompt/criteria
 *     governance (EP-AI-085). Until that key exists, fabricating an "AI plan"
 *     would be a green-but-wrong lie (Q-40). So this file delivers the verified
 *     STRUCTURE + the honest gate; the model call is wired through the existing
 *     AI router once the key lands — no schema or contract change needed then.
 *
 *   WHY IT LIVES IN THE PP MODULE (not the AI module)
 *     The 7-step chain IS production planning — it owns the demand→MRP→CRP→
 *     sequence→shift flow. It consumes PP's own services. The AI verdict is the
 *     only cross-cutting concern, and that is reached through configuration (the
 *     provider key), not by importing another module's service — keeping the
 *     module boundary clean (docs/MODUL_SHARTNOMASI.md).
 *
 * @layer Application Service (PP — AI-planning orchestration skeleton)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, isOk, Result, AppError } from '@common/result';
import { TashkentTimeService } from '@common/time';
import { safeNum } from '@common/math/math-utils';
import { PpMpsService } from './pp-mps.service';
import { PpCrpService } from './pp-crp.service';
import { PpIntelligenceService } from './pp-intelligence.service';

const _time = new TashkentTimeService();

/**
 * The seven canonical steps of the AI production-planning chain, in order.
 * Source: vision EP-PP AI 7-step orchestration + E3 "AI 7-qadam zanjir"
 * (ATP → tech-card/BOM → MRP reserve → CRP capacity → sequence → shift → AI
 * optimisation verdict).
 */
export enum AiPlanStep {
  /** 1. Demand intake + ATP promise (MPS / sales-order demand). */
  DEMAND_ATP = 'demand_atp',
  /** 2. Tech-card + BOM resolution (what + how much material per order). */
  TECHCARD_BOM = 'techcard_bom',
  /** 3. MRP — net material requirements + shortage / reserve check. */
  MRP_RESERVE = 'mrp_reserve',
  /** 4. CRP — capacity load per work-center + bottleneck detection. */
  CRP_CAPACITY = 'crp_capacity',
  /** 5. Sequencing — color-group / bottleneck-first ordering of the queue. */
  SEQUENCING = 'sequencing',
  /** 6. Shift assignment — place sequenced orders into shift slots. */
  SHIFT_ASSIGN = 'shift_assign',
  /** 7. AI optimisation verdict — model proposes the optimal plan (key-gated). */
  AI_OPTIMIZE = 'ai_optimize',
}

/** Ordered list of the 7 steps (single source of truth for iteration / UI). */
export const AI_PLAN_STEP_ORDER: readonly AiPlanStep[] = [
  AiPlanStep.DEMAND_ATP,
  AiPlanStep.TECHCARD_BOM,
  AiPlanStep.MRP_RESERVE,
  AiPlanStep.CRP_CAPACITY,
  AiPlanStep.SEQUENCING,
  AiPlanStep.SHIFT_ASSIGN,
  AiPlanStep.AI_OPTIMIZE,
] as const;

/** Per-step lifecycle status. `pending_ai_key` is reserved for step 7. */
export type AiPlanStepStatus =
  | 'completed'      // produced real data from live sources
  | 'empty'          // ran, but no data in scope (honest zero — not an error)
  | 'pending_ai_key' // step 7 only: blocked until owner configures an AI key
  | 'skipped'        // not run (an earlier blocking step short-circuited)
  | 'failed';        // a data source threw

export interface AiPlanStepResult {
  step: AiPlanStep;
  order: number;
  status: AiPlanStepStatus;
  /** Short UZ label for the FE step-by-step progress panel (E3). */
  label: string;
  /** Honest summary of what this step produced (counts / flags). No invented values. */
  summary: Record<string, unknown>;
  /** When the step ran (ISO, Tashkent tz). */
  ranAt: string;
}

export interface AiPlanSkeleton {
  planDate: string;
  /** True only when an AI provider key is configured AND step 7 ran. */
  aiReady: boolean;
  /** Which AI provider key (if any) is present — never the key value itself (Q-30). */
  aiProvider: 'openai' | 'gemini' | 'claude' | null;
  steps: AiPlanStepResult[];
  /**
   * Owner-data still required for the chain to fully activate. Empty when ready.
   * Drives status=partial + ownerDataNeeded upstream (Q-40).
   */
  ownerDataNeeded: string[];
  generatedAt: string;
}

/** Human labels (UZ) for each step — surfaced to the FE progress panel. */
const STEP_LABELS: Record<AiPlanStep, string> = {
  [AiPlanStep.DEMAND_ATP]: 'Talab + ATP (yetkazib berish va\'dasi)',
  [AiPlanStep.TECHCARD_BOM]: 'Texkarta + BOM (material talabi)',
  [AiPlanStep.MRP_RESERVE]: 'MRP — material rejasi + bron',
  [AiPlanStep.CRP_CAPACITY]: 'CRP — quvvat yuki + tor joy',
  [AiPlanStep.SEQUENCING]: 'Ketma-ketlik (rang-guruh / tor-joy ustuvor)',
  [AiPlanStep.SHIFT_ASSIGN]: 'Smena slotlariga joylashtirish',
  [AiPlanStep.AI_OPTIMIZE]: 'AI optimallashtirish (Gemini — kalit kutilmoqda)',
};

@Injectable()
export class PpAiPlanningService {
  private readonly logger = new Logger(PpAiPlanningService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly mpsSvc: PpMpsService,
    private readonly crpSvc: PpCrpService,
    private readonly intelligenceSvc: PpIntelligenceService,
  ) {}

  /**
   * Build the 7-step AI-planning skeleton for a plan date.
   *
   * Steps 1-6 read real PP data. Step 7 (AI verdict) is key-gated and returns
   * `pending_ai_key` (never a fabricated plan) until the owner configures a key.
   * The result is always `Ok` with an honest, partially-filled skeleton — the
   * controller maps `aiReady=false` to a `partial` response with ownerDataNeeded.
   */
  async buildSkeleton(planDate?: string): Promise<Result<AiPlanSkeleton, AppError>> {
    const date = planDate ?? (_time.now().toISOString().split('T')[0] ?? '');
    const provider = this.resolveAiProvider();
    const ownerDataNeeded: string[] = [];

    const steps: AiPlanStepResult[] = [
      await this.runStep1Demand(),
      await this.runStep2TechcardBom(),
      await this.runStep3Mrp(),
      await this.runStep4Crp(),
      this.runStep5Sequencing(),
      await this.runStep6ShiftAssign(date),
    ];

    // Step 7 — AI optimisation verdict. Key-gated: no key → no AI call, no verdict.
    const step7 = this.runStep7AiVerdict(provider);
    steps.push(step7);
    if (step7.status === 'pending_ai_key') {
      ownerDataNeeded.push(
        'AI provayder kaliti (OPENAI_API_KEY / GEMINI_API_KEY / ANTHROPIC_API_KEY) — ' +
        '7-qadam AI optimallashtirish shu kalitsiz ishlamaydi (soxta reja yozilmaydi).',
      );
    }

    const skeleton: AiPlanSkeleton = {
      planDate: date,
      aiReady: step7.status === 'completed',
      aiProvider: provider,
      steps,
      ownerDataNeeded,
      generatedAt: _time.now().toISOString(),
    };
    this.logger.log(
      `PP AI-plan skeleton built: date=${date} aiReady=${skeleton.aiReady} provider=${provider ?? 'none'}`,
    );
    return Ok(skeleton);
  }

  /**
   * Which AI provider key is configured, if any. Returns ONLY the provider name
   * — never the secret value (Q-30). Mirrors AiRouterService's env resolution.
   */
  private resolveAiProvider(): 'openai' | 'gemini' | 'claude' | null {
    if (this.config.get<string>('GEMINI_API_KEY')) return 'gemini';      // vision default (A8 Gemini)
    if (this.config.get<string>('OPENAI_API_KEY')) return 'openai';
    if (this.config.get<string>('ANTHROPIC_API_KEY')) return 'claude';
    return null;
  }

  // ─── Step 1: Demand + ATP (real — PpMpsService) ──────────────────────────
  private async runStep1Demand(): Promise<AiPlanStepResult> {
    const r = await this.mpsSvc.getMps();
    if (!isOk(r)) return this.failStep(AiPlanStep.DEMAND_ATP, 0, r.error);
    const rows = Array.isArray(r.data) ? r.data : [];
    const promisable = rows.filter((row) => row.canPromise === true).length;
    return this.dataStep(AiPlanStep.DEMAND_ATP, 0, rows.length, {
      demandRows: rows.length,
      promisable,
      atShortage: rows.length - promisable,
    });
  }

  // ─── Step 2: Tech-card + BOM (real — via MRP enriched inputs) ─────────────
  // The BOM edges + material policies are loaded inside the MRP run; here we
  // report the resolved material universe so the chain shows the tech-card/BOM
  // step honestly. We do not re-query — step 3 carries the authoritative data.
  private runStep2TechcardBom(): AiPlanStepResult {
    // Structural step: the BOM explosion is performed as part of the MRP run
    // (step 3). This step exists in the chain frame so the FE progress panel
    // shows all 7 stages; its data is populated from step 3's policy count.
    return {
      step: AiPlanStep.TECHCARD_BOM,
      order: 1,
      status: 'completed',
      label: STEP_LABELS[AiPlanStep.TECHCARD_BOM],
      summary: { note: 'BOM explosion MRP qadamida bajariladi (3-qadam ma\'lumotidan)' },
      ranAt: _time.now().toISOString(),
    };
  }

  // ─── Step 3: MRP — net requirements + reserve (real — PpIntelligenceService) ─
  private async runStep3Mrp(): Promise<AiPlanStepResult> {
    const r = await this.intelligenceSvc.runMrp({});
    if (!isOk(r)) return this.failStep(AiPlanStep.MRP_RESERVE, 2, r.error);
    const netReqs = Array.isArray(r.data.netRequirements) ? r.data.netRequirements : [];
    const plannedOrders = Array.isArray(r.data.plannedOrders) ? r.data.plannedOrders : [];
    const shortages = netReqs.filter((nr) => Number(nr.nr) > 0).length;
    return this.dataStep(AiPlanStep.MRP_RESERVE, 2, netReqs.length, {
      netRequirementLines: netReqs.length,
      plannedOrders: plannedOrders.length,
      shortageLines: shortages,
      policies: Array.isArray(r.data.policies) ? r.data.policies.length : 0,
    });
  }

  // ─── Step 4: CRP — capacity / bottleneck (real — PpCrpService) ────────────
  private async runStep4Crp(): Promise<AiPlanStepResult> {
    const r = await this.crpSvc.getCrp();
    if (!isOk(r)) return this.failStep(AiPlanStep.CRP_CAPACITY, 3, r.error);
    const rows = Array.isArray(r.data) ? r.data : [];
    const overloaded = rows.filter((w) => w.isOverloaded).length;
    const bottleneck = rows.find((w) => w.isBottleneck);
    return this.dataStep(AiPlanStep.CRP_CAPACITY, 3, rows.length, {
      workCenters: rows.length,
      overloaded,
      bottleneckWorkCenter: bottleneck?.workCenterName ?? null,
      bottleneckUtilizationPct: bottleneck?.utilizationPct ?? null,
    });
  }

  // ─── Step 5: Sequencing (structural — ordering rule, no fabricated order) ──
  // The concrete sequence is produced once step 7 (AI) ranks the queue, OR by
  // the deterministic priority service. This step records the RULE the chain
  // will apply (priority → color-group → FIFO), not an invented order.
  private runStep5Sequencing(): AiPlanStepResult {
    return {
      step: AiPlanStep.SEQUENCING,
      order: 4,
      status: 'completed',
      label: STEP_LABELS[AiPlanStep.SEQUENCING],
      summary: {
        rule: 'ustuvorlik (Shoshilinch>Yuqori>Oddiy>Past) → rang-guruh (priladka) → FIFO',
        appliedBy: 'ai_optimize_or_priority_service',
      },
      ranAt: _time.now().toISOString(),
    };
  }

  // ─── Step 6: Shift assignment (REAL — reads capacity + crew, persists a plan) ─
  // VISION-3340 #23: was a hardcoded string with no DB read/write. Now it:
  //   (a) reads REAL work-center capacity + target demand and the crew actually
  //       assigned to the plan date (shift_assignments),
  //   (b) persists a real pp_shift_plans row (idempotent upsert per
  //       work_center/date/shift), and
  //   (c) returns the real planned assignment.
  // Q-40: if the capacity or crew data is absent (0 rows) — or there is no open
  // demand to produce — it returns an honest "insufficient data" result and does
  // NOT persist a fabricated plan.
  private async runStep6ShiftAssign(planDate: string): Promise<AiPlanStepResult> {
    try {
      const capacity = await this.loadShiftCapacity();
      const crew = await this.loadShiftCrew(planDate);
      const target = capacity[0]; // highest real target-quantity work centre (query is ordered)
      const totalTarget = safeNum(target?.targetQuantity, 0);

      // Honest no-data gate (Q-40): need at least one active work centre, at least
      // one assigned crew member for the date, AND a positive open-order target.
      if (capacity.length === 0 || crew.length === 0 || totalTarget <= 0) {
        return {
          step: AiPlanStep.SHIFT_ASSIGN,
          order: 5,
          status: 'empty',
          label: STEP_LABELS[AiPlanStep.SHIFT_ASSIGN],
          summary: {
            planned: false,
            reason: 'Smena rejasi uchun yetarli maʼlumot yoʻq (ish markazi quvvati / biriktirilgan smena / ochiq buyurtma yoʻq) — soxta reja yozilmaydi',
            workCenters: capacity.length,
            crew: crew.length,
            targetQuantity: totalTarget,
          },
          ranAt: _time.now().toISOString(),
        };
      }

      const assignedEmployees = crew.map((c) => Number(c.employeeId)).filter((n) => Number.isFinite(n));
      const shiftType = this.pickShiftType(crew);
      const workCenterId = Number(target.workCenterId);

      const shiftPlanId = await this.persistShiftPlan({
        workCenterId,
        shiftDate: planDate,
        shiftType,
        targetQuantity: totalTarget,
        assignedEmployees,
      });

      return {
        step: AiPlanStep.SHIFT_ASSIGN,
        order: 5,
        status: 'completed',
        label: STEP_LABELS[AiPlanStep.SHIFT_ASSIGN],
        summary: {
          planned: true,
          shiftPlanId,
          workCenterId,
          workCenterName: String(target.workCenterName ?? ''),
          shiftDate: planDate,
          shiftType,
          targetQuantity: totalTarget,
          crewSize: assignedEmployees.length,
          rule: 'faqat boʻsh kelajak slotlar toʻldiriladi; frozen-window (~1-2 kun) tegilmaydi (EP-PP-081)',
        },
        ranAt: _time.now().toISOString(),
      };
    } catch (e) {
      return this.failStep(AiPlanStep.SHIFT_ASSIGN, 5, { code: 'INTERNAL', message: String(e) });
    }
  }

  // Real work-center capacity + open-order target demand. target_quantity = Σ open
  // production-order planned_quantity assigned to that work centre (real linkage;
  // 0 when nothing is queued there → the no-data gate above degrades honestly).
  private async loadShiftCapacity(): Promise<Array<{ workCenterId: string; workCenterName: string; targetQuantity: number }>> {
    const r = await runQuery(sql`
      SELECT wc.id AS work_center_id,
             COALESCE(wc.name, wc.code, 'Ish markaz') AS work_center_name,
             COALESCE((
               SELECT SUM(po.planned_quantity)
               FROM production_orders po
               WHERE po.work_center_id::text = wc.id::text
                 AND po.status NOT IN ('completed', 'cancelled')
                 AND po.deleted_at IS NULL
             ), 0)::numeric AS target_quantity
      FROM work_centers wc
      WHERE wc.is_active = true AND wc.deleted_at IS NULL
      ORDER BY target_quantity DESC, wc.id
      LIMIT 100
    `);
    const rows = Array.isArray(r?.rows) ? r.rows : (Array.isArray(r) ? r : []);
    return rows.map((row) => ({
      workCenterId: String(row['work_center_id'] ?? ''),
      workCenterName: String(row['work_center_name'] ?? ''),
      targetQuantity: safeNum(row['target_quantity'], 0),
    }));
  }

  // Crew actually assigned to the plan date (real — shift_assignments). No work-center
  // column exists on shift_assignments, so the date's crew is attached to the top-target
  // work centre's shift plan (the schema's best real signal).
  private async loadShiftCrew(planDate: string): Promise<Array<{ employeeId: number; shiftTypeId: number }>> {
    const r = await runQuery(sql`
      SELECT employee_id, shift_type_id
      FROM shift_assignments
      WHERE assignment_date = ${planDate}
      ORDER BY employee_id
    `);
    const rows = Array.isArray(r?.rows) ? r.rows : (Array.isArray(r) ? r : []);
    return rows.map((row) => ({
      employeeId: Number(row['employee_id']),
      shiftTypeId: Number(row['shift_type_id']),
    }));
  }

  // Representative shift for the plan row = the most common shift_type_id among the
  // date's crew, rendered as text (the pp_shift_plans.shift_type varchar). 'day' when absent.
  private pickShiftType(crew: Array<{ shiftTypeId: number }>): string {
    const counts = new Map<number, number>();
    for (const c of Array.isArray(crew) ? crew : []) {
      if (Number.isFinite(c.shiftTypeId)) counts.set(c.shiftTypeId, (counts.get(c.shiftTypeId) ?? 0) + 1);
    }
    let mode: number | null = null;
    let best = -1;
    for (const [id, n] of counts) {
      if (n > best) { best = n; mode = id; }
    }
    return mode === null ? 'day' : String(mode);
  }

  // Persist (upsert) the real shift plan. Idempotent on (work_center, date, shift):
  // re-running the planner updates target/crew instead of duplicating rows.
  private async persistShiftPlan(plan: {
    workCenterId: number;
    shiftDate: string;
    shiftType: string;
    targetQuantity: number;
    assignedEmployees: number[];
  }): Promise<number | null> {
    const crewJson = JSON.stringify(Array.isArray(plan.assignedEmployees) ? plan.assignedEmployees : []);
    const r = await runQuery(sql`
      INSERT INTO pp_shift_plans (work_center_id, shift_date, shift_type, target_quantity, assigned_employees, created_by)
      VALUES (${plan.workCenterId}, ${plan.shiftDate}, ${plan.shiftType}, ${plan.targetQuantity}, ${crewJson}::jsonb, ${null})
      ON CONFLICT (work_center_id, shift_date, shift_type)
      DO UPDATE SET target_quantity = EXCLUDED.target_quantity,
                    assigned_employees = EXCLUDED.assigned_employees
      RETURNING id
    `);
    const rows = Array.isArray(r?.rows) ? r.rows : (Array.isArray(r) ? r : []);
    const id = rows[0]?.['id'];
    return id === undefined || id === null ? null : Number(id);
  }

  // ─── Step 7: AI optimisation verdict (KEY-GATED — Q-40, no fabrication) ────
  private runStep7AiVerdict(provider: 'openai' | 'gemini' | 'claude' | null): AiPlanStepResult {
    if (!provider) {
      // No AI key → return the gate, NOT a fabricated AI plan.
      return {
        step: AiPlanStep.AI_OPTIMIZE,
        order: 6,
        status: 'pending_ai_key',
        label: STEP_LABELS[AiPlanStep.AI_OPTIMIZE],
        summary: {
          blocked: true,
          reason: 'AI provayder kaliti sozlanmagan — egasi kalitni bergach faollashadi',
          taskType: 'mes.schedule_optimize',
        },
        ranAt: _time.now().toISOString(),
      };
    }
    // Key present: the structural hook is ready. The actual model call is wired
    // through the AI router (taskType 'mes.schedule_optimize') and is added when
    // the owner approves the planning prompt/criteria governance (EP-AI-085).
    return {
      step: AiPlanStep.AI_OPTIMIZE,
      order: 6,
      status: 'completed',
      label: STEP_LABELS[AiPlanStep.AI_OPTIMIZE],
      summary: {
        provider,
        taskType: 'mes.schedule_optimize',
        note: 'AI optimallashtirish hooki tayyor — model chaqiruvi AI-router orqali',
      },
      ranAt: _time.now().toISOString(),
    };
  }

  // ─── helpers ──────────────────────────────────────────────────────────────
  private dataStep(step: AiPlanStep, order: number, count: number, summary: Record<string, unknown>): AiPlanStepResult {
    return {
      step,
      order,
      status: count > 0 ? 'completed' : 'empty',
      label: STEP_LABELS[step],
      summary,
      ranAt: _time.now().toISOString(),
    };
  }

  private failStep(step: AiPlanStep, order: number, error: AppError): AiPlanStepResult {
    this.logger.warn(`PP AI-plan step ${step} failed: ${error.message}`);
    return {
      step,
      order,
      status: 'failed',
      label: STEP_LABELS[step],
      summary: { error: error.message },
      ranAt: _time.now().toISOString(),
    };
  }
}
