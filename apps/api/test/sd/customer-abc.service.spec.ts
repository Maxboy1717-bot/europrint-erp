/**
 * customer-abc.service.spec.ts
 *
 * Unit tests for CustomerAbcService. `computeAbc` is pure (sort + cumulative-share
 * Pareto classification) and is exercised directly with real assertions.
 * `recompute`/`preview` are thin repo-orchestration wrappers around it — repo is
 * mocked, same convention as sd-customers.service.spec.ts.
 */

import { CustomerAbcService } from '../../src/modules/sd/application/customer-abc.service';
import type {
  ISdCustomerAbcRepo,
  CustomerAnnualRevenue,
} from '../../src/modules/sd/infrastructure/repositories/i-sd-customer-abc.repo';

type RepoMock = {
  getAnnualRevenue: jest.Mock;
  persistAbc: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    getAnnualRevenue: jest.fn(),
    persistAbc: jest.fn(),
  };
}

describe('CustomerAbcService', () => {
  let repo: RepoMock;
  let svc: CustomerAbcService;

  beforeEach(() => {
    repo = makeRepo();
    svc = new CustomerAbcService(repo as unknown as ISdCustomerAbcRepo);
  });

  describe('computeAbc()', () => {
    it('classifies a Pareto-shaped revenue list into A/B/C by cumulative share', () => {
      // 800 : 150 : 50 → cumulative shares 0.80 / 0.95 / 1.00
      const rows: CustomerAnnualRevenue[] = [
        { id: 1, name: 'Big Co', annualRevenue: 800 },
        { id: 2, name: 'Mid Co', annualRevenue: 150 },
        { id: 3, name: 'Small Co', annualRevenue: 50 },
      ];

      const result = svc.computeAbc(rows);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ id: 1, abcClass: 'A', cumulativeShare: 0.8 });
      expect(result[1]).toMatchObject({ id: 2, abcClass: 'B', cumulativeShare: 0.95 });
      expect(result[2]).toMatchObject({ id: 3, abcClass: 'C', cumulativeShare: 1 });
    });

    it('sorts by revenue DESC regardless of input order', () => {
      const rows: CustomerAnnualRevenue[] = [
        { id: 1, name: 'Small Co', annualRevenue: 50 },
        { id: 2, name: 'Big Co', annualRevenue: 800 },
        { id: 3, name: 'Mid Co', annualRevenue: 150 },
      ];

      const result = svc.computeAbc(rows);

      expect(result.map((r) => r.id)).toEqual([2, 3, 1]);
    });

    it('breaks equal-revenue ties by id ASC (stable, deterministic)', () => {
      const rows: CustomerAnnualRevenue[] = [
        { id: 5, name: 'C5', annualRevenue: 100 },
        { id: 2, name: 'C2', annualRevenue: 100 },
        { id: 3, name: 'C3', annualRevenue: 100 },
      ];

      const result = svc.computeAbc(rows);

      expect(result.map((r) => r.id)).toEqual([2, 3, 5]);
    });

    it('classifies zero-revenue customers as C even though they add no cumulative share', () => {
      const rows: CustomerAnnualRevenue[] = [
        { id: 1, name: 'Big Co', annualRevenue: 1000 },
        { id: 2, name: 'Zero Co', annualRevenue: 0 },
      ];

      const result = svc.computeAbc(rows);

      const zero = result.find((r) => r.id === 2);
      expect(zero?.abcClass).toBe('C');
      expect(zero?.annualRevenue).toBe(0);
    });

    it('treats negative revenue as zero (defensive, never boosts cumulative share)', () => {
      const rows: CustomerAnnualRevenue[] = [
        { id: 1, name: 'Big Co', annualRevenue: 1000 },
        { id: 2, name: 'Bad Data Co', annualRevenue: -50 },
      ];

      const result = svc.computeAbc(rows);

      const bad = result.find((r) => r.id === 2);
      expect(bad?.abcClass).toBe('C');
      expect(bad?.annualRevenue).toBe(0);
    });

    it('classifies every customer as C when total revenue is zero (no division by zero)', () => {
      const rows: CustomerAnnualRevenue[] = [
        { id: 1, name: 'A', annualRevenue: 0 },
        { id: 2, name: 'B', annualRevenue: 0 },
      ];

      const result = svc.computeAbc(rows);

      expect(result.every((r) => r.abcClass === 'C')).toBe(true);
      expect(result.every((r) => r.cumulativeShare === 0)).toBe(true);
    });

    it('handles an empty or non-array input without throwing', () => {
      expect(svc.computeAbc([])).toEqual([]);
      expect(svc.computeAbc(undefined as unknown as CustomerAnnualRevenue[])).toEqual([]);
    });
  });

  describe('recompute()', () => {
    it('persists computed classes and returns a class-count summary', async () => {
      repo.getAnnualRevenue.mockResolvedValue({
        ok: true,
        data: [
          { id: 1, name: 'Big Co', annualRevenue: 800 },
          { id: 2, name: 'Small Co', annualRevenue: 200 },
        ],
      });
      repo.persistAbc.mockResolvedValue({ ok: true, data: 2 });

      const result = await svc.recompute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.updated).toBe(2);
        expect(result.data.summary.A).toBe(1);
        expect(result.data.summary.C).toBe(1);
      }
      expect(repo.persistAbc).toHaveBeenCalledWith([
        { id: 1, abcClass: 'A' },
        { id: 2, abcClass: 'C' },
      ]);
    });

    it('returns Err when the repo throws while reading revenue', async () => {
      repo.getAnnualRevenue.mockRejectedValue(new Error('db down'));

      const result = await svc.recompute();

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('db down');
      expect(repo.persistAbc).not.toHaveBeenCalled();
    });
  });

  describe('preview()', () => {
    it('computes without persisting', async () => {
      repo.getAnnualRevenue.mockResolvedValue({
        ok: true,
        data: [
          { id: 1, name: 'Big Co', annualRevenue: 800 },
          { id: 2, name: 'Small Co', annualRevenue: 200 },
        ],
      });

      const result = await svc.preview();

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data[0].abcClass).toBe('A');
      expect(repo.persistAbc).not.toHaveBeenCalled();
    });
  });
});
