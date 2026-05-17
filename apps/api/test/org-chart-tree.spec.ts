/**
 * org-chart-tree.spec.ts — Phase 6 T6.4
 *
 * Verifies the O(n) parent-child Map tree builder used by OrgChartCompatService.
 * Covers:
 *   1. Empty input → empty result
 *   2. Single root node
 *   3. Multi-level hierarchy correctly nested
 *   4. Orphan nodes (parent_id pointing to non-existent parent) retained as roots
 *   5. Performance: 5 000 nodes built in well under a second (prior O(n²)
 *      implementation would burn ~25M iterations and easily exceed it)
 *   6. Deterministic order: roots & children preserve insertion order
 */

import { buildTree } from '../src/modules/compatibility/org-chart-compat.service';

type Row = Record<string, unknown>;

function makeRow(id: number, parent_id: number | null, name?: string): Row {
  return { id, parent_id, name: name ?? `node-${id}` };
}

describe('OrgChartCompatService.buildTree — O(n) builder', () => {
  it('returns [] for empty input', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('returns [] for non-array input (defensive)', () => {
    // @ts-expect-error — intentionally testing runtime defensive guard
    expect(buildTree(null)).toEqual([]);
  });

  it('builds a single root with no children', () => {
    const tree = buildTree([makeRow(1, null)]);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(1);
    expect(tree[0].children).toEqual([]);
  });

  it('builds a multi-level hierarchy with correct nesting', () => {
    const rows: Row[] = [
      makeRow(1, null, 'CEO'),
      makeRow(2, 1, 'CTO'),
      makeRow(3, 1, 'CFO'),
      makeRow(4, 2, 'Eng Lead'),
      makeRow(5, 4, 'Eng IC'),
    ];
    const tree = buildTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(1);
    const root = tree[0] as Row;
    const rootChildren = root['children'] as Row[];
    expect(rootChildren).toHaveLength(2);
    expect(rootChildren.map(c => c['id'])).toEqual([2, 3]);
    const cto = rootChildren[0];
    const ctoChildren = cto['children'] as Row[];
    expect(ctoChildren).toHaveLength(1);
    expect(ctoChildren[0]['id']).toBe(4);
    expect((ctoChildren[0]['children'] as Row[])[0]['id']).toBe(5);
  });

  it('treats nodes whose parent is missing as roots (orphan handling)', () => {
    const rows: Row[] = [
      makeRow(1, null, 'root-a'),
      makeRow(99, 7777, 'orphan'), // parent 7777 not in set
    ];
    const tree = buildTree(rows);
    expect(tree).toHaveLength(2);
    const ids = tree.map(t => t['id']);
    expect(ids).toContain(1);
    expect(ids).toContain(99);
  });

  it('handles undefined parent_id as root', () => {
    const tree = buildTree([{ id: 1, name: 'no-parent-field' }]);
    expect(tree).toHaveLength(1);
    expect(tree[0]['id']).toBe(1);
  });

  it('preserves insertion order for siblings', () => {
    const rows: Row[] = [
      makeRow(1, null),
      makeRow(2, 1),
      makeRow(3, 1),
      makeRow(4, 1),
      makeRow(5, 1),
    ];
    const tree = buildTree(rows);
    const children = (tree[0]['children'] as Row[]).map(c => c['id']);
    expect(children).toEqual([2, 3, 4, 5]);
  });

  it('runs in O(n): 5000 nodes under 250ms', () => {
    const N = 5_000;
    const rows: Row[] = [makeRow(1, null)];
    // chain depth-1: every node parented to root → 4 999 siblings.
    for (let i = 2; i <= N; i += 1) rows.push(makeRow(i, 1));

    const start = Date.now();
    const tree = buildTree(rows);
    const elapsed = Date.now() - start;

    expect(tree).toHaveLength(1);
    expect((tree[0]['children'] as Row[])).toHaveLength(N - 1);
    // O(n²) on 5 000 = 25M ops; would not complete this fast.
    expect(elapsed).toBeLessThan(250);
  });

  it('runs in O(n) for a deep chain: 2000 levels in linear time', () => {
    const N = 2_000;
    const rows: Row[] = [makeRow(1, null)];
    for (let i = 2; i <= N; i += 1) rows.push(makeRow(i, i - 1));

    const start = Date.now();
    const tree = buildTree(rows);
    const elapsed = Date.now() - start;

    expect(tree).toHaveLength(1);
    // walk to bottom
    let cursor: Row | undefined = tree[0];
    let depth = 0;
    while (cursor) {
      const kids = cursor['children'] as Row[];
      if (!kids || kids.length === 0) break;
      cursor = kids[0];
      depth += 1;
    }
    expect(depth).toBe(N - 1);
    expect(elapsed).toBeLessThan(250);
  });
});
