/**
 * test/org-structure/org-mutations.repo.assign-dual-write.spec.ts
 *
 * G2 (ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06, finding C9): assignUser() (backing the
 * reachable PATCH /org-structure/users/:userId/node endpoint) previously wrote ONLY
 * `employee_org_departments` — but FORMULA-A salary/card-gate logic (card.repository.ts) reads
 * `employee_cards` exclusively, so a reachable-UI assignment was invisible downstream. Fixed by
 * dual-writing `employee_cards` (resolving employees.id from the userId via the same
 * bidirectional user<->employee bridge already used in razryad-history.repository.ts).
 *
 * `runQuery` is mocked as a dispatch table keyed by distinguishing SQL substrings (not a blind
 * sequential queue) — the method makes many runQuery calls and several are conditionally skipped
 * depending on node_type/stakeFraction, so substring-routing is far less brittle than ordering.
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
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ id: 501, node_type: 'department', head_user_id: null }]),
        }),
      }),
    }),
  },
  orgDepartments: {}, employeeOrgDepartments: {},
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
  eq: jest.fn(), and: jest.fn(),
}));

import { OrgMutationsRepo } from '../../src/modules/org-structure/org-structure/org-mutations.repo';

describe('OrgMutationsRepo.assignUser() — G2 dual-write to employee_cards', () => {
  let repo: OrgMutationsRepo;

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = new OrgMutationsRepo();

    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('SELECT id, stake_fraction FROM employee_org_departments')) {
        return { rows: [] }; // no existing (user, node) link — non-dup branch
      }
      if (text.includes('FROM employee_org_departments') && text.includes('is_primary = true')) {
        return { rows: [{ cnt: 0 }] }; // no existing primary — new link becomes primary
      }
      if (text.includes('INSERT INTO employee_org_departments')) {
        return { rows: [{ id: 9001 }] };
      }
      if (text.includes('SELECT e.id FROM employees e')) {
        return { rows: [{ id: 777 }] }; // resolved employees.id for the assigning userId
      }
      if (text.includes('FROM employee_cards') && text.includes('is_primary = true')) {
        return { rows: [{ cnt: 0 }] }; // employee has no existing primary card
      }
      if (text.includes('INSERT INTO employee_cards')) {
        return { rows: [] };
      }
      if (text.includes('UPDATE users SET department_id')) {
        return { rows: [] };
      }
      throw new Error(`Unexpected runQuery call in test: ${text}`);
    });
  });

  it('dual-writes employee_cards(employee_id, card_id) alongside employee_org_departments', async () => {
    const result = await repo.assignUser(42, 501, null, false);

    expect(result.assigned).toBe(true);

    const insertCalls = mockRunQuery.mock.calls.map((c) => sqlText(c[0]));
    const eodInsert = insertCalls.find((t) => t.includes('INSERT INTO employee_org_departments'));
    const cardsInsert = insertCalls.find((t) => t.includes('INSERT INTO employee_cards'));

    expect(eodInsert).toBeDefined();
    expect(cardsInsert).toBeDefined();
    // card_id = nodeId (501) and employee_id = the RESOLVED employees.id (777, not the raw userId 42)
    // — proves the dual-write used the employee<->user bridge, not a raw copy of userId.
    expect(cardsInsert).toContain('777');
    expect(cardsInsert).toContain('501');
    expect(cardsInsert).not.toContain(' 42 ');
  });

  it('skips the employee_cards mirror gracefully when the userId has no linked employees row', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('SELECT id, stake_fraction FROM employee_org_departments')) return { rows: [] };
      if (text.includes('FROM employee_org_departments') && text.includes('is_primary = true')) return { rows: [{ cnt: 0 }] };
      if (text.includes('INSERT INTO employee_org_departments')) return { rows: [{ id: 9002 }] };
      if (text.includes('SELECT e.id FROM employees e')) return { rows: [] }; // no linked employee (system/service account)
      if (text.includes('UPDATE users SET department_id')) return { rows: [] };
      throw new Error(`Unexpected runQuery call in test: ${text}`);
    });

    const result = await repo.assignUser(999, 501, null, false);

    expect(result.assigned).toBe(true); // employee_org_departments write still succeeds
    const calls = mockRunQuery.mock.calls.map((c) => sqlText(c[0]));
    expect(calls.some((t) => t.includes('INSERT INTO employee_cards'))).toBe(false);
  });
});
