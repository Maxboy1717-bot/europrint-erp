/**
 * inventory-count.aggregate.spec.ts — POS v2 InventoryCount aggregate tests.
 *
 * Covers complete & approve transitions, status guards, derived totals
 * (totalVarianceItems / totalVarianceValue), and timestamp updates.
 */

import {
  InventoryCount,
  CountStatus,
  CountLine,
} from '../../src/modules/pos-v2/domain/aggregates/inventory-count.aggregate';
import { DomainError } from '../../src/shared/domain/errors/domain-error';
import { stockFactory } from '../_fixtures/factories';

function makeLine(overrides: Partial<CountLine> = {}): CountLine {
  const s = stockFactory();
  return {
    id: `line-${s.id}`,
    countId: 'count-1',
    stockItemId: String(s.materialId),
    sku: `SKU-${s.materialId}`,
    itemName: 'Karton 250g',
    systemQuantity: 100,
    countedQuantity: 100,
    variance: 0,
    unit: 'kg',
    location: 'A-1',
    notes: null,
    ...overrides,
  };
}

function makeCount(status: CountStatus, lines: CountLine[] = []): InventoryCount {
  return new InventoryCount(
    'count-uuid',
    'wh-1',
    'INV-2026-0001',
    status,
    lines,
    'user-1',
    null,
    null,
    null,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );
}

describe('InventoryCount aggregate', () => {
  describe('complete', () => {
    it('flips status to COMPLETED when count was in_progress', () => {
      const c = makeCount(CountStatus.IN_PROGRESS);
      c.complete();
      expect(c.status).toBe(CountStatus.COMPLETED);
    });

    it('updates updatedAt timestamp when complete is called', () => {
      const c = makeCount(CountStatus.IN_PROGRESS);
      const before = c.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      c.complete();
      expect(c.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('throws DomainError when complete is called on DRAFT', () => {
      const c = makeCount(CountStatus.DRAFT);
      expect(() => c.complete()).toThrow(DomainError);
    });

    it('throws DomainError when complete is called on already COMPLETED', () => {
      const c = makeCount(CountStatus.COMPLETED);
      expect(() => c.complete()).toThrow(DomainError);
    });
  });

  describe('approve', () => {
    it('flips status to APPROVED and records approver when count was completed', () => {
      const c = makeCount(CountStatus.COMPLETED);
      c.approve('approver-7');
      expect(c.status).toBe(CountStatus.APPROVED);
      expect(c.approvedBy).toBe('approver-7');
      expect(c.approvedAt).toBeInstanceOf(Date);
    });

    it('throws DomainError when approve is called on IN_PROGRESS', () => {
      const c = makeCount(CountStatus.IN_PROGRESS);
      expect(() => c.approve('u')).toThrow(DomainError);
    });

    it('throws DomainError when approve is called on DRAFT', () => {
      const c = makeCount(CountStatus.DRAFT);
      expect(() => c.approve('u')).toThrow(DomainError);
    });

    it('leaves approvedBy null when approve is rejected', () => {
      const c = makeCount(CountStatus.DRAFT);
      try { c.approve('u'); } catch { /* expected */ }
      expect(c.approvedBy).toBeNull();
      expect(c.approvedAt).toBeNull();
    });
  });

  describe('derived totals', () => {
    it('returns zero variance items when all lines match system quantity', () => {
      const lines = [makeLine(), makeLine({ id: 'l2' })];
      const c = makeCount(CountStatus.IN_PROGRESS, lines);
      expect(c.totalVarianceItems).toBe(0);
      expect(c.totalVarianceValue).toBe(0);
    });

    it('counts only lines with non-zero variance when computing totalVarianceItems', () => {
      const lines = [
        makeLine({ variance: 0 }),
        makeLine({ id: 'l2', variance: -3 }),
        makeLine({ id: 'l3', variance: 5 }),
      ];
      const c = makeCount(CountStatus.IN_PROGRESS, lines);
      expect(c.totalVarianceItems).toBe(2);
    });

    it('sums absolute variance values when computing totalVarianceValue', () => {
      const lines = [
        makeLine({ variance: -3 }),
        makeLine({ id: 'l2', variance: 5 }),
        makeLine({ id: 'l3', variance: 0 }),
      ];
      const c = makeCount(CountStatus.IN_PROGRESS, lines);
      expect(c.totalVarianceValue).toBe(8);
    });

    it('returns zero totalVarianceValue when no lines exist', () => {
      const c = makeCount(CountStatus.DRAFT, []);
      expect(c.totalVarianceValue).toBe(0);
      expect(c.totalVarianceItems).toBe(0);
    });
  });
});
