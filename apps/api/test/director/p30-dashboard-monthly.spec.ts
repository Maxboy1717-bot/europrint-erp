/**
 * test/director/p30-dashboard-monthly.spec.ts
 * Unit tests for P30 dashboard planFact delegation + monthly-plan completion.
 */

import { DashboardQueryService } from '../../src/modules/director/application/dashboard-query.service';
import { MonthlyPlanService, computeCompletionPct } from '../../src/modules/director/application/monthly-plan.service';
import type { IMonthlyPlanRepo, IMonthlyPlan } from '../../src/modules/director/domain/repositories/i-monthly-plan.repo';
import { Ok } from '../../src/common/result';

type Row = Record<string, unknown>;

describe('P30 DashboardQueryService — planFact / widgets', () => {
  function makeService(planFactRows: Row[]): DashboardQueryService {
    const tokenRepo = {} as never; // unused by the new methods
    const statRepo = {
      getPlanFact: jest.fn(async () => Ok(planFactRows)),
      getOrderProgress: jest.fn(async () => Ok([{ id: 1, readiness_pct: 50 }])),
      getStatTrends: jest.fn(async () => Ok([{ metric: 'Sotuv', trend_points: [] }])),
      getOpenIssues: jest.fn(async () => Ok([{ author_card_id: 3, main_issue: 'X' }])),
    } as never;
    return new DashboardQueryService(tokenRepo, statRepo);
  }

  it('getPlanFact returns rows from repo', async () => {
    const rows: Row[] = [
      { department: 'Bo\'lim A', total: 10, completed: 6, remaining: 4 },
      { department: 'Bo\'lim B', total: 5, completed: 5, remaining: 0 },
    ];
    const svc = makeService(rows);
    const r = await svc.getPlanFact();
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(2);
    expect(r[0].remaining).toBe(4);
  });

  it('widget getters always return arrays (never crash)', async () => {
    const svc = makeService([]);
    expect(Array.isArray(await svc.getPlanFact())).toBe(true);
    expect(Array.isArray(await svc.getOrderProgress())).toBe(true);
    expect(Array.isArray(await svc.getStatTrends())).toBe(true);
    expect(Array.isArray(await svc.getOpenIssues())).toBe(true);
  });
});

describe('P30 computeCompletionPct', () => {
  it('returns 0 for empty task list', () => {
    expect(computeCompletionPct([])).toBe(0);
  });

  it('computes done percentage (done flag and status=done both count)', () => {
    const tasks = [
      { done: true },
      { status: 'done' },
      { done: false },
      { status: 'pending' },
    ];
    expect(computeCompletionPct(tasks)).toBe(50);
  });

  it('handles non-array input gracefully', () => {
    expect(computeCompletionPct(undefined as unknown as unknown[])).toBe(0);
  });
});

describe('P30 MonthlyPlanService — completePlan', () => {
  function plan(over: Partial<IMonthlyPlan> = {}): IMonthlyPlan {
    return {
      id: 1,
      strategic_goal_id: 1,
      month: '2026-06',
      objectives: [],
      weekly_tasks: [{ done: true }, { done: false }, { status: 'done' }, { status: 'todo' }],
      completion_pct: '0',
      created_at: new Date(),
      updated_at: new Date(),
      ...over,
    };
  }

  it('recomputes completion_pct from weekly_tasks and persists', async () => {
    let stored = plan();
    const repo: IMonthlyPlanRepo = {
      list: jest.fn(async () => Ok([stored])),
      getByMonth: jest.fn(async () => Ok([stored])),
      getById: jest.fn(async () => Ok(stored)),
      create: jest.fn(async () => Ok(stored)),
      update: jest.fn(async () => Ok(stored)),
      updateCompletion: jest.fn(async (_id: number, pct: number) => {
        stored = plan({ completion_pct: String(pct) });
        return Ok(undefined);
      }),
    };
    const svc = new MonthlyPlanService(repo);
    const r = await svc.completePlan(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // 2 of 4 done = 50%
      expect(Number(r.data.completion_pct)).toBe(50);
    }
    expect(repo.updateCompletion).toHaveBeenCalledWith(1, 50);
  });

  it('errors when plan not found', async () => {
    const repo: IMonthlyPlanRepo = {
      list: jest.fn(async () => Ok([])),
      getByMonth: jest.fn(async () => Ok([])),
      getById: jest.fn(async () => Ok(null)),
      create: jest.fn(async () => Ok(plan())),
      update: jest.fn(async () => Ok(plan())),
      updateCompletion: jest.fn(async () => Ok(undefined)),
    };
    const svc = new MonthlyPlanService(repo);
    const r = await svc.completePlan(999);
    expect(r.ok).toBe(false);
  });
});
