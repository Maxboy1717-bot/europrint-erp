/**
 * test/mes/lms-cert-expired-block.service.spec.ts
 *
 * Unit tests for LmsCertExpiredBlockService (Trigger 17: MES operator-blocking
 * action fired when an LMS certificate expires). `db.execute` is mocked so the
 * service is exercised hermetically (no live DB), following the same pattern
 * as test/integration/triggers/three-checkpoint-to-pp.spec.ts (another
 * Wave 4 round-2 / PA2-18 event-handler service).
 *
 * Behaviour under test:
 *   1. `block()` short-circuits (no DB call, warn log) when employeeId is not
 *      a finite number — the guard in `block()`.
 *   2. On a successful UPDATE, `block()` logs the number of deactivated
 *      employee_skills rows.
 *   3. When the UPDATE fails (DB error surfaced via Result), `block()` logs
 *      an error and does not throw.
 *   4. `courseId` is forwarded into the SQL so a specific certificate/course
 *      combination is targeted (vs. all courses for the employee) — verified
 *      via the raw SQL text captured by the mocked `db.execute`.
 */

type Row = Record<string, unknown>;
const dbExecute = jest.fn();

jest.mock('@shared/db', () => ({
  db: { execute: (...args: unknown[]) => dbExecute(...args) },
}));

import { Logger } from '@nestjs/common';
import { LmsCertExpiredBlockService } from '../../src/modules/mes/infrastructure/event-handlers/lms-cert-expired-block.service';

function wrap(rows: Row[]): { rows: Row[] } {
  return { rows };
}

describe('LmsCertExpiredBlockService', () => {
  let service: LmsCertExpiredBlockService;
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    dbExecute.mockReset();
    service = new LmsCertExpiredBlockService();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('skips the DB call and warns when employeeId is not finite', async () => {
    await service.block({ employeeId: Number.NaN, certificateType: 'safety' });

    expect(dbExecute).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("employeeId yo'q");
  });

  it('deactivates employee_skills and logs the affected count on success', async () => {
    dbExecute.mockResolvedValueOnce(wrap([{ id: 501 }, { id: 502 }]));

    await service.block({ employeeId: 42, courseId: 7, certificateType: 'forklift' });

    expect(dbExecute).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const [logPayload] = logSpy.mock.calls[0];
    expect(String(logPayload)).toContain('employee 42');
    expect(String(logPayload)).toContain('forklift');
    expect(String(logPayload)).toContain('2 mashina');
  });

  it('includes employeeId and courseId as bound params in the UPDATE statement', async () => {
    dbExecute.mockResolvedValueOnce(wrap([{ id: 9 }]));

    await service.block({ employeeId: 42, courseId: 7 });

    // Drizzle's `sql` tagged template exposes its interpolated parts as
    // `queryChunks`: string-literal chunks (`{ value: [...] }`) interleaved
    // with the raw bound values (42, 7, null, ...).
    const sqlArg = dbExecute.mock.calls[0][0] as { queryChunks: unknown[] };
    expect(sqlArg.queryChunks).toContain(42);
    expect(sqlArg.queryChunks).toContain(7);
    const literalText = sqlArg.queryChunks
      .filter((c): c is { value: string[] } => typeof c === 'object' && c !== null && 'value' in c)
      .map((c) => c.value.join(''))
      .join('');
    expect(literalText).toContain('UPDATE employee_skills');
    expect(literalText).toContain('SET is_active = false');
  });

  it('logs an error and does not throw when the UPDATE fails', async () => {
    dbExecute.mockRejectedValueOnce(new Error('connection terminated'));

    await expect(
      service.block({ employeeId: 42, certificateType: 'safety' }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0][0])).toContain('skill deactivate fail');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('does not log success when zero rows were deactivated (no matching active skill)', async () => {
    dbExecute.mockResolvedValueOnce(wrap([]));

    await service.block({ employeeId: 42 });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(String(logSpy.mock.calls[0][0])).toContain('0 mashina');
  });
});
