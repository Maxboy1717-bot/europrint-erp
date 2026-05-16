/**
 * Smoke spec for IdealRasmService (Rule 22: every service needs a unit test).
 */
import { IdealRasmService } from '../../src/modules/remaining/ideal-rasm.service';

describe('IdealRasmService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    ensureSeeded:            jest.fn().mockResolvedValue(undefined),
    getAll:                  jest.fn().mockResolvedValue(Ok([{ target_key: 'weekly_revenue', target_value: '100' }])),
    getWeeklyRevenue:        jest.fn().mockResolvedValue(Ok(50)),
    getActiveEmployeesCount: jest.fn().mockResolvedValue(Ok(42)),
    updateTarget:            jest.fn().mockResolvedValue({ id: '1', target_key: 'x' }),
  };

  it('class is defined', () => {
    expect(IdealRasmService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(IdealRasmService.name).toBe('IdealRasmService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new IdealRasmService(repoStub as never);
    expect(svc).toBeInstanceOf(IdealRasmService);
  });

  it('getAll enriches targets with actualValue and achievementPct', async () => {
    const svc = new IdealRasmService(repoStub as never);
    const res = await svc.getAll();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { targets: Array<{ actualValue: number; achievementPct: number }> };
      expect(data.targets).toHaveLength(1);
      expect(data.targets[0].actualValue).toBe(50);
      expect(data.targets[0].achievementPct).toBe(50);
    }
  });

  it('updateAll iterates over targets and calls repo.updateTarget per entry', async () => {
    const svc = new IdealRasmService(repoStub as never);
    const res = await svc.updateAll({ targets: [{ targetKey: 'a', targetValue: 10 }, { targetKey: 'b', targetValue: 20 }] });
    expect(res.ok).toBe(true);
    expect(repoStub.updateTarget).toHaveBeenCalledTimes(2);
  });
});
