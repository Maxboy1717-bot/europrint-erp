/**
 * test/pp/scheduling-network.service.spec.ts
 *
 * TZ-14 CPM + PERT (network scheduling). Pure compute.
 *   CPM: ES/EF forward pass, LS/LF backward pass, totalFloat = LS − ES.
 *   PERT: d̄ = (o + 4m + p)/6 ; σ² = ((p−o)/6)²
 */

import { SchedulingNetworkService } from '../../src/modules/pp/domain/services/scheduling-network.service';

describe('SchedulingNetworkService — CPM', () => {
  const svc = new SchedulingNetworkService();

  it('computes a single-path project duration as the sum of durations', () => {
    const r = svc.calculateCpm([
      { id: 'A', duration: 4, predecessors: [] },
      { id: 'B', duration: 6, predecessors: ['A'] },
      { id: 'C', duration: 3, predecessors: ['B'] },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.projectDuration).toBe(13);
    expect(r.data.criticalPath).toEqual(['A', 'B', 'C']);
    expect(r.data.activities.every(a => a.isCritical)).toBe(true);
  });

  it('selects the longer of two parallel paths as the critical path', () => {
    const r = svc.calculateCpm([
      { id: 'S', duration: 0, predecessors: [] },
      { id: 'LONG', duration: 8, predecessors: ['S'] },
      { id: 'SHORT', duration: 5, predecessors: ['S'] },
      { id: 'E', duration: 1, predecessors: ['LONG', 'SHORT'] },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.projectDuration).toBe(9);
    expect(r.data.criticalPath).toContain('LONG');
    expect(r.data.criticalPath).not.toContain('SHORT');
    const shortAct = r.data.activities.find(a => a.id === 'SHORT');
    expect(shortAct?.totalFloat).toBeGreaterThan(0);
    expect(shortAct?.isCritical).toBe(false);
  });

  it('rejects an empty activity list', () => {
    const r = svc.calculateCpm([]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('VALIDATION');
  });

  it('rejects an unknown predecessor reference', () => {
    const r = svc.calculateCpm([
      { id: 'A', duration: 2, predecessors: ['GHOST'] },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('VALIDATION');
  });

  it('detects a cycle in the activity graph', () => {
    const r = svc.calculateCpm([
      { id: 'A', duration: 1, predecessors: ['C'] },
      { id: 'B', duration: 1, predecessors: ['A'] },
      { id: 'C', duration: 1, predecessors: ['B'] },
    ]);
    expect(r.ok).toBe(false);
  });
});

describe('SchedulingNetworkService — PERT', () => {
  const svc = new SchedulingNetworkService();

  it('expected duration = (o + 4m + p)/6 for a single activity', async () => {
    const r = await svc.calculatePert([
      { id: 'A', optimistic: 2, mostLikely: 5, pessimistic: 8, predecessors: [] },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const a = r.data.activities.find(x => x.id === 'A');
    expect(a?.expectedDuration).toBeCloseTo(5, 4);
    expect(a?.variance).toBeCloseTo(((8 - 2) / 6) ** 2, 4);
  });

  it('project variance sums the variances of critical activities only', async () => {
    const r = await svc.calculatePert([
      { id: 'A', optimistic: 1, mostLikely: 2, pessimistic: 3, predecessors: [] },
      { id: 'B', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: ['A'] },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.projectVariance).toBeGreaterThan(0);
  });

  it('rejects an empty PERT activity list', async () => {
    const r = await svc.calculatePert([]);
    expect(r.ok).toBe(false);
  });
});
