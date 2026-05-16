/**
 * Smoke spec for RouteService (Rule 22: every service needs a unit test).
 *
 * Pure-computation domain service (Dijkstra + min-heap). No DB needed.
 */
import { RouteService, Graph } from '../../src/modules/logistics/domain/services/route.service';

describe('RouteService', () => {
  let svc: RouteService;

  beforeEach(() => {
    svc = new RouteService();
  });

  it('class is defined and constructible', () => {
    expect(RouteService).toBeDefined();
    expect(svc).toBeInstanceOf(RouteService);
  });

  it('dijkstra returns NOT_FOUND for an unknown source node', () => {
    const g: Graph = new Map([['A', []]]);
    const res = svc.dijkstra(g, 'X', 'A');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
  });

  it('dijkstra returns totalDist=0 for self-source equal to target', () => {
    const g: Graph = new Map([['A', [{ to: 'B', weight: 5 }]], ['B', []]]);
    const res = svc.dijkstra(g, 'A', 'A');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.totalDist).toBe(0);
      expect(res.data.path).toEqual(['A']);
    }
  });

  it('dijkstra finds the shortest path through intermediate nodes', () => {
    const g: Graph = new Map([
      ['A', [{ to: 'B', weight: 1 }, { to: 'C', weight: 4 }]],
      ['B', [{ to: 'C', weight: 2 }, { to: 'D', weight: 5 }]],
      ['C', [{ to: 'D', weight: 1 }]],
      ['D', []],
    ]);
    const res = svc.dijkstra(g, 'A', 'D');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.totalDist).toBe(4); // A→B(1)→C(2)→D(1)
      expect(res.data.path).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  it('dijkstra rejects graphs containing negative weights with VALIDATION error', () => {
    const g: Graph = new Map([
      ['A', [{ to: 'B', weight: -3 }]],
      ['B', []],
    ]);
    const res = svc.dijkstra(g, 'A', 'B');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });

  it('dijkstra reports NOT_FOUND when no path exists between source and target', () => {
    const g: Graph = new Map([['A', []], ['B', []]]);
    const res = svc.dijkstra(g, 'A', 'B');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
  });
});
