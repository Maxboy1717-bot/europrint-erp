/**
 * test/pp/pp-shift-assign.service.spec.ts
 *
 * VISION-3340 #23 — PpAiPlanningService.runStep6ShiftAssign was a hardcoded stub
 * with no DB read/write. It now reads REAL work-center capacity + open-order
 * target and the plan date's crew (shift_assignments) via @shared/db.runQuery,
 * then persists a real pp_shift_plans row. Q-40: when capacity / crew / target is
 * absent it returns an honest `empty` result and persists NOTHING.
 *
 * Sibling style: mock @shared/db (see pp-crp.service.spec.ts) and drive the three
 * step-6 queries (capacity → crew → insert) with mockResolvedValueOnce.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { PpAiPlanningService, AiPlanStep } from '../../src/modules/pp/application/services/pp-ai-planning.service';
import { runQuery } from '@shared/db';
import type { PpMpsService } from '../../src/modules/pp/application/services/pp-mps.service';
import type { PpCrpService } from '../../src/modules/pp/application/services/pp-crp.service';
import type { PpIntelligenceService } from '../../src/modules/pp/application/services/pp-intelligence.service';
import type { ConfigService } from '@nestjs/config';

const mockRun = runQuery as jest.Mock;

// No AI key + empty steps 1/3/4 so only step 6's runQuery sequence is under test.
function build(): PpAiPlanningService {
  const config = { get: jest.fn(() => undefined) } as unknown as ConfigService;
  const mps = { getMps: jest.fn().mockResolvedValue({ ok: true, data: [] }) } as unknown as PpMpsService;
  const crp = { getCrp: jest.fn().mockResolvedValue({ ok: true, data: [] }) } as unknown as PpCrpService;
  const intelligence = {
    runMrp: jest.fn().mockResolvedValue({ ok: true, data: { netRequirements: [], plannedOrders: [], policies: [] } }),
  } as unknown as PpIntelligenceService;
  return new PpAiPlanningService(config, mps, crp, intelligence);
}

describe('PpAiPlanningService step 6 — real shift-plan persistence (VISION-3340 #23)', () => {
  beforeEach(() => mockRun.mockReset());

  it('persists a real pp_shift_plans row when capacity, crew and open-order target exist', async () => {
    // step 6 issues exactly 3 runQuery calls in order: capacity, crew, insert…returning id.
    mockRun
      .mockResolvedValueOnce({ rows: [{ work_center_id: 7, work_center_name: 'FLEKSO-1', target_quantity: 1200 }] })
      .mockResolvedValueOnce({ rows: [{ employee_id: 11, shift_type_id: 1 }, { employee_id: 12, shift_type_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 55 }] });

    const r = await build().buildSkeleton('2026-07-10');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step6 = r.data.steps.find((s) => s.step === AiPlanStep.SHIFT_ASSIGN);
    expect(step6?.status).toBe('completed');
    expect(step6?.summary).toMatchObject({
      planned: true,
      shiftPlanId: 55,
      workCenterId: 7,
      workCenterName: 'FLEKSO-1',
      shiftDate: '2026-07-10',
      targetQuantity: 1200,
      crewSize: 2,
    });
    // 3rd runQuery is the INSERT ... pp_shift_plans — persistence actually happened.
    expect(mockRun).toHaveBeenCalledTimes(3);
  });

  it('returns honest "insufficient data" and does NOT persist when no crew is assigned (Q-40)', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ work_center_id: 7, work_center_name: 'FLEKSO-1', target_quantity: 1200 }] })
      .mockResolvedValueOnce({ rows: [] }); // no crew for the date

    const r = await build().buildSkeleton('2026-07-10');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step6 = r.data.steps.find((s) => s.step === AiPlanStep.SHIFT_ASSIGN);
    expect(step6?.status).toBe('empty');
    expect(step6?.summary).toMatchObject({ planned: false, crew: 0 });
    // capacity + crew read only; NO third (insert) call.
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('does NOT persist when there is no active work center (Q-40)', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [] }) // no capacity
      .mockResolvedValueOnce({ rows: [{ employee_id: 11, shift_type_id: 1 }] });

    const r = await build().buildSkeleton('2026-07-10');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step6 = r.data.steps.find((s) => s.step === AiPlanStep.SHIFT_ASSIGN);
    expect(step6?.status).toBe('empty');
    expect(step6?.summary).toMatchObject({ planned: false, workCenters: 0 });
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('does NOT persist a fabricated plan when capacity exists but open-order target is zero (Q-40)', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ work_center_id: 7, work_center_name: 'X', target_quantity: 0 }] })
      .mockResolvedValueOnce({ rows: [{ employee_id: 11, shift_type_id: 1 }] });

    const r = await build().buildSkeleton('2026-07-10');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step6 = r.data.steps.find((s) => s.step === AiPlanStep.SHIFT_ASSIGN);
    expect(step6?.status).toBe('empty');
    expect(step6?.summary).toMatchObject({ planned: false, targetQuantity: 0 });
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('surfaces a DB failure in step 6 as a failed step (not a crash, not a silent empty)', async () => {
    mockRun.mockRejectedValueOnce(new Error('db down'));

    const r = await build().buildSkeleton('2026-07-10');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const step6 = r.data.steps.find((s) => s.step === AiPlanStep.SHIFT_ASSIGN);
    expect(step6?.status).toBe('failed');
    expect(step6?.summary).toMatchObject({ error: expect.stringContaining('db down') });
  });
});
