/**
 * test/org-structure/card.repository.resolve-gate-lms.spec.ts
 *
 * T7-10-follow-up: `CardRepository.resolveGate()` previously joined only RBAC-tier + salary
 * eligibility from `org_departments`/`employee_cards`, never consulting the EP-ORG-027
 * mandatory-darslik gate (`LmsCardGateService.isCardTrainingComplete`) that payroll already
 * uses (payroll.service.ts:454-455). That meant the LMS oylik-gate NEVER reached the FE
 * card-gate banner (GET /api/org-structure/cards/gate/by-user/:id).
 *
 * This spec proves resolveGate() now:
 *   A. Calls the SAME LmsCardGateService.isCardTrainingComplete (reused, not reimplemented)
 *      with the resolved (cardId, employeeId) when the user has both a card and a linked employee.
 *   B. Surfaces `lmsGateBlocked = !allComplete` when the gate resolves.
 *   C. FAIL-CLOSED (mirrors payroll.service.ts T7-10): a gate read error -> lmsGateBlocked=true.
 *   D. Skips the LMS call entirely (lmsGateBlocked=false, no fabrication) for a card-less user
 *      or a user with no linked employees row — nothing to gate.
 *   E. Returns Ok(null) untouched (no LMS call) when the user itself does not exist.
 *
 * `runQuery` is mocked as a dispatch table keyed by SQL substring, mirroring the established
 * pattern in org-mutations.repo.assign-dual-write.spec.ts.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
  db: { transaction: jest.fn() },
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { CardRepository } from '../../src/modules/org-structure/card.repository';
import type { LmsCardGateService } from '../../src/modules/lms/application/services/lms-card-gate.service';
import { Ok, Err, AppErr, isOk } from '../../src/common/result';

function makeLmsGateStub(isCardTrainingComplete: jest.Mock = jest.fn()): LmsCardGateService {
  return { isCardTrainingComplete } as unknown as LmsCardGateService;
}

/** A resolveGate() SELECT row shaped exactly like the repo's query output. */
function gateRow(over: Record<string, unknown> = {}) {
  return {
    user_id: 34,
    username: 'sanjar.o',
    role: 'operator',
    card_id: 22,
    card_name: 'Operator',
    rbac_tier: 'operator',
    has_card: true,
    salary_eligible: true,
    employee_id: 777,
    ...over,
  };
}

describe('CardRepository.resolveGate() — EP-ORG-027 LMS darslik-gate reuse (T7-10-follow-up)', () => {
  beforeEach(() => {
    mockRunQuery.mockReset();
  });

  it('A+B: carded user with a linked employee -> calls the SAME LmsCardGateService, surfaces lmsGateBlocked=true when incomplete', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('FROM users u')) return { rows: [gateRow()] };
      throw new Error(`Unexpected runQuery call: ${text}`);
    });
    const isCardTrainingComplete = jest.fn().mockResolvedValue(
      Ok({ cardId: 22, employeeId: 777, allComplete: false, mandatoryCourseCount: 1, incompleteCourseIds: [9], courses: [], reasons: ["Kurs #9: tugamagan"] }),
    );
    const repo = new CardRepository(makeLmsGateStub(isCardTrainingComplete));

    const r = await repo.resolveGate(34);

    expect(isCardTrainingComplete).toHaveBeenCalledWith(22, 777); // reused verbatim, not reimplemented
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.data?.lmsGateBlocked).toBe(true);
      expect(r.data?.has_card).toBe(true); // pre-existing fields untouched
    }
  });

  it('B: allComplete=true -> lmsGateBlocked=false (darslik-gate open)', async () => {
    mockRunQuery.mockImplementation(async () => ({ rows: [gateRow()] }));
    const isCardTrainingComplete = jest.fn().mockResolvedValue(
      Ok({ cardId: 22, employeeId: 777, allComplete: true, mandatoryCourseCount: 0, incompleteCourseIds: [], courses: [], reasons: [] }),
    );
    const repo = new CardRepository(makeLmsGateStub(isCardTrainingComplete));

    const r = await repo.resolveGate(34);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data?.lmsGateBlocked).toBe(false);
  });

  it('C: FAIL-CLOSED — a gate read error surfaces as lmsGateBlocked=true (mirrors payroll T7-10)', async () => {
    mockRunQuery.mockImplementation(async () => ({ rows: [gateRow()] }));
    const isCardTrainingComplete = jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'progress o\'qib bo\'lmadi')));
    const repo = new CardRepository(makeLmsGateStub(isCardTrainingComplete));

    const r = await repo.resolveGate(34);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data?.lmsGateBlocked).toBe(true);
  });

  it('D1: card-less user -> lmsGateBlocked=false WITHOUT calling the LMS gate (nothing to gate)', async () => {
    mockRunQuery.mockImplementation(async () => ({
      rows: [gateRow({ card_id: null, has_card: false, rbac_tier: null, salary_eligible: false, employee_id: null })],
    }));
    const isCardTrainingComplete = jest.fn();
    const repo = new CardRepository(makeLmsGateStub(isCardTrainingComplete));

    const r = await repo.resolveGate(1);
    expect(isCardTrainingComplete).not.toHaveBeenCalled();
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data?.lmsGateBlocked).toBe(false);
  });

  it('D2: carded user with NO linked employees row -> lmsGateBlocked=false WITHOUT calling the LMS gate', async () => {
    mockRunQuery.mockImplementation(async () => ({
      rows: [gateRow({ employee_id: null })], // has_card=true but no employees bridge row
    }));
    const isCardTrainingComplete = jest.fn();
    const repo = new CardRepository(makeLmsGateStub(isCardTrainingComplete));

    const r = await repo.resolveGate(50);
    expect(isCardTrainingComplete).not.toHaveBeenCalled();
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data?.lmsGateBlocked).toBe(false);
  });

  it('E: absent user -> Ok(null), the LMS gate is never consulted', async () => {
    mockRunQuery.mockImplementation(async () => ({ rows: [] }));
    const isCardTrainingComplete = jest.fn();
    const repo = new CardRepository(makeLmsGateStub(isCardTrainingComplete));

    const r = await repo.resolveGate(999);
    expect(isCardTrainingComplete).not.toHaveBeenCalled();
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data).toBeNull();
  });
});
