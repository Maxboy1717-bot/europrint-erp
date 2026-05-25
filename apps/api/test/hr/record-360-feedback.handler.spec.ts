/**
 * test/hr/record-360-feedback.handler.spec.ts
 *
 * Unit tests for Record360FeedbackHandler. Only IHrRepo is mocked.
 */

import {
  Record360FeedbackHandler,
  Record360FeedbackCommand,
} from '../../src/modules/hr/application/commands/record-360-feedback.handler';
import { Ok, Err } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

type Repo = jest.Mocked<IHrRepo>;

function makeRepo(): Repo {
  return {
    save360Feedback: jest.fn().mockResolvedValue(Ok({ id: 'fb-1' })),
    findLeaveById: jest.fn(), updateLeave: jest.fn(), saveLeave: jest.fn(),
    findLeaves: jest.fn(), getLeaveBalance: jest.fn(), getLeaveStats: jest.fn(),
    findEmployeeById: jest.fn(), findAllEmployees: jest.fn(),
    saveEmployee: jest.fn(), updateEmployee: jest.fn(),
    findAttendance: jest.fn(), saveAttendance: jest.fn(), getAttendanceStats: jest.fn(),
    findPayroll: jest.fn(), savePayroll: jest.fn(), updatePayroll: jest.fn(),
    getPayrollSummary: jest.fn(),
    findPayrollRuns: jest.fn(), findPayrollPeriods: jest.fn(),
    findVacancyCandidates: jest.fn(), findDisciplineRecords: jest.fn(),
    findHealthCheckups: jest.fn(),
  } as Repo;
}

const CMD = new Record360FeedbackCommand(42, 100, 'sess-1', 250, 1.5, 87);

describe('Record360FeedbackHandler', () => {
  it('persists 360 feedback payload with all command fields included', async () => {
    const repo = makeRepo();
    const handler = new Record360FeedbackHandler(repo);

    const r = await handler.execute(CMD);

    expect(r.ok).toBe(true);
    expect(repo.save360Feedback).toHaveBeenCalledWith(expect.objectContaining({
      employeeId: 42,
      orderId: 100,
      sessionId: 'sess-1',
      quantity: 250,
      defectRate: 1.5,
      oee: 87,
    }));
  });

  it('returns Err when repo.save360Feedback returns failure', async () => {
    const repo = makeRepo();
    repo.save360Feedback.mockResolvedValue(Err('insert fail'));
    const handler = new Record360FeedbackHandler(repo);

    const r = await handler.execute(CMD);

    expect(r.ok).toBe(false);
  });

  it('returns fallback Ok when repo returns null/undefined result', async () => {
    const repo = makeRepo();
    (repo.save360Feedback as jest.Mock).mockResolvedValue(undefined);
    const handler = new Record360FeedbackHandler(repo);

    const r = await handler.execute(CMD);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBeNull();
  });

  it('includes the recordedAt timestamp when delegating to the repo', async () => {
    const repo = makeRepo();
    const handler = new Record360FeedbackHandler(repo);

    await handler.execute(CMD);

    const arg = repo.save360Feedback.mock.calls[0][0];
    expect(arg.recordedAt).toBeInstanceOf(Date);
  });

  it('calls the repository exactly once per command execution', async () => {
    const repo = makeRepo();
    const handler = new Record360FeedbackHandler(repo);

    await handler.execute(CMD);

    expect(repo.save360Feedback).toHaveBeenCalledTimes(1);
  });
});
