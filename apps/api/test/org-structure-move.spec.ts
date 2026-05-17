/**
 * org-structure-move.spec.ts — Phase 6 T6.3 (defensive cycle check)
 *
 * Covers the inline ancestor-walk in OrgStructureService.move() that prevents
 * the two trivial cycles until the Phase 1 T1.3 CycleDetectorService lands:
 *   (a) self-cycle: parent === id
 *   (b) ancestor-cycle: parent is one of `id`'s descendants
 *
 * NOTE: When Phase 1 T1.3 ships, swap the inline check for the dedicated
 * service and keep these tests pointed at the new collaborator.
 */

import { OrgStructureService } from '../src/modules/org-structure/org-structure.service';
import { Ok } from '../src/common/result';

type Row = Record<string, unknown>;

interface FakeRepo {
  getHierarchyNodes: jest.Mock;
  getParentLevel: jest.Mock;
  move: jest.Mock;
}

function makeRepo(rows: Row[]): FakeRepo {
  return {
    getHierarchyNodes: jest.fn().mockResolvedValue(Ok(rows)),
    getParentLevel:    jest.fn().mockResolvedValue(Ok(1)),
    move:              jest.fn().mockResolvedValue(Ok({ id: 0, parent_id: null })),
  };
}

function svc(repo: FakeRepo): OrgStructureService {
  // Test double: cast via `as never` keeps tsc happy without `as unknown` stubs.
  // OrgStructureService.move() only touches the three repo methods mocked here.
  return new OrgStructureService(repo as never);
}

describe('OrgStructureService.move — defensive cycle check', () => {
  it('rejects self-parent (id === newParentId)', async () => {
    const repo = makeRepo([
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
    ]);
    const result = await svc(repo).move(2, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/self-cycle|o'zini/i);
    }
    expect(repo.move).not.toHaveBeenCalled();
  });

  it('rejects ancestor-cycle (moving parent under its own descendant)', async () => {
    // Tree:
    //   1 (root)
    //   └ 2
    //     └ 3
    //       └ 4
    // Moving 2 under 4 would create 2 → 4 → 3 → 2 cycle.
    const repo = makeRepo([
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
      { id: 3, parentId: 2 },
      { id: 4, parentId: 3 },
    ]);
    const result = await svc(repo).move(2, 4);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/tsiklik|cycle/i);
    }
    expect(repo.move).not.toHaveBeenCalled();
  });

  it('allows valid move (sibling reparent)', async () => {
    // Tree: 1 → {2, 3}.  Move 3 under 2 — no cycle.
    const repo = makeRepo([
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
      { id: 3, parentId: 1 },
    ]);
    const result = await svc(repo).move(3, 2);
    expect(result.ok).toBe(true);
    expect(repo.move).toHaveBeenCalledWith(3, 2, 1);
  });

  it('allows promoting a node to root (newParentId = null)', async () => {
    const repo = makeRepo([
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
    ]);
    const result = await svc(repo).move(2, null);
    expect(result.ok).toBe(true);
    expect(repo.getHierarchyNodes).not.toHaveBeenCalled(); // skipped when no parent
    expect(repo.move).toHaveBeenCalledWith(2, null, 0);
  });

  it('rejects deep ancestor-cycle (3+ levels) and never touches DB', async () => {
    const rows: Row[] = [{ id: 1, parentId: null }];
    for (let i = 2; i <= 10; i += 1) rows.push({ id: i, parentId: i - 1 });
    const repo = makeRepo(rows);
    // Move node 2 under node 10 (which is its descendant).
    const result = await svc(repo).move(2, 10);
    expect(result.ok).toBe(false);
    expect(repo.move).not.toHaveBeenCalled();
  });

  it('tolerates corrupt hierarchy data (existing cycle in DB) without infinite loop', async () => {
    // Pathological: 1 ↔ 2 already cyclic in DB.
    const repo = makeRepo([
      { id: 1, parentId: 2 },
      { id: 2, parentId: 1 },
    ]);
    const result = await svc(repo).move(3, 1);
    // Bug-tolerant: should not hang. Either succeeds or returns Result-err,
    // but must complete.
    expect(typeof result.ok).toBe('boolean');
  });
});
