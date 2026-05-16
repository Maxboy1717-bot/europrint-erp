/**
 * Smoke spec for LmsExamsService (Rule 22: every service needs a unit test).
 *
 * The service currently returns NOT_FOUND because LMS exam tables are not yet
 * provisioned. The spec locks that contract until DB schema lands.
 */
import { LmsExamsService } from '../../src/modules/lms/application/services/lms-exams.service';

describe('LmsExamsService', () => {
  it('class is defined', () => {
    expect(LmsExamsService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(LmsExamsService.name).toBe('LmsExamsService');
  });

  it('is constructible without arguments', () => {
    const svc = new LmsExamsService();
    expect(svc).toBeInstanceOf(LmsExamsService);
  });

  it('submitExam returns an Err Result while tables are not provisioned', async () => {
    const svc = new LmsExamsService();
    const res = await svc.submitExam(1, 1);
    expect(res.ok).toBe(false);
  });

  it('submitExam Err uses NOT_FOUND code per current implementation', async () => {
    const svc = new LmsExamsService();
    const res = await svc.submitExam(99, 5);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const code = (res.error as { code?: string }).code;
      expect(code).toBe('NOT_FOUND');
    }
  });
});
