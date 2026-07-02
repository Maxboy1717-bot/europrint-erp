/**
 * test/wms/supplier-rating.service.spec.ts
 *
 * Unit tests for SupplierRatingService — 4-factor supplier reliability rating
 * (EP-WMS-094 / EP-WMS-022). The scoring/weighting math is private, so it is
 * exercised end-to-end through `recompute()` with a mock repo (DB-free) and a
 * mock ConfigService — mirrors the WmsQuarantineGateService mock-repo pattern
 * (test/wms/wms-quarantine-gate.service.spec.ts).
 *
 * Covers Q-40 "no fabricated data" rules:
 *   - vendor not found → skip (rating null), no persist.
 *   - no factor has enough observations → rating stays null, no persist.
 *   - a single missing factor → weights re-normalise over the remaining ones
 *     (not silently padded with a fake score).
 *   - low rating (< SUPPLIER_RATING_LOW_THRESHOLD) sets lowFlag=true.
 *   - ConfigService weight overrides actually change the computed rating.
 */

import { SupplierRatingService } from '../../src/modules/wms/application/supplier-rating.service';
import type {
  ISupplierRatingRepo,
  SupplierRatingPersist,
} from '../../src/modules/wms/domain/repositories/i-supplier-rating.repo';
import type { SupplierWindowAggregate } from '../../src/modules/wms/domain/constants/supplier-rating.constants';
import { Ok, Err } from '../../src/common/result';
import type { ConfigService } from '@nestjs/config';

// ─── Mock repo factory ───────────────────────────────────────────────────────
function makeMockRepo(opts: {
  exists?: boolean;
  aggregate?: SupplierWindowAggregate;
}): { repo: jest.Mocked<ISupplierRatingRepo>; persisted: () => SupplierRatingPersist | null } {
  let captured: SupplierRatingPersist | null = null;

  const zeroAgg: SupplierWindowAggregate = {
    vendorId: 1,
    totalDeliveries: 0,
    onTimeDeliveries: 0,
    lateDeliveries: 0,
    qcAccepted: 0,
    qcRejected: 0,
    documentsComplete: 0,
    documentsTotal: 0,
    priceCv: null,
    avgUnitPrice: null,
    totalSpend: 0,
  };

  const repo: jest.Mocked<ISupplierRatingRepo> = {
    vendorExists: jest.fn(async () => Ok(opts.exists ?? true)),
    computeWindowAggregate: jest.fn(async () => Ok(opts.aggregate ?? zeroAgg)),
    persistRating: jest.fn(async (input: SupplierRatingPersist) => {
      captured = input;
      return Ok(undefined);
    }),
    listRatings: jest.fn(async () => Ok([])),
    getRating: jest.fn(async () => Ok(null)),
  };

  return { repo, persisted: () => captured };
}

/** ConfigService stub — only `.get()` is used by SupplierRatingService. */
function makeConfig(overrides: Record<string, number> = {}): ConfigService {
  return {
    get: jest.fn((key: string) => overrides[key]),
  } as unknown as ConfigService;
}

