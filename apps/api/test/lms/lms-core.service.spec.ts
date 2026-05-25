/**
 * Smoke spec for LmsCoreService (Rule 22: every service needs a unit test).
 */
import { LmsCoreService } from '../../src/modules/lms/application/services/lms-core.service';

describe('LmsCoreService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const examsRepoStub = {
    findLesson:        jest.fn().mockResolvedValue(Ok({ id: 'l1' })),
    findAllExams:      jest.fn().mockResolvedValue(Ok([])),
    saveExam:          jest.fn().mockResolvedValue(Ok({ id: 'e1' })),
    submitExam:        jest.fn().mockResolvedValue(Ok({ score: 80 })),
    findRecentActivity: jest.fn().mockResolvedValue(Ok([])),
    findMyProgress:    jest.fn().mockResolvedValue(Ok({ completed: 5 })),
  };

  it('class is defined', () => {
    expect(LmsCoreService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(LmsCoreService.name).toBe('LmsCoreService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new LmsCoreService(examsRepoStub as never);
    expect(svc).toBeInstanceOf(LmsCoreService);
  });

  it('submitExam returns Err for empty/zero userId without touching repo', async () => {
    const svc = new LmsCoreService(examsRepoStub as never);
    const r1 = await svc.submitExam('e1', '', { answers: [] } as never);
    const r2 = await svc.submitExam('e1', '0', { answers: [] } as never);
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
    expect(examsRepoStub.submitExam).not.toHaveBeenCalled();
  });

  it('getRecentActivity delegates to repo for a valid userId', async () => {
    const svc = new LmsCoreService(examsRepoStub as never);
    const res = await svc.getRecentActivity('42');
    expect(res.ok).toBe(true);
    expect(examsRepoStub.findRecentActivity).toHaveBeenCalledWith('42');
  });

  it('listExams forwards calls to examsRepo.findAllExams', async () => {
    const svc = new LmsCoreService(examsRepoStub as never);
    await svc.listExams('user-1');
    expect(examsRepoStub.findAllExams).toHaveBeenCalledWith('user-1');
  });
});
