import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { safeDiv } from '@common/math/math-utils';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import { AGENT_CODES, AI_GEMINI_MODEL, PLANNER_MOLD_LEAD_DAYS, PLANNER_MATERIAL_LEAD_DAYS } from '../common/ai-agents.constants';

export interface Job {
  id:    string;
  t1:    number;
  t2:    number;
  label: string;
}

export interface CpmTask {
  id:         string;
  duration:   number;
  predecessors: string[];
}

export interface CpmResult {
  taskId:        string;
  es:            number;
  ef:            number;
  ls:            number;
  lf:            number;
  totalFloat:    number;
  isCritical:    boolean;
  isAtRisk:      boolean;
}

export interface EoqResult {
  annualDemand:    number;
  orderingCostUzs: number;
  holdingCostPct:  number;
  eoqUnits:        number;
}

export interface PlannerResult {
  referenceId:    string;
  johnsonSequence: Job[];
  makespan:        number;
  cpm:             CpmResult[];
  criticalPath:    string[];
  eta:             Date;
  deadlineRisk:    boolean;
  eoq?:            EoqResult;
}

@Injectable()
export class AiPlannerService {
  private readonly logger = new Logger(AiPlannerService.name);

  constructor(
    private readonly logSvc:  AiDecisionLogService,
    private readonly events:  EventEmitter2,
  ) {}

  johnsonRule(jobs: Job[]): Job[] {
    const U = jobs.filter((j) => j.t1 <= j.t2).sort((a, b) => a.t1 - b.t1);
    const V = jobs.filter((j) => j.t1 > j.t2).sort((a, b) => b.t2 - a.t2);
    return [...U, ...V];
  }

  calcMakespan(sequence: Job[]): number {
    let m1End = 0;
    let m2End = 0;
    for (const job of sequence) {
      m1End = m1End + job.t1;
      m2End = Math.max(m2End, m1End) + job.t2;
    }
    return m2End;
  }

  cpm(tasks: CpmTask[]): CpmResult[] {
    const map  = new Map(tasks.map((t) => [t.id, t]));
    const es:  Record<string, number> = {};
    const ef:  Record<string, number> = {};

    for (const task of tasks) {
      const predEf = task.predecessors.map((pid) => ef[pid] ?? 0);
      es[task.id]  = predEf.length > 0 ? Math.max(...predEf) : 0;
      ef[task.id]  = es[task.id] + task.duration;
    }

    const maxEf  = Math.max(...Object.values(ef));
    const lf: Record<string, number> = {};
    const ls: Record<string, number> = {};

    for (const task of [...tasks].reverse()) {
      const succLs = tasks
        .filter((t) => t.predecessors.includes(task.id))
        .map((t) => ls[t.id] ?? maxEf);
      lf[task.id] = succLs.length > 0 ? Math.min(...succLs) : maxEf;
      ls[task.id] = lf[task.id] - task.duration;
    }

    return tasks.map((task) => {
      const tf = ls[task.id] - es[task.id];
      return {
        taskId:      task.id,
        es:          es[task.id] ?? 0,
        ef:          ef[task.id] ?? 0,
        ls:          ls[task.id] ?? 0,
        lf:          lf[task.id] ?? 0,
        totalFloat:  tf,
        isCritical:  tf === 0,
        isAtRisk:    tf <= 1 && tf > 0,
      };
    });
  }

  calcEoq(annualDemand: number, orderingCostUzs: number, holdingCostPct: number, unitCostUzs: number): EoqResult {
    const H = holdingCostPct * unitCostUzs;
    const eoqUnits = H > 0
      ? Math.ceil(Math.sqrt((2 * annualDemand * orderingCostUzs) / H))
      : annualDemand;
    return { annualDemand, orderingCostUzs, holdingCostPct, eoqUnits };
  }

  async plan(
    referenceId:       string,
    jobs:              Job[],
    tasks:             CpmTask[],
    estimatedDelivery: Date,
    bufferDays:        number,
  ): Promise<PlannerResult> {
    const start          = Date.now();
    const canonicalInput = {
      referenceId,
      jobIds:   jobs.map((j) => j.id).sort(),
      taskIds:  tasks.map((t) => t.id).sort(),
      bufferDays,
    };
    const inputHash      = this.logSvc.hashInput(canonicalInput);

    // 1-hour idempotency gate: skip re-planning the same order within the cache window
    const cached = await this.logSvc.findCachedDecision(AGENT_CODES.PLANNER, inputHash).catch((err: unknown) => {
      this.logger.warn({ msg: 'Planner cache lookup failed; computing fresh', referenceId, err });
      return null;
    });
    if (cached) {
      this.logger.debug({ msg: 'Planner cache hit — skipping re-plan', referenceId });
      const sequence = this.johnsonRule(jobs);
      const makespan = this.calcMakespan(sequence);
      const cpmRes   = this.cpm(tasks);
      const criticalPath = cpmRes.filter((t) => t.isCritical).map((t) => t.taskId);
      const deadlineRisk = cached.action === 'deadline_risk';
      const criticalDays = Math.max(...cpmRes.map((t) => t.ef), 0);
      const etaDays      = Math.max(criticalDays, PLANNER_MOLD_LEAD_DAYS, PLANNER_MATERIAL_LEAD_DAYS) + bufferDays;
      return { referenceId, johnsonSequence: sequence, makespan, cpm: cpmRes, criticalPath, eta: new Date(Date.now() + etaDays * 86_400_000), deadlineRisk };
    }

    const sequence = this.johnsonRule(jobs);
    const makespan = this.calcMakespan(sequence);
    const cpmRes   = this.cpm(tasks);

    const criticalPath  = cpmRes.filter((t) => t.isCritical).map((t) => t.taskId);
    const criticalDays  = Math.max(...cpmRes.map((t) => t.ef), 0);
    const etaDays       = Math.max(criticalDays, PLANNER_MOLD_LEAD_DAYS, PLANNER_MATERIAL_LEAD_DAYS) + bufferDays;
    const eta           = new Date(Date.now() + etaDays * 86_400_000);
    const deadlineRisk  = eta > estimatedDelivery;

    const eoq = this.calcEoq(
      Math.max(1, jobs.length * 10),
      500_000,
      0.20,
      50_000,
    );

    const confidence = deadlineRisk ? 0.65 : 0.90;

    await this.logSvc.log({
      agentCode:    AGENT_CODES.PLANNER,
      entityType:   'order',
      entityId:     referenceId,
      inputData:    canonicalInput,
      decision:     { action: deadlineRisk ? 'deadline_risk' : 'on_track', confidence, alternatives: [{ deadlineRisk, etaIso: eta.toISOString() }] },
      confidence,
      modelVersion: AI_GEMINI_MODEL,
      autoExecuted: !deadlineRisk,
      latencyMs:    Date.now() - start,
    });

    if (deadlineRisk) {
      this.logger.warn({
        msg:         'Muddat xavfi aniqlandi',
        referenceId,
        eta:         eta.toISOString(),
        deadline:    estimatedDelivery.toISOString(),
      });
      this.events.emit('ai.planner.deadline_risk', {
        referenceId,
        eta,
        deadline:     estimatedDelivery,
        criticalPath,
        bufferDays,
        timestamp:    new Date(),
      });
    }

    return { referenceId, johnsonSequence: sequence, makespan, cpm: cpmRes, criticalPath, eta, deadlineRisk, eoq };
  }
}
