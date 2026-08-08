/**
 * test/pp/pp-ai-planning.service.spec.ts
 *
 * PpAiPlanningService — 7-step AI-planning chain orchestrator (skeleton).
 * Steps 1/3/4 read real PP data via injected services (PpMpsService/
 * PpIntelligenceService/PpCrpService) and honestly report empty/failed
 * status without fabricating data (Q-40). Step 7 is AI-key-gated: no
 * provider key configured → `pending_ai_key`, never a fabricated verdict.
 */

// VISION-3340 #23: step 6 now reads/writes via @shared/db.runQuery. Mock it so these
// skeleton-orchestration tests never touch a real DB — with no rows queued, step 6
// degrades to an honest `empty` (no persist), leaving every assertion below unchanged.
jest.mock('@shared/db', () => ({ runQuery: jest.fn().mockResolvedValue({ rows: [] }) }));

import { PpAiPlanningService, AiPlanStep } from '../../src/modules/pp/application/services/pp-ai-planning.service';
import type { PpMpsService } from '../../src/modules/pp/application/services/pp-mps.service';
import type { PpCrpService } from '../../src/modules/pp/application/services/pp-crp.service';
import type { PpIntelligenceService } from '../../src/modules/pp/application/services/pp-intelligence.service';
import type { ConfigService } from '@nestjs/config';

function buildConfig(env: Record<string, string | undefined> = {}): jest.Mocked<ConfigService> {
  return {
    get: jest.fn((key: string) => env[key]),
  } as unknown as jest.Mocked<ConfigService>;
}

function buildMps(overrides: Partial<jest.Mocked<PpMpsService>> = {}): jest.Mocked<PpMpsService> {
  return {
    getMps: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    ...overrides,
  } as unknown as jest.Mocked<PpMpsService>;
}

function buildCrp(overrides: Partial<jest.Mocked<PpCrpService>> = {}): jest.Mocked<PpCrpService> {
  return {
    getCrp: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    ...overrides,
  } as unknown as jest.Mocked<PpCrpService>;
}

function buildIntelligence(
  overrides: Partial<jest.Mocked<PpIntelligenceService>> = {},
): jest.Mocked<PpIntelligenceService> {
  return {
    runMrp: jest.fn().mockResolvedValue({
      ok: true,
      data: { netRequirements: [], plannedOrders: [], policies: [] },
    }),
    ...overrides,
  } as unknown as jest.Mocked<PpIntelligenceService>;
}

function buildService(opts?: {
  config?: jest.Mocked<ConfigService>;
  mps?: jest.Mocked<PpMpsService>;
  crp?: jest.Mocked<PpCrpService>;
  intelligence?: jest.Mocked<PpIntelligenceService>;
}): PpAiPlanningService {
  return new PpAiPlanningService(
    opts?.config ?? buildConfig(),
    opts?.mps ?? buildMps(),
    opts?.crp ?? buildCrp(),
    opts?.intelligence ?? buildIntelligence(),
  );
}

