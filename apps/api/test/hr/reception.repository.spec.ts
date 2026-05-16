/**
 * Unit tests for ReceptionRepository.
 * Covers checkIn/checkOut + visitor query methods.
 */

import { makeDbChain, makeRunQuery } from '../_setup/db-mock';

const dbStub = makeDbChain([]);
const runQueryMock = makeRunQuery([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: runQueryMock,
  visitor_log: {
    id: 'vl.id', visitor_name: 'vl.visitor_name', check_out_at: 'vl.check_out_at',
    check_in_at: 'vl.check_in_at', host_employee_id: 'vl.host_employee_id', badge_number: 'vl.badge_number',
  },
  hrEmployees: { id: 'he.id', first_name: 'he.first_name', last_name: 'he.last_name' },
}));

import { ReceptionRepository } from '../../src/modules/hr/reception/reception.repository';

const baseCheckIn = { visitorName: 'John Doe', purpose: 'meeting', hostEmployeeId: 1, badgeNumber: 'B-001' };

describe('ReceptionRepository', () => {
  let repo: ReceptionRepository;
  beforeEach(() => {
    repo = new ReceptionRepository();
    dbStub.__setResolved([]);
    runQueryMock.mockReset().mockResolvedValue({ rows: [] });
  });

  describe('checkInVisitor', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, visitor_name: 'John Doe' }]);
      const r = await repo.checkInVisitor(baseCheckIn);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, visitor_name: 'John Doe' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.checkInVisitor(baseCheckIn);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.checkInVisitor(baseCheckIn);
      expect(r.ok).toBe(false);
    });
  });

  describe('checkOutVisitor', () => {
    it('returns Ok with row when checkout succeeds', async () => {
      dbStub.__setResolved([{ id: 1, check_out_at: '2025-01-01T10:00:00Z' }]);
      const r = await repo.checkOutVisitor(1, 'left building');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, check_out_at: '2025-01-01T10:00:00Z' });
    });

    it('returns Ok with null when visitor already checked out', async () => {
      dbStub.__setResolved([]);
      const r = await repo.checkOutVisitor(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.checkOutVisitor(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('validateBadge', () => {
    it('returns Ok with row when badge active', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, badge_number: 'B-001', host_name: 'Host' }] });
      const r = await repo.validateBadge('B-001');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).not.toBeNull();
    });

    it('returns Ok with null when badge inactive', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.validateBadge('UNKNOWN');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.validateBadge('B-001');
      expect(r.ok).toBe(false);
    });
  });

  describe('getActiveVisitors', () => {
    it('returns Ok with active visitors when present', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });
      const r = await repo.getActiveVisitors();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no active visitors', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getActiveVisitors();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getActiveVisitors();
      expect(r.ok).toBe(false);
    });
  });

  describe('getVisitorLog', () => {
    it('returns Ok with rows when log entries present', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const r = await repo.getVisitorLog(50);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no entries', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getVisitorLog(50);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getVisitorLog(50);
      expect(r.ok).toBe(false);
    });
  });

  describe('getStats', () => {
    it('returns Ok with stats when row present', async () => {
      dbStub.__setResolved([{ active_visitors: 3, today_visitors: 12, month_visitors: 120 }]);
      const r = await repo.getStats();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.active_visitors).toBe(3);
    });

    it('returns Ok with empty object when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getStats();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getStats();
      expect(r.ok).toBe(false);
    });
  });

  describe('autoCheckoutOverdue', () => {
    it('returns Ok with rows when overdue visitors found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, visitor_name: 'X' }] });
      const r = await repo.autoCheckoutOverdue();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none overdue', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.autoCheckoutOverdue();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.autoCheckoutOverdue();
      expect(r.ok).toBe(false);
    });
  });
});
