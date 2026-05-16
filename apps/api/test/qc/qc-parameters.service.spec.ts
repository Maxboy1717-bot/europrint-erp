/**
 * test/qc/qc-parameters.service.spec.ts
 *
 * QcParametersService — passes payload to QcParametersRepository, but the
 * createTest method derives the pass/fail/pending status from min/max values
 * and the aiAnalyzeTest method computes a confidence score from deviation.
 */

import { QcParametersService } from '../../src/modules/qc/application/qc-parameters.service';
import { QcParametersRepository } from '../../src/modules/qc/infrastructure/repositories/qc-parameters.repository';

function buildRepo(overrides: Partial<jest.Mocked<QcParametersRepository>> = {}): jest.Mocked<QcParametersRepository> {
  return {
    findGrouped: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    insert: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    deactivate: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    seed: jest.fn().mockResolvedValue({ ok: true, data: { seeded: 5 } }),
    findTests: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    findRecentTests: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    insertTest: jest.fn().mockResolvedValue({ ok: true, data: { id: 1, result: 'pass' } }),
    findTestById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    deleteStandard: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    ...overrides,
  } as unknown as jest.Mocked<QcParametersRepository>;
}

describe('QcParametersService.createTest', () => {
  it("derives result='pass' when value falls inside the min/max band", async () => {
    const repo = buildRepo();
    const svc = new QcParametersService(repo);

    await svc.createTest({ parameter_name: 'T', value: 50, min_value: 0, max_value: 100 });

    expect(repo.insertTest).toHaveBeenCalledWith(expect.objectContaining({ result: 'pass' }));
  });

  it("derives result='fail' when value falls outside the min/max band", async () => {
    const repo = buildRepo();
    const svc = new QcParametersService(repo);

    await svc.createTest({ parameter_name: 'T', value: 150, min_value: 0, max_value: 100 });

    expect(repo.insertTest).toHaveBeenCalledWith(expect.objectContaining({ result: 'fail' }));
  });

  it("derives result='pending' when min/max not supplied", async () => {
    const repo = buildRepo();
    const svc = new QcParametersService(repo);

    await svc.createTest({ parameter_name: 'T', value: 50 });

    expect(repo.insertTest).toHaveBeenCalledWith(expect.objectContaining({ result: 'pending' }));
  });
});

describe('QcParametersService.aiAnalyzeTest', () => {
  it('returns NOT_FOUND when test id does not exist', async () => {
    const repo = buildRepo({
      findTestById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    });
    const svc = new QcParametersService(repo);

    const r = await svc.aiAnalyzeTest(123);

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NOT_FOUND');
  });

  it("classifies a centred value as 'stable' with high confidence", async () => {
    const repo = buildRepo({
      findTestById: jest.fn().mockResolvedValue({
        ok: true,
        data: { id: 1, value: 50, minValue: 0, maxValue: 100 },
      }),
    });
    const svc = new QcParametersService(repo);

    const r = await svc.aiAnalyzeTest(1);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const data = r.data as { analysis: { trend: string }; confidenceScore: number };
    expect(data.analysis.trend).toBe('stable');
    expect(data.confidenceScore).toBeGreaterThan(0.9);
  });

  it("classifies a heavily off-centre value as 'critical'", async () => {
    const repo = buildRepo({
      findTestById: jest.fn().mockResolvedValue({
        ok: true,
        data: { id: 2, value: 95, minValue: 0, maxValue: 100 },
      }),
    });
    const svc = new QcParametersService(repo);

    const r = await svc.aiAnalyzeTest(2);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const data = r.data as { analysis: { trend: string } };
    expect(data.analysis.trend).toBe('critical');
  });

  it('seedParameters delegates to repository seed()', async () => {
    const repo = buildRepo();
    const svc = new QcParametersService(repo);

    const r = await svc.seedParameters();

    expect(repo.seed).toHaveBeenCalled();
    expect(r.ok).toBe(true);
  });

  it('createParameter remaps snake_case keys to camelCase before insert', async () => {
    const repo = buildRepo();
    const svc = new QcParametersService(repo);

    await svc.createParameter({ name: 'p', min_value: 1, max_value: 10, target_value: 5 });

    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({
      name: 'p',
      minValue: 1,
      maxValue: 10,
      targetValue: 5,
    }));
  });
});
