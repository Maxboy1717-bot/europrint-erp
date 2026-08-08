/**
 * test/org-structure/org-mutations.repo.razryad-reason.spec.ts
 *
 * VISION-3340 #24: `OrgMutationsRepo.updateFromDto()` previously called
 * `recordManualRazryadChange()` with NO caller context, so every manual razryad edit
 * landed in `razryad_history.reason` as the same hardcoded literal ("Karta to'g'ridan
 * tahrirlash..."), regardless of what the caller actually typed in the PATCH body's
 * reason/justification/comment/note/description field. Fixed by extracting the REAL
 * caller-supplied reason (via `extractCallerReason`, reusing AuditInterceptor's exported
 * REASON_KEYS — same list, no second copy) and threading it into the INSERT.
 *
 * `runQuery` is mocked as a dispatch table keyed by distinguishing SQL substrings, mirroring
 * the established pattern in org-mutations.repo.assign-dual-write.spec.ts.
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
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
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

/** Wires the dispatch table shared by both tests; only the razryad_history INSERT text differs per test. */
function installRazryadUpdateFixture(opts: { oldRazryadId: number | null; newRazryadId: number; nodeType?: string }) {
  mockRunQuery.mockImplementation(async (call: unknown) => {
    const text = sqlText(call);
    if (text.includes('SELECT razryad_level_id FROM org_departments')) {
      return { rows: [{ razryad_level_id: opts.oldRazryadId }] };
    }
    if (text.includes('FROM employee_cards') && text.includes('is_acting')) {
      return { rows: [{ employee_id: 42 }] }; // active occupant
    }
    if (text.includes('UPDATE org_departments SET')) {
      return { rows: [{ id: 501, razryad_level_id: opts.newRazryadId, node_type: opts.nodeType ?? 'position', name: 'Test Karta' }] };
    }
    if (text.includes('FROM razryad_levels')) {
      // old_level < new_level -> 'increase' (irrelevant to this spec, just needs to resolve)
      return { rows: [{ old_level: opts.oldRazryadId, new_level: opts.newRazryadId }] };
    }
    if (text.includes('INSERT INTO razryad_history')) {
      return { rows: [] };
    }
    // sync-helper's UPDATE positions/departments mirror — harmless no-op for this spec.
    return { rows: [] };
  });
}

describe('OrgMutationsRepo.updateFromDto() — VISION-3340 #24 real reason threaded into razryad_history', () => {
  let repo: OrgMutationsRepo;

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = new OrgMutationsRepo();
  });

  it('writes the caller-supplied `reason` into razryad_history.reason, not the hardcoded placeholder', async () => {
    installRazryadUpdateFixture({ oldRazryadId: 3, newRazryadId: 5 });

    const result = await repo.updateFromDto(501, {
      razryadLevelId: 5,
      reason: "Yillik attestatsiya natijasi: daraja oshirildi",
    });

    expect(result.ok).toBe(true);
    const insertCall = mockRunQuery.mock.calls.map((c) => sqlText(c[0])).find((t) => t.includes('INSERT INTO razryad_history'));
    expect(insertCall).toBeDefined();
    expect(insertCall).toContain('Yillik attestatsiya natijasi: daraja oshirildi');
    expect(insertCall).not.toContain("Karta to'g'ridan tahrirlash");
  });

  it('threads a REASON_KEYS alias other than `reason` (e.g. `comment`) into razryad_history.reason too', async () => {
    installRazryadUpdateFixture({ oldRazryadId: 2, newRazryadId: 4 });

    const result = await repo.updateFromDto(501, {
      razryadLevelId: 4,
      comment: "HR: malaka testidan o'tdi",
    });

    expect(result.ok).toBe(true);
    const insertCall = mockRunQuery.mock.calls.map((c) => sqlText(c[0])).find((t) => t.includes('INSERT INTO razryad_history'));
    expect(insertCall).toBeDefined();
    expect(insertCall).toContain("HR: malaka testidan o'tdi");
  });

  it('falls back to the historical placeholder reason when the DTO carries no REASON_KEYS value at all (direct-repo caller bypassing the controller gate)', async () => {
    installRazryadUpdateFixture({ oldRazryadId: 1, newRazryadId: 2 });

    const result = await repo.updateFromDto(501, { razryadLevelId: 2 });

    expect(result.ok).toBe(true);
    const insertCall = mockRunQuery.mock.calls.map((c) => sqlText(c[0])).find((t) => t.includes('INSERT INTO razryad_history'));
    expect(insertCall).toBeDefined();
    expect(insertCall).toContain("Karta to'g'ridan tahrirlash");
  });

  it('does not touch razryad_history at all when razryadLevelId is absent from the DTO (no razryad change)', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('UPDATE org_departments SET')) {
        return { rows: [{ id: 501, node_type: 'position', name: 'Renamed' }] };
      }
      return { rows: [] };
    });

    const result = await repo.updateFromDto(501, { name: 'Renamed' });

    expect(result.ok).toBe(true);
    const insertCall = mockRunQuery.mock.calls.map((c) => sqlText(c[0])).find((t) => t.includes('INSERT INTO razryad_history'));
    expect(insertCall).toBeUndefined();
  });
});
