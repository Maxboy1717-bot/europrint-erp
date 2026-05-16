/**
 * Unit tests for ShiftRepository.
 * Covers 8 selected public methods with happy + Err paths (within 300-line limit).
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  shiftSchedules: {
    id: 'ss.id', employee_id: 'ss.employee_id', shift_date: 'ss.shift_date',
    shift_type: 'ss.shift_type', start_time: 'ss.start_time', end_time: 'ss.end_time',
    status: 'ss.status', notes: 'ss.notes', created_at: 'ss.created_at',
  },
  leaveRequestsApp: {
    employee_id: 'lr.employee_id', status: 'lr.status',
    start_date: 'lr.start_date', end_date: 'lr.end_date',
  },
  hrEmployees: {
    id: 'he.id', first_name: 'he.first_name', last_name: 'he.last_name',
    department_id: 'he.department_id', user_id: 'he.user_id',
    telegram_chat_id: 'he.telegram_chat_id',
  },
  hrDepartments: { id: 'hd.id', name: 'hd.name' },
}));

import { ShiftRepository } from '../../src/modules/hr/shift/shift.repository';

const baseAssign = { employeeId: 1, shiftDate: '2025-01-01', shiftType: 'morning', startTime: '08:00', endTime: '16:00' };

describe('ShiftRepository', () => {
  let repo: ShiftRepository;
  beforeEach(() => {
    repo = new ShiftRepository();
    dbStub.__setResolved([]);
  });

  describe('assignShift', () => {
    it('returns Ok with row when insert/upsert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'scheduled' }]);
      const r = await repo.assignShift(baseAssign);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'scheduled' });
    });

    it('returns Ok with empty row when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.assignShift(baseAssign);
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.assignShift(baseAssign);
      expect(r.ok).toBe(false);
    });
  });

  describe('findShiftById', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ id: 1 }]);
      const r = await repo.findShiftById(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1 });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findShiftById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findShiftById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findSwapPendingShift', () => {
    it('returns Ok with row when status matches', async () => {
      dbStub.__setResolved([{ id: 1, status: 'swap_pending' }]);
      const r = await repo.findSwapPendingShift(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'swap_pending' });
    });

    it('returns Ok with null when no match', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findSwapPendingShift(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findSwapPendingShift(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('checkLeaveConflict', () => {
    it('returns Ok(true) when conflicting leave exists', async () => {
      dbStub.__setResolved([{ found: 1 }]);
      const r = await repo.checkLeaveConflict(1, '2025-01-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(true);
    });

    it('returns Ok(false) when no conflict', async () => {
      dbStub.__setResolved([]);
      const r = await repo.checkLeaveConflict(1, '2025-01-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(false);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.checkLeaveConflict(1, '2025-01-01');
      expect(r.ok).toBe(false);
    });
  });

  describe('updateShiftStatus', () => {
    it('returns Ok when update succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.updateShiftStatus(1, 'completed', 'done');
      expect(r.ok).toBe(true);
    });

    it('returns Ok with null notes', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.updateShiftStatus(1, 'cancelled', null);
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateShiftStatus(1, 'completed', 'done');
      expect(r.ok).toBe(false);
    });
  });

  describe('findEmployeeShiftOnDate', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ id: 1, shift_date: '2025-01-01' }]);
      const r = await repo.findEmployeeShiftOnDate(1, '2025-01-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, shift_date: '2025-01-01' });
    });

    it('returns Ok with null when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findEmployeeShiftOnDate(1, '2025-01-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findEmployeeShiftOnDate(1, '2025-01-01');
      expect(r.ok).toBe(false);
    });
  });

  describe('deleteShift', () => {
    it('returns Ok when delete succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.deleteShift(1);
      expect(r.ok).toBe(true);
    });

    it('returns Ok when no row matched', async () => {
      dbStub.__setResolved([]);
      const r = await repo.deleteShift(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err on FK violation', async () => {
      dbStub.__setRejected(new Error('FK'));
      const r = await repo.deleteShift(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findEmployeeByUserId', () => {
    it('returns Ok with numeric id when found', async () => {
      dbStub.__setResolved([{ id: 42 }]);
      const r = await repo.findEmployeeByUserId('user-1');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(42);
    });

    it('returns Ok with undefined when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findEmployeeByUserId('absent');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeUndefined();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findEmployeeByUserId('x');
      expect(r.ok).toBe(false);
    });
  });
});
