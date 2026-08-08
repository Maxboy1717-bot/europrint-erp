/**
 * P51 — manager_id derivation (vertical Vysotskiy-7 chain).
 *
 * Proves the derivation contract WITHOUT a live DB by mocking @shared/db's
 * runQuery. The recursive CTE itself runs in Postgres; here we assert the repo
 * correctly interprets the row Postgres would return for three scenarios:
 *   1. 3-level tree, middle head NULL → child derives the GRANDPARENT head.
 *   2. no non-null ancestor anywhere → managerUserId = null (NOT fabricated).
 *   3. backfill data-gate + idempotency (dry-run previews, never writes).
 */

import { sql } from 'drizzle-orm';

// runQuery is the single seam every raw-SQL path in these repos goes through.
const runQuery = jest.fn();
jest.mock('../src/shared/db', () => {
  // Minimal Drizzle column stubs — the repos build a `sql` template referencing
  // appUsers.first_name/last_name at import time, so these must be present.
  const col = (name: string) => ({ name });
  return {
    db: {},
    runQuery: (...args: unknown[]) => runQuery(...args),
    appUsers: { id: col('id'), first_name: col('first_name'), last_name: col('last_name'), is_active: col('is_active'), phone: col('phone') },
    orgDepartments: {
      id: col('id'), name: col('name'), name_ru: col('name_ru'), description: col('description'),
      description_ru: col('description_ru'), color: col('color'), tskp: col('tskp'), tskp_ru: col('tskp_ru'),
      parent_id: col('parent_id'), level: col('level'), node_type: col('node_type'), is_active: col('is_active'),
      sort_order: col('sort_order'), head_user_id: col('head_user_id'),
    },
    employeeOrgDepartments: { user_id: col('user_id'), org_department_id: col('org_department_id'), is_primary: col('is_primary') },
  };
});

import { OrgQueriesRepo } from '../src/modules/org-structure/org-structure/org-queries.repo';
import { OrgMutationsRepo } from '../src/modules/org-structure/org-structure/org-mutations.repo';

// The ancestor CTE returns the nearest NON-NULL head, ORDER BY depth LIMIT 1.
// We model the DB by precomputing what that single row is for a given tree.
type Node = { id: number; parentId: number | null; headUserId: number | null; name: string };

function nearestAncestorRow(tree: Node[], startId: number): Record<string, unknown> | undefined {
  const byId = new Map(tree.map(n => [n.id, n]));
  let cursor = byId.get(startId);
  let depth = 1;
  // The repo's SQL excludes the start node itself (a.id <> nodeId) and only
  // returns nodes with a non-null head — so begin the climb at the parent.
  cursor = cursor && cursor.parentId !== null ? byId.get(cursor.parentId) : undefined;
  depth = 2;
  while (cursor && depth < 10) {
    if (cursor.headUserId !== null) {
      return {
        managerUserId: cursor.headUserId,
        resolvedAtNodeId: cursor.id,
        resolvedAtNodeName: cursor.name,
        depth,
        managerName: `User${cursor.headUserId}`,
      };
    }
    cursor = cursor.parentId !== null ? byId.get(cursor.parentId) : undefined;
    depth += 1;
  }
  return undefined;
}