describe('PpAiPlanningService.buildSkeleton', () => {
  it('gates step 7 with pending_ai_key and reports ownerDataNeeded when no AI provider key is configured', async () => {
    const svc = buildService({ config: buildConfig({}) });

    const r = await svc.buildSkeleton('2026-07-01');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.aiReady).toBe(false);
    expect(r.data.aiProvider).toBeNull();
    const step7 = r.data.steps.find((s) => s.step === AiPlanStep.AI_OPTIMIZE);
    expect(step7?.status).toBe('pending_ai_key');
    expect(r.data.ownerDataNeeded).toHaveLength(1);
    expect(r.data.ownerDataNeeded[0]).toContain('AI provayder kaliti');
  });

  it('never fabricates an AI verdict without a key — step 7 summary carries no plan data', async () => {
    const svc = buildService({ config: buildConfig({}) });

    const r = await svc.buildSkeleton('2026-07-01');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step7 = r.data.steps.find((s) => s.step === AiPlanStep.AI_OPTIMIZE);
    expect(step7?.summary).toEqual({
      blocked: true,
      reason: 'AI provayder kaliti sozlanmagan — egasi kalitni bergach faollashadi',
      taskType: 'mes.schedule_optimize',
    });
  });

  it('resolves provider priority gemini > openai > claude and marks step 7 completed when a key is present', async () => {
    const svc = buildService({
      config: buildConfig({ GEMINI_API_KEY: 'x', OPENAI_API_KEY: 'y', ANTHROPIC_API_KEY: 'z' }),
    });

    const r = await svc.buildSkeleton('2026-07-01');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.aiProvider).toBe('gemini');
    expect(r.data.aiReady).toBe(true);
    expect(r.data.ownerDataNeeded).toEqual([]);
    const step7 = r.data.steps.find((s) => s.step === AiPlanStep.AI_OPTIMIZE);
    expect(step7?.status).toBe('completed');
  });

  it('falls back to openai then claude when higher-priority keys are absent', async () => {
    const openaiSvc = buildService({ config: buildConfig({ OPENAI_API_KEY: 'y' }) });
    const openaiResult = await openaiSvc.buildSkeleton('2026-07-01');
    expect(openaiResult.ok).toBe(true);
    if (openaiResult.ok) expect(openaiResult.data.aiProvider).toBe('openai');

    const claudeSvc = buildService({ config: buildConfig({ ANTHROPIC_API_KEY: 'z' }) });
    const claudeResult = await claudeSvc.buildSkeleton('2026-07-01');
    expect(claudeResult.ok).toBe(true);
    if (claudeResult.ok) expect(claudeResult.data.aiProvider).toBe('claude');
  });

  it('computes step 1 demand/ATP counts honestly from live MPS rows (no fabrication)', async () => {
    const svc = buildService({
      mps: buildMps({
        getMps: jest.fn().mockResolvedValue({
          ok: true,
          data: [{ canPromise: true }, { canPromise: true }, { canPromise: false }],
        }),
      }),
    });

    const r = await svc.buildSkeleton('2026-07-01');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step1 = r.data.steps.find((s) => s.step === AiPlanStep.DEMAND_ATP);
    expect(step1?.status).toBe('completed');
    expect(step1?.summary).toEqual({ demandRows: 3, promisable: 2, atShortage: 1 });
  });

  it('reports step 1 as empty (not fabricated) when the MPS source has no rows in scope', async () => {
    const svc = buildService({ mps: buildMps({ getMps: jest.fn().mockResolvedValue({ ok: true, data: [] }) }) });

    const r = await svc.buildSkeleton('2026-07-01');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step1 = r.data.steps.find((s) => s.step === AiPlanStep.DEMAND_ATP);
    expect(step1?.status).toBe('empty');
    expect(step1?.summary).toEqual({ demandRows: 0, promisable: 0, atShortage: 0 });
  });

  it('marks step 1 as failed (not silently empty) when the MPS source errors', async () => {
    const svc = buildService({
      mps: buildMps({
        getMps: jest.fn().mockResolvedValue({ ok: false, error: { code: 'INTERNAL', message: 'db down' } }),
      }),
    });

    const r = await svc.buildSkeleton('2026-07-01');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step1 = r.data.steps.find((s) => s.step === AiPlanStep.DEMAND_ATP);
    expect(step1?.status).toBe('failed');
    expect(step1?.summary).toEqual({ error: 'db down' });
  });

  it('computes step 3 MRP shortage lines from netRequirements with positive net requirement (nr)', async () => {
    const svc = buildService({
      intelligence: buildIntelligence({
        runMrp: jest.fn().mockResolvedValue({
          ok: true,
          data: {
            netRequirements: [{ nr: 5 }, { nr: 0 }, { nr: -2 }],
            plannedOrders: [{ id: 1 }],
            policies: [{ id: 1 }, { id: 2 }],
          },
        }),
      }),
    });

    const r = await svc.buildSkeleton('2026-07-01');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step3 = r.data.steps.find((s) => s.step === AiPlanStep.MRP_RESERVE);
    expect(step3?.status).toBe('completed');
    expect(step3?.summary).toEqual({
      netRequirementLines: 3,
      plannedOrders: 1,
      shortageLines: 1,
      policies: 2,
    });
  });

  it('surfaces step 4 CRP bottleneck work centre honestly, and null when none is overloaded', async () => {
    const bottleneckSvc = buildService({
      crp: buildCrp({
        getCrp: jest.fn().mockResolvedValue({
          ok: true,
          data: [
            { isOverloaded: true, isBottleneck: true, workCenterName: 'HOT_WC', utilizationPct: 98 },
            { isOverloaded: false, isBottleneck: false, workCenterName: 'WC2', utilizationPct: 40 },
          ],
        }),
      }),
    });
    const bottleneckResult = await bottleneckSvc.buildSkeleton('2026-07-01');
    expect(bottleneckResult.ok).toBe(true);
    if (bottleneckResult.ok) {
      const step4 = bottleneckResult.data.steps.find((s) => s.step === AiPlanStep.CRP_CAPACITY);
      expect(step4?.summary).toEqual({
        workCenters: 2,
        overloaded: 1,
        bottleneckWorkCenter: 'HOT_WC',
        bottleneckUtilizationPct: 98,
      });
    }

    const idleSvc = buildService();
    const idleResult = await idleSvc.buildSkeleton('2026-07-01');
    expect(idleResult.ok).toBe(true);
    if (idleResult.ok) {
      const step4 = idleResult.data.steps.find((s) => s.step === AiPlanStep.CRP_CAPACITY);
      expect(step4?.summary).toEqual({
        workCenters: 0,
        overloaded: 0,
        bottleneckWorkCenter: null,
        bottleneckUtilizationPct: null,
      });
      expect(step4?.status).toBe('empty');
    }
  });

  it('always returns all 7 steps in the canonical AI_PLAN_STEP_ORDER sequence', async () => {
    const svc = buildService();

    const r = await svc.buildSkeleton('2026-07-01');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.steps.map((s) => s.step)).toEqual([
      AiPlanStep.DEMAND_ATP,
      AiPlanStep.TECHCARD_BOM,
      AiPlanStep.MRP_RESERVE,
      AiPlanStep.CRP_CAPACITY,
      AiPlanStep.SEQUENCING,
      AiPlanStep.SHIFT_ASSIGN,
      AiPlanStep.AI_OPTIMIZE,
    ]);
  });

  it('uses the provided planDate verbatim, and defaults to today when omitted', async () => {
    const svc = buildService();

    const withDate = await svc.buildSkeleton('2026-03-15');
    expect(withDate.ok).toBe(true);
    if (withDate.ok) expect(withDate.data.planDate).toBe('2026-03-15');

    const withoutDate = await svc.buildSkeleton();
    expect(withoutDate.ok).toBe(true);
    if (withoutDate.ok) expect(withoutDate.data.planDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