describe('SupplierRatingService', () => {
  describe('recompute() — validation', () => {
    it('rejects non-integer vendorId', async () => {
      const { repo } = makeMockRepo({});
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.recompute(1.5, 'test');

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
      expect(repo.vendorExists).not.toHaveBeenCalled();
    });

    it('rejects vendorId <= 0', async () => {
      const { repo } = makeMockRepo({});
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.recompute(0, 'test');

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });
  });

  describe('recompute() — vendor not found (Q-40 skip, no fabrication)', () => {
    it('returns rating=null and does NOT call persistRating', async () => {
      const { repo, persisted } = makeMockRepo({ exists: false });
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.recompute(999, 'qc.fail');

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rating).toBeNull();
        expect(r.data.lowFlag).toBe(false);
        expect(r.data.source).toBe('qc.fail');
      }
      expect(repo.computeWindowAggregate).not.toHaveBeenCalled();
      expect(repo.persistRating).not.toHaveBeenCalled();
      expect(persisted()).toBeNull();
    });
  });

  describe('recompute() — no factor has enough data (Q-40: no fake rating)', () => {
    it('rating stays null and persistRating is never called', async () => {
      const { repo, persisted } = makeMockRepo({
        exists: true,
        aggregate: {
          vendorId: 1,
          totalDeliveries: 0,
          onTimeDeliveries: 0,
          lateDeliveries: 0,
          qcAccepted: 0,
          qcRejected: 0,
          documentsComplete: 0,
          documentsTotal: 0,
          priceCv: null,
          avgUnitPrice: null,
          totalSpend: 0,
        },
      });
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.recompute(1, 'goods_receipt');

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rating).toBeNull();
        expect(r.data.factors).toEqual({ onTime: null, quality: null, price: null, document: null });
      }
      expect(repo.persistRating).not.toHaveBeenCalled();
      expect(persisted()).toBeNull();
    });
  });

  describe('recompute() — full 4-factor computation (default weights 0.4/0.3/0.2/0.1)', () => {
    it('computes the exact weighted rating and persists the correct breakdown', async () => {
      // onTime = 8/10 = 0.8, quality = 1-2/20 = 0.9, price = 1-0.1*1.0 = 0.9, document = 9/10 = 0.9
      // weighted = 0.8*0.4 + 0.9*0.3 + 0.9*0.2 + 0.9*0.1 = 0.86 → scaled = 1 + 0.86*4 = 4.44
      const { repo, persisted } = makeMockRepo({
        exists: true,
        aggregate: {
          vendorId: 7,
          totalDeliveries: 10,
          onTimeDeliveries: 8,
          lateDeliveries: 2,
          qcAccepted: 18,
          qcRejected: 2,
          documentsComplete: 9,
          documentsTotal: 10,
          priceCv: 0.1,
          avgUnitPrice: 1000,
          totalSpend: 5_000_000,
        },
      });
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.recompute(7, 'goods_receipt');

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rating).toBe(4.44);
        expect(r.data.lowFlag).toBe(false);
        expect(r.data.factors).toEqual({ onTime: 0.8, quality: 0.9, price: 0.9, document: 0.9 });
      }

      const p = persisted();
      expect(p).not.toBeNull();
      expect(p?.rating).toBe(4.44);
      expect(p?.lowFlag).toBe(false);
      expect(p?.onTimeRate).toBe(0.8);
      expect(p?.qualityRate).toBe(0.9);
      expect(p?.priceScore).toBe(0.9);
      expect(p?.documentCompliance).toBe(0.9);
      expect(p?.totalOrders).toBe(10);
      expect(p?.source).toBe('goods_receipt');
    });

    it('poor performance across all factors → lowFlag=true (below 2.5 threshold)', async () => {
      // Each factor = 0.1 → weighted = 0.1 (weights sum to 1) → scaled = 1 + 0.1*4 = 1.4
      const { repo } = makeMockRepo({
        exists: true,
        aggregate: {
          vendorId: 3,
          totalDeliveries: 10,
          onTimeDeliveries: 1,
          lateDeliveries: 9,
          qcAccepted: 2,
          qcRejected: 18,
          documentsComplete: 1,
          documentsTotal: 10,
          priceCv: 0.9,
          avgUnitPrice: 500,
          totalSpend: 1_000_000,
        },
      });
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.recompute(3, 'qc.fail');

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rating).toBe(1.4);
        expect(r.data.lowFlag).toBe(true);
      }
    });
  });

  describe('recompute() — missing single factor re-normalises weights (Q-40: no fabrication)', () => {
    it('onTime has no observations → excluded, remaining weights re-normalised', async () => {
      // quality=1.0, price=0.5, document=0.0; onTime=null (0 measured deliveries).
      // Remaining weights: quality 0.3 + price 0.2 + document 0.1 = 0.6.
      // weighted = (1.0*0.3 + 0.5*0.2 + 0.0*0.1) / 0.6 = 0.4/0.6 = 0.66667
      // scaled = 1 + 0.66667*4 = 3.66667 → round2 = 3.67
      const { repo, persisted } = makeMockRepo({
        exists: true,
        aggregate: {
          vendorId: 5,
          totalDeliveries: 10,
          onTimeDeliveries: 0,
          lateDeliveries: 0, // onTimeMeasured = 0 → onTime factor = null
          qcAccepted: 10,
          qcRejected: 0,
          documentsComplete: 0,
          documentsTotal: 10,
          priceCv: 0.5,
          avgUnitPrice: 200,
          totalSpend: 2_000_000,
        },
      });
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.recompute(5, 'monthly_cron');

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.factors.onTime).toBeNull();
        expect(r.data.rating).toBe(3.67);
      }
      expect(persisted()?.onTimeRate).toBeNull();
    });
  });

  describe('recompute() — ConfigService weight overrides actually change the rating', () => {
    it('custom weights shift the rating away from the default-weight result', async () => {
      // onTime=1.0, quality=0.0, price=0.0, document=0.0.
      // Default weights (onTime 0.4) → weighted=0.4 → rating = 1+0.4*4 = 2.6.
      // Override onTime weight down to 0.1 (rest 0.3/0.3/0.3, sum=1.0) → weighted=0.1
      // → rating = 1+0.1*4 = 1.4 (strictly lower than the default result).
      const aggregate: SupplierWindowAggregate = {
        vendorId: 9,
        totalDeliveries: 10,
        onTimeDeliveries: 10,
        lateDeliveries: 0,
        qcAccepted: 0,
        qcRejected: 10,
        documentsComplete: 0,
        documentsTotal: 10,
        priceCv: 1.0,
        avgUnitPrice: 300,
        totalSpend: 3_000_000,
      };

      const { repo: defaultRepo } = makeMockRepo({ exists: true, aggregate });
      const defaultSvc = new SupplierRatingService(defaultRepo, makeConfig());
      const defaultResult = await defaultSvc.recompute(9, 'test');

      const { repo: overrideRepo } = makeMockRepo({ exists: true, aggregate });
      const overrideSvc = new SupplierRatingService(
        overrideRepo,
        makeConfig({
          SUPPLIER_RATING_WEIGHT_ON_TIME: 0.1,
          SUPPLIER_RATING_WEIGHT_QUALITY: 0.3,
          SUPPLIER_RATING_WEIGHT_PRICE: 0.3,
          SUPPLIER_RATING_WEIGHT_DOCUMENT: 0.3,
        }),
      );
      const overrideResult = await overrideSvc.recompute(9, 'test');

      expect(defaultResult.ok).toBe(true);
      expect(overrideResult.ok).toBe(true);
      if (defaultResult.ok && overrideResult.ok) {
        expect(defaultResult.data.rating).toBe(2.6);
        expect(overrideResult.data.rating).toBe(1.4);
        expect(overrideResult.data.rating).toBeLessThan(defaultResult.data.rating as number);
      }
    });
  });

  describe('listRatings() — limit clamping (1..100)', () => {
    it('clamps an out-of-range limit to 100 and delegates to the repo', async () => {
      const { repo } = makeMockRepo({});
      const svc = new SupplierRatingService(repo, makeConfig());

      await svc.listRatings(false, 9999, -5);

      expect(repo.listRatings).toHaveBeenCalledWith(false, 100, 0);
    });

    it('defaults a NaN/zero limit to 50', async () => {
      const { repo } = makeMockRepo({});
      const svc = new SupplierRatingService(repo, makeConfig());

      await svc.listRatings(true, 0, 0);

      expect(repo.listRatings).toHaveBeenCalledWith(true, 50, 0);
    });
  });

  describe('getRating() — NOT_FOUND when repo returns null', () => {
    it('propagates NOT_FOUND for an unknown vendor', async () => {
      const { repo } = makeMockRepo({});
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.getRating(42);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    });

    it('rejects an invalid vendorId before touching the repo', async () => {
      const { repo } = makeMockRepo({});
      const svc = new SupplierRatingService(repo, makeConfig());

      const r = await svc.getRating(-1);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
      expect(repo.getRating).not.toHaveBeenCalled();
    });
  });
});
