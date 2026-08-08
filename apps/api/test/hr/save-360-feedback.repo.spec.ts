/**
 * test/hr/save-360-feedback.repo.spec.ts
 *
 * G2 (Residual Fix Loop): HrLeaveRepo.save360Feedback() used to swallow DB
 * write failures into a fake-success { ok: true, data: { id: null } }
 * response (GREEN-LIE). Proves it now returns a real Err on DB failure,
 * matching every sibling method in the same file (saveLeave, updateLeave,
 * getLeaveBalance, getLeaveStats).
 *
 * Strategy: mock @shared/db / @workspace/db / drizzle-orm so no real DB call
 * is made (touchedLibDb = false), mirroring test/qc/qc-aql-endpoints.spec.ts.
 */

const mockReturning = jest.fn();
const mockOnConflictDoNothing = jest.fn(() => ({ returning: mockReturning }));
const mockValues = jest.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
const mockInsert = jest.fn(() => ({ values: mockValues }));

jest.mock('@workspace/db', () => ({
  drizzle: jest.fn(),
  pgTable: jest.fn(),
}));

jest.mock('@shared/db', () => ({
  db: { insert: mockInsert, select: jest.fn(), update: jest.fn() },
  leaveRequestsApp: {},
  hrEmployees: {},
  hr_360_feedback: {},
  hr_attendance: {},
  hr_leave_balances: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn().mockReturnValue({}),
  and: jest.fn().mockReturnValue({}),
  sql: jest.fn().mockReturnValue({}),
}));

import { HrLeaveRepo } from '../../src/modules/hr/infrastructure/repositories/drizzle-hr-leave.repo';

const FEEDBACK = { employeeId: 42, orderId: 100, sessionId: 'sess-1', quantity: 250, defectRate: 1.5, oee: 87 };

describe('HrLeaveRepo.save360Feedback (G2 golden-thread green-lie fix)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a real Err (not fake success) when the DB insert throws', async () => {
    mockReturning.mockRejectedValue(new Error('connection terminated unexpectedly'));
    const repo = new HrLeaveRepo();

    const r = await repo.save360Feedback(FEEDBACK);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain('connection terminated unexpectedly');
  });

  it('still returns Ok with the inserted row on a real success', async () => {
    mockReturning.mockResolvedValue([{ id: 7 }]);
    const repo = new HrLeaveRepo();

    const r = await repo.save360Feedback(FEEDBACK);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ id: 7 });
  });
});
