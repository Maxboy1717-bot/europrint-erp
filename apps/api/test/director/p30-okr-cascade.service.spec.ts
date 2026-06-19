/**
 * test/director/p30-okr-cascade.service.spec.ts
 * Unit tests for OKR cascade (P30 EP-DIR-015/016). IOkrRepo mocked.
 * - createObjective forwards parent_goal_id + owner_card_id
 * - listObjectives forwards parentGoalId filter
 * - a flat objective list builds the correct parent/child tree
 */

import { OkrService } from '../../src/modules/director/application/okr.service';
import type { IOkrRepo } from '../../src/modules/director/domain/repositories/i-okr.repo';
import { Ok } from '../../src/common/result';

type Row = Record<string, unknown>;

function makeRepo(rows: Row[] = []): IOkrRepo {
  return {
    listObjectives: jest.fn(async (
      _type: string | null,
      _year: number | null,
      _quarter: string | null,
      _status: string | null,
      parentGoalId?: number | null,
    ) =>
      Ok(
        parentGoalId == null
          ? rows
          : rows.filter((r) => r.parent_goal_id === parentGoalId),
      ),
    ),
    getObjective: jest.fn(async () => Ok([])),
    createObjective: jest.fn(async (
      title, type, year, quarter, description, ownerId, parentGoalId, ownerCardId,
    ) =>
      Ok({
        id: 99, title, type, year, quarter, description, owner_id: ownerId,
        parent_goal_id: parentGoalId ?? null, owner_card_id: ownerCardId ?? null,
      }),
    ),
    updateObjective: jest.fn(async () => Ok({})),
    deleteObjective: jest.fn(async () => undefined),
    listKeyResults: jest.fn(async () => Ok([])),
    createKeyResult: jest.fn(async () => Ok({})),
    updateKeyResult: jest.fn(async () => Ok({})),
    deleteKeyResult: jest.fn(async () => undefined),
    getDashboardObjectives: jest.fn(async () => Ok([])),
    getDashboardKeyResults: jest.fn(async () => Ok({ avg_progress: 0, total: 0 })),
  };
}

/** Mirrors the FE cascade build: roots (no parent) → children by parent_goal_id. */
function buildTree(objectives: Row[]) {
  const list = Array.isArray(objectives) ? objectives : [];
  const roots = list.filter((o) => !o.parent_goal_id);
  const childrenOf = (parentId: number) =>
    list.filter((o) => o.parent_goal_id === parentId);
  return { roots, childrenOf };
}

describe('P30 OkrService — cascade params', () => {
  it('createObjective forwards parent_goal_id + owner_card_id to repo', async () => {
    const repo = makeRepo();
    const svc = new OkrService(repo);
    const r = await svc.createObjective(
      'Bolalar maqsad', 'department', 2026, 'Q2', null, 7, 1, 42,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.parent_goal_id).toBe(1);
      expect(r.data.owner_card_id).toBe(42);
    }
    expect(repo.createObjective).toHaveBeenCalledWith(
      'Bolalar maqsad', 'department', 2026, 'Q2', null, 7, 1, 42,
    );
  });

  it('listObjectives forwards the parentGoalId filter', async () => {
    const rows: Row[] = [
      { id: 1, title: 'Company', parent_goal_id: null },
      { id: 2, title: 'Dept A', parent_goal_id: 1 },
      { id: 3, title: 'Dept B', parent_goal_id: 1 },
    ];
    const repo = makeRepo(rows);
    const svc = new OkrService(repo);
    const r = await svc.listObjectives(null, null, null, null, 1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Row[];
      expect(data.length).toBe(2);
      expect(data.every((o) => o.parent_goal_id === 1)).toBe(true);
    }
  });
});

describe('P30 OKR cascade — tree building', () => {
  it('builds a correct company → department → card 3-level tree', () => {
    const objectives: Row[] = [
      { id: 1, title: 'Company goal', type: 'company', parent_goal_id: null },
      { id: 2, title: 'Dept goal', type: 'department', parent_goal_id: 1 },
      { id: 3, title: 'Card goal', type: 'card', parent_goal_id: 2 },
      { id: 4, title: 'Another company', type: 'company', parent_goal_id: null },
    ];
    const { roots, childrenOf } = buildTree(objectives);

    // two roots (company-level, no parent)
    expect(roots.map((r) => r.id).sort()).toEqual([1, 4]);

    // level 2: department under company 1
    const deptChildren = childrenOf(1);
    expect(deptChildren.length).toBe(1);
    expect(deptChildren[0].id).toBe(2);

    // level 3: card under department 2
    const cardChildren = childrenOf(2);
    expect(cardChildren.length).toBe(1);
    expect(cardChildren[0].id).toBe(3);

    // leaf has no children
    expect(childrenOf(3).length).toBe(0);
  });
});
