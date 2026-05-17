/**
 * orgChartUtils.test.ts — Phase 6 T6.1 / T6.4
 *
 * Pure-function tests for the OrgChart search/index helpers. Frontend mirror
 * of the backend O(n) tree-build perf test.
 */

import { describe, it, expect } from 'vitest';
import { buildIndex, collectAllIds, highlightTokens, searchTree } from '../orgChartUtils';
import type { OrgChartNode } from '../orgChartTypes';

function leaf(id: string, name: string): OrgChartNode {
  return { id, name };
}
function branch(id: string, name: string, children: OrgChartNode[]): OrgChartNode {
  return { id, name, children };
}

describe('buildIndex', () => {
  it('returns empty index for empty tree', () => {
    const idx = buildIndex([]);
    expect(idx.nodes).toEqual([]);
    expect(idx.parentOf.size).toBe(0);
    expect(idx.lowerName.size).toBe(0);
  });

  it('records parent relationship for every node (DFS order)', () => {
    const tree: OrgChartNode[] = [
      branch('1', 'Root', [
        branch('2', 'A', [leaf('4', 'Alice')]),
        leaf('3', 'B'),
      ]),
    ];
    const idx = buildIndex(tree);
    expect(idx.nodes.map(n => n.id)).toEqual(['1', '2', '4', '3']);
    expect(idx.parentOf.get('1')).toBeNull();
    expect(idx.parentOf.get('2')).toBe('1');
    expect(idx.parentOf.get('3')).toBe('1');
    expect(idx.parentOf.get('4')).toBe('2');
  });

  it('lowercases names for case-insensitive search', () => {
    const idx = buildIndex([leaf('1', 'BoBuRshOh')]);
    expect(idx.lowerName.get('1')).toBe('boburshoh');
  });

  it('is O(n): 5000 nodes built well under 250ms', () => {
    const N = 5000;
    // 1 root + many siblings — flat fan-out is worst case for DFS push/pop.
    const tree: OrgChartNode[] = [{
      id: '0', name: 'root',
      children: Array.from({ length: N - 1 }, (_, i) => leaf(String(i + 1), `n${i + 1}`)),
    }];
    const t0 = Date.now();
    const idx = buildIndex(tree);
    const elapsed = Date.now() - t0;
    expect(idx.nodes).toHaveLength(N);
    expect(elapsed).toBeLessThan(250);
  });
});

describe('searchTree', () => {
  it('returns empty sets for empty query', () => {
    const idx = buildIndex([leaf('1', 'Anything')]);
    const r = searchTree(idx, '');
    expect(r.matched.size).toBe(0);
    expect(r.expanded.size).toBe(0);
  });

  it('matches by case-insensitive substring', () => {
    const tree: OrgChartNode[] = [
      branch('1', 'Engineering', [
        leaf('2', 'Mobile team'),
        leaf('3', 'Backend team'),
      ]),
    ];
    const r = searchTree(buildIndex(tree), 'TEAM');
    expect(r.matched.has('2')).toBe(true);
    expect(r.matched.has('3')).toBe(true);
    expect(r.matched.has('1')).toBe(false);
  });

  it('expands every ancestor of every match', () => {
    const tree: OrgChartNode[] = [
      branch('1', 'Co', [
        branch('2', 'Eng', [
          branch('3', 'Mobile', [leaf('4', 'iOS Group')]),
        ]),
      ]),
    ];
    const r = searchTree(buildIndex(tree), 'ios');
    expect(r.matched.has('4')).toBe(true);
    // All three ancestors must be in the expanded set.
    expect(r.expanded.has('1')).toBe(true);
    expect(r.expanded.has('2')).toBe(true);
    expect(r.expanded.has('3')).toBe(true);
  });

  it('survives malformed (cyclic) parent map without infinite loop', () => {
    const idx = buildIndex([leaf('1', 'x')]);
    // Corrupt the parent map deliberately.
    idx.parentOf.set('1', '1');
    const r = searchTree(idx, 'x');
    expect(r.matched.has('1')).toBe(true);
  });
});

describe('highlightTokens', () => {
  it('returns the whole text unmatched for empty query', () => {
    expect(highlightTokens('Acme', '')).toEqual([{ value: 'Acme', match: false }]);
  });

  it('splits around case-insensitive matches', () => {
    const out = highlightTokens('Engineering Mobile Engineering', 'eng');
    // 3 segments around "Eng" plus the matches themselves.
    const matches = out.filter(t => t.match).map(t => t.value.toLowerCase());
    expect(matches).toEqual(['eng', 'eng']);
    // Round-trip equality
    expect(out.map(t => t.value).join('')).toBe('Engineering Mobile Engineering');
  });

  it('handles empty text gracefully', () => {
    expect(highlightTokens('', 'foo')).toEqual([{ value: '', match: false }]);
  });
});

describe('collectAllIds', () => {
  it('returns every node id', () => {
    const idx = buildIndex([branch('1', 'a', [leaf('2', 'b'), leaf('3', 'c')])]);
    const all = collectAllIds(idx);
    expect(all.size).toBe(3);
    expect(all.has('1')).toBe(true);
    expect(all.has('2')).toBe(true);
    expect(all.has('3')).toBe(true);
  });
});
