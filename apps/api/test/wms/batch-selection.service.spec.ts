/**
 * test/wms/batch-selection.service.spec.ts
 *
 * Unit tests for the pure BatchSelectionService — #08 PHASE 4/7.
 * No DB / mocks: exercises strategy resolution, ordering, expired-block,
 * and multi-batch spanning directly.
 */

import {
  BatchSelectionService,
  IssuableBatchLot,
} from '../../src/modules/wms/domain/services/batch-selection.service';
import { BatchIssueStrategy } from '../../src/modules/wms/domain/constants/wms-batch-issue.constants';

const NOW = new Date('2026-06-19T00:00:00Z');
const days = (n: number): Date => new Date(NOW.getTime() + n * 86_400_000);

function lot(
  id: number,
  remaining: number,
  expiryDays: number | null,
  receivedDaysAgo: number,
): IssuableBatchLot {
  return {
    id,
    remaining,
    expiryDate: expiryDays === null ? null : days(expiryDays),
    receivedAt: days(-receivedDaysAgo),
  };
}

describe('BatchSelectionService.resolveStrategy', () => {
  const svc = new BatchSelectionService();

  it('returns FIFO when no batch has an expiry date', () => {
    expect(svc.resolveStrategy([lot(1, 10, null, 5), lot(2, 10, null, 1)])).toBe(
      BatchIssueStrategy.FIFO,
    );
  });

  it('returns FEFO when any batch has an expiry date (dated material)', () => {
    expect(svc.resolveStrategy([lot(1, 10, null, 5), lot(2, 10, 30, 1)])).toBe(
      BatchIssueStrategy.FEFO,
    );
  });

  it('honours an explicit override', () => {
    expect(svc.resolveStrategy([lot(1, 10, 30, 5)], BatchIssueStrategy.FIFO)).toBe(
      BatchIssueStrategy.FIFO,
    );
  });
});

describe('BatchSelectionService.buildPlan', () => {
  const svc = new BatchSelectionService();

  it('FIFO picks the oldest-received batch first', () => {
    const r = svc.buildPlan([lot(2, 100, null, 5), lot(1, 100, null, 30)], 40, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.strategy).toBe(BatchIssueStrategy.FIFO);
      expect(r.data.picks).toEqual([{ lotId: 1, qty: 40 }]);
    }
  });

  it('FEFO picks the earliest-expiry batch first', () => {
    const r = svc.buildPlan([lot(1, 100, 90, 60), lot(2, 100, 10, 1)], 30, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.strategy).toBe(BatchIssueStrategy.FEFO);
      expect(r.data.picks).toEqual([{ lotId: 2, qty: 30 }]);
    }
  });

  it('spans multiple batches when the first is insufficient', () => {
    const r = svc.buildPlan([lot(1, 50, null, 30), lot(2, 100, null, 10)], 120, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.picks).toEqual([
        { lotId: 1, qty: 50 },
        { lotId: 2, qty: 70 },
      ]);
    }
  });

  it('blocks when an expired batch with positive qoldiq is present', () => {
    const r = svc.buildPlan([lot(1, 50, -1, 30), lot(2, 50, 30, 5)], 20, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('errs when total qoldiq cannot cover the amount', () => {
    const r = svc.buildPlan([lot(1, 10, null, 30), lot(2, 20, null, 10)], 100, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_QUANTITY');
  });

  it('errs on non-positive amount', () => {
    const r = svc.buildPlan([lot(1, 10, null, 30)], 0, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_QUANTITY');
  });

  it('ignores zero-qoldiq batches when planning', () => {
    const r = svc.buildPlan([lot(1, 0, null, 30), lot(2, 25, null, 10)], 25, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.picks).toEqual([{ lotId: 2, qty: 25 }]);
  });
});
