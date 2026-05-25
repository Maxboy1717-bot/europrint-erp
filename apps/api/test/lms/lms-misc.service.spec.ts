/**
 * Smoke spec for LmsMiscService (Rule 22: every service needs a unit test).
 */
import { LmsMiscService } from '../../src/modules/lms/application/services/lms-misc.service';

describe('LmsMiscService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    findAllMicroModules:   jest.fn().mockResolvedValue(Ok([])),
    recordMicroModuleView: jest.fn().mockResolvedValue(Ok({ id: 'v1' })),
    findLmsKnowledge:      jest.fn().mockResolvedValue(Ok([])),
    saveVideoProgress:     jest.fn().mockResolvedValue(Ok({ id: 'p1' })),
    findAchievements:      jest.fn().mockResolvedValue(Ok([])),
    findMentors:           jest.fn().mockResolvedValue(Ok([])),
  };

  it('class is defined', () => {
    expect(LmsMiscService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(LmsMiscService.name).toBe('LmsMiscService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new LmsMiscService(repoStub as never);
    expect(svc).toBeInstanceOf(LmsMiscService);
  });

  it('listMicroModules delegates to repo.findAllMicroModules', async () => {
    const svc = new LmsMiscService(repoStub as never);
    const res = await svc.listMicroModules();
    expect(res.ok).toBe(true);
    expect(repoStub.findAllMicroModules).toHaveBeenCalled();
  });

  it('listKnowledge passes through the query argument', async () => {
    const svc = new LmsMiscService(repoStub as never);
    await svc.listKnowledge('safety');
    expect(repoStub.findLmsKnowledge).toHaveBeenCalledWith('safety');
  });

  it('listMentors forwards specialization filter', async () => {
    const svc = new LmsMiscService(repoStub as never);
    await svc.listMentors('printing');
    expect(repoStub.findMentors).toHaveBeenCalledWith('printing');
  });
});
