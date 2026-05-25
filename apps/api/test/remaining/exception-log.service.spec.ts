/**
 * Smoke spec for ExceptionLogService (Rule 22: every service needs a unit test).
 */
import { ExceptionLogService } from '../../src/modules/remaining/exception-log.service';

describe('ExceptionLogService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    getAll:            jest.fn().mockResolvedValue([]),
    countAll:          jest.fn().mockResolvedValue(0),
    getAllForStats:    jest.fn().mockResolvedValue(Ok([])),
    countRecent:       jest.fn().mockResolvedValue(0),
    getOne:            jest.fn().mockResolvedValue({ id: '1' }),
    insert:            jest.fn().mockResolvedValue({ id: '1', module: 'X', status: 'pending' }),
    getExpiringCerts:  jest.fn().mockResolvedValue([]),
    update:            jest.fn().mockResolvedValue(Ok({ id: '1' })),
    softDelete:        jest.fn().mockResolvedValue(Ok(true)),
  };

  it('class is defined', () => {
    expect(ExceptionLogService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(ExceptionLogService.name).toBe('ExceptionLogService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new ExceptionLogService(repoStub as never);
    expect(svc).toBeInstanceOf(ExceptionLogService);
  });

  it('getAll returns Ok with data/total/limit/offset shape', async () => {
    const svc = new ExceptionLogService(repoStub as never);
    const res = await svc.getAll({ limit: '10', offset: '0' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { data: unknown[]; total: number; limit: number; offset: number };
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(0);
    }
  });

  it('getStats aggregates empty buckets when repo returns empty list', async () => {
    const svc = new ExceptionLogService(repoStub as never);
    const stats = await svc.getStats();
    expect(stats.total).toBe(0);
    expect(stats.byModule).toEqual({});
    expect(stats.byType).toEqual({});
  });

  it('create delegates to repo.insert with the expected fields', async () => {
    const svc = new ExceptionLogService(repoStub as never);
    await svc.create({ module: 'SD', exceptionType: 'x', status: 'pending' }, 7);
    expect(repoStub.insert).toHaveBeenCalledWith(expect.objectContaining({ module: 'SD', requestedBy: 7 }));
  });
});
