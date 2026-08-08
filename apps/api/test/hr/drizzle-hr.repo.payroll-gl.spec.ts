/**
 * test/hr/drizzle-hr.repo.payroll-gl.spec.ts
 *
 * F3 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): HrRepository.postPayrollToGL() now routes through
 * GlPostingService.postPayroll() (the ONE engine) instead of a bespoke raw INSERT INTO entries.
 * Covers: happy path, GL-engine rejection surfaced as Err, and the two pre-existing guards
 * (already-paid, zero/negative salary_earned) that were not touched by the migration.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db/schema-hr-overtime', () => ({ overtime_policy: {} }));
jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  hrEmployees: {}, hrDepartments: {}, hrPositions: {},
  payroll_period_record: {
    id: 'id', employee_id: 'employee_id', salary_earned: 'salary_earned', status: 'status',
    salary_period_start: 'salary_period_start',
  },
  salary_change_log: {}, payroll_periods_hr: {},
  candidates: {}, discipline_records: {}, hr_health_checkups: {},
}));

import { Ok, Err } from '../../src/common/result';
import { HrRepository } from '../../src/modules/hr/infrastructure/repositories/drizzle-hr.repo';
import { HrLeaveRepo } from '../../src/modules/hr/infrastructure/repositories/drizzle-hr-leave.repo';
import type { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';

function makeGlMock(): jest.Mocked<Pick<GlPostingService, 'postPayroll'>> {
  return { postPayroll: jest.fn() };
}

describe('HrRepository.postPayrollToGL() — F3 GL-engine migration', () => {
  let glMock: jest.Mocked<Pick<GlPostingService, 'postPayroll'>>;
  let repo: HrRepository;

  beforeEach(() => {
    kit.reset();
    glMock = makeGlMock();
    repo = new HrRepository(new HrLeaveRepo(), glMock as unknown as GlPostingService);
  });

  it('posts through GlPostingService.postPayroll and flips status to paid', async () => {
    kit.queueSelect([{ id: 5, employee_id: 10, salary_earned: '2700000.00', status: 'approved' }]);
    glMock.postPayroll.mockResolvedValueOnce(Ok(999));
    kit.queueUpdate([{ id: 5, status: 'paid', paid_by: 1, paid_date: '2026-07-06' }]);

    const r = await repo.postPayrollToGL(5, 1);

    expect(glMock.postPayroll).toHaveBeenCalledWith(5, 2_700_000);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.gl_entry_id).toBe(999);
  });

  it('returns Err (does not flip status) when the GL engine rejects the posting', async () => {
    kit.queueSelect([{ id: 6, employee_id: 11, salary_earned: '1000000.00', status: 'approved' }]);
    glMock.postPayroll.mockResolvedValueOnce(Err('Davr yopilgan (EP-FIN-064): ...'));

    const r = await repo.postPayrollToGL(6, 1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/EP-FIN-064/);
    // status UPDATE must never run when the GL post itself failed
    expect(kit.db.update).not.toHaveBeenCalled();
  });

  it('rejects an already-paid payroll without calling the GL engine (pre-existing guard, unchanged)', async () => {
    kit.queueSelect([{ id: 7, employee_id: 12, salary_earned: '500000.00', status: 'paid' }]);

    const r = await repo.postPayrollToGL(7, 1);

    expect(r.ok).toBe(false);
    expect(glMock.postPayroll).not.toHaveBeenCalled();
  });

  it('rejects zero/negative salary_earned without calling the GL engine (pre-existing guard, unchanged)', async () => {
    kit.queueSelect([{ id: 8, employee_id: 13, salary_earned: '0', status: 'approved' }]);

    const r = await repo.postPayrollToGL(8, 1);

    expect(r.ok).toBe(false);
    expect(glMock.postPayroll).not.toHaveBeenCalled();
  });
});