describe('P51 OrgQueriesRepo.deriveManagerForNode', () => {
  let repo: OrgQueriesRepo;
  beforeEach(() => { repo = new OrgQueriesRepo(); runQuery.mockReset(); });

  it('3-level tree, middle head NULL → child derives the GRANDPARENT head', async () => {
    // L0 root (head=42)  →  L1 mid (head=NULL)  →  L2 leaf
    const tree: Node[] = [
      { id: 1, parentId: null, headUserId: 42, name: 'Owner' },
      { id: 2, parentId: 1, headUserId: null, name: 'Mid' },
      { id: 3, parentId: 2, headUserId: null, name: 'Leaf' },
    ];
    const row = nearestAncestorRow(tree, 3);
    runQuery.mockResolvedValueOnce({ rows: row ? [row] : [] });

    const r = await repo.deriveManagerForNode(3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Skips the NULL middle head, resolves to grandparent (node 1, user 42).
    expect(r.data.managerUserId).toBe(42);
    expect(r.data.resolvedAtNodeId).toBe(1);
    expect(r.data.depth).toBe(3);
  });

  it('no non-null ancestor anywhere → managerUserId = null (not fabricated)', async () => {
    const tree: Node[] = [
      { id: 1, parentId: null, headUserId: null, name: 'Owner' },
      { id: 2, parentId: 1, headUserId: null, name: 'Mid' },
    ];
    const row = nearestAncestorRow(tree, 2); // undefined
    runQuery.mockResolvedValueOnce({ rows: row ? [row] : [] });

    const r = await repo.deriveManagerForNode(2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.managerUserId).toBeNull();
    expect(r.data.resolvedAtNodeId).toBeNull();
    expect(r.data.depth).toBe(0);
  });

  it('root node (no parent) → null manager', async () => {
    runQuery.mockResolvedValueOnce({ rows: [] });
    const r = await repo.deriveManagerForNode(1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.managerUserId).toBeNull();
  });

  it('direct parent has a head → derives it at depth 2', async () => {
    const tree: Node[] = [
      { id: 1, parentId: null, headUserId: 7, name: 'Owner' },
      { id: 2, parentId: 1, headUserId: null, name: 'Child' },
    ];
    const row = nearestAncestorRow(tree, 2);
    runQuery.mockResolvedValueOnce({ rows: row ? [row] : [] });
    const r = await repo.deriveManagerForNode(2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.managerUserId).toBe(7);
    expect(r.data.depth).toBe(2);
  });
});

describe('P51 OrgMutationsRepo.backfillManagerIds — gates + idempotency', () => {
  let repo: OrgMutationsRepo;
  beforeEach(() => { repo = new OrgMutationsRepo(); runQuery.mockReset(); });

  it('DATA gate CLOSED (nodes with NULL head) → no write, dataGateOpen=false', async () => {
    runQuery.mockResolvedValueOnce({ rows: [{ null_head_count: 124 }] }); // gate check
    const r = await repo.backfillManagerIds(false);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.dataGateOpen).toBe(false);
    expect(r.data.nullHeadCount).toBe(124);
    expect(r.data.updatedFunctions).toBe(0);
    expect(r.data.updatedEmployees).toBe(0);
    // Only the gate query ran — NO update statements were issued.
    expect(runQuery).toHaveBeenCalledTimes(1);
  });

  it('gate OPEN + dryRun=true → previews counts, writes nothing', async () => {
    runQuery
      .mockResolvedValueOnce({ rows: [{ null_head_count: 0 }] }) // gate open
      .mockResolvedValueOnce({ rows: [{ cnt: 5 }] })             // fn preview
      .mockResolvedValueOnce({ rows: [{ cnt: 9 }] });            // emp preview
    const r = await repo.backfillManagerIds(true);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.dataGateOpen).toBe(true);
    expect(r.data.updatedFunctions).toBe(5);
    expect(r.data.updatedEmployees).toBe(9);
    expect(r.data.message).toContain('DRY RUN');
    // gate + 2 previews = 3 reads, no UPDATE.
    expect(runQuery).toHaveBeenCalledTimes(3);
  });

  it('gate OPEN + dryRun=false → applies, returns updated counts', async () => {
    runQuery
      .mockResolvedValueOnce({ rows: [{ null_head_count: 0 }] })   // gate open
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })     // fn UPDATE RETURNING
      .mockResolvedValueOnce({ rows: [{ id: 10 }] });             // emp UPDATE RETURNING
    const r = await repo.backfillManagerIds(false);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.dataGateOpen).toBe(true);
    expect(r.data.updatedFunctions).toBe(2);
    expect(r.data.updatedEmployees).toBe(1);
  });

  it('idempotent second apply → 0 rows changed (guard manager_id IS NULL/0)', async () => {
    runQuery
      .mockResolvedValueOnce({ rows: [{ null_head_count: 0 }] }) // gate open
      .mockResolvedValueOnce({ rows: [] })                       // fn UPDATE: nothing left
      .mockResolvedValueOnce({ rows: [] });                      // emp UPDATE: nothing left
    const r = await repo.backfillManagerIds(false);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.updatedFunctions).toBe(0);
    expect(r.data.updatedEmployees).toBe(0);
  });
});

// Silence unused-import lint when sql is only referenced for type parity.
void sql;
