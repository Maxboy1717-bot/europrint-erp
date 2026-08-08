/**
 * Behavioral spec for WasteService (Rule 22: every service needs a unit test).
 * Exercises the real business logic in the service layer (cost calculation,
 * partial-update DTO building, trend period-bucket mapping, and analysis
 * recommendation generation) by constructing the class directly with a
 * repository stub — no live DB required.
 */
import { WasteService } from '../../src/modules/remaining/waste.service';

describe('WasteService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);

  const makeRepoStub = () => ({
    getRecords: jest.fn().mockResolvedValue(Ok([])),
    createRecord: jest.fn().mockResolvedValue(Ok({ id: '1' })),
    updateRecord: jest.fn().mockResolvedValue(Ok({ id: '1' })),
    getDashboardStats: jest.fn().mockResolvedValue(Ok({
      todayR: {}, weekR: {}, monthR: {}, byType: [], topCauses: [], recyclable: {}, byMachine: [],
    })),
    getTrends: jest.fn().mockResolvedValue(Ok([])),
    getTargets: jest.fn().mockResolvedValue(Ok([])),
    createTarget: jest.fn().mockResolvedValue(Ok({ id: '1' })),
    getAnalysisData: jest.fn().mockResolvedValue(Ok({ byType: [], byMaterial: [], topCauses: [] })),
  });

  it('class is defined', () => {
    expect(WasteService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(WasteService.name).toBe('WasteService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new WasteService(makeRepoStub() as never);
    expect(svc).toBeInstanceOf(WasteService);
  });

  it('createRecord computes totalCost = quantity * costPerUnit and forwards it to the repo', async () => {
    const repoStub = makeRepoStub();
    const svc = new WasteService(repoStub as never);
    const res = await svc.createRecord({ quantity: '4.5', costPerUnit: '2', wasteType: 'trim' });
    expect(res.ok).toBe(true);
    expect(repoStub.createRecord).toHaveBeenCalledWith(
      { quantity: '4.5', costPerUnit: '2', wasteType: 'trim' },
      4.5,
      2,
      9,
    );
  });

  it('createRecord defaults missing quantity/costPerUnit to 0 (totalCost = 0)', async () => {
    const repoStub = makeRepoStub();
    const svc = new WasteService(repoStub as never);
    await svc.createRecord({ wasteType: 'defect' });
    expect(repoStub.createRecord).toHaveBeenCalledWith({ wasteType: 'defect' }, 0, 0, 0);
  });

  it('updateRecord only forwards fields present on the body (partial DTO)', async () => {
    const repoStub = makeRepoStub();
    const svc = new WasteService(repoStub as never);
    await svc.updateRecord('rec-1', { notes: 'checked' });
    expect(repoStub.updateRecord).toHaveBeenCalledWith('rec-1', { notes: 'checked' });
  });

  it('updateRecord coerces recycledQuantity to a safe number and includes correctionAction when provided', async () => {
    const repoStub = makeRepoStub();
    const svc = new WasteService(repoStub as never);
    await svc.updateRecord('rec-2', { recycledQuantity: '3.5', correctionAction: 'retrain operator' });
    expect(repoStub.updateRecord).toHaveBeenCalledWith('rec-2', {
      recycledQuantity: 3.5,
      correctionAction: 'retrain operator',
    });
  });

  it.each([
    ['week', 'week'],
    ['weekly', 'week'],
    ['month', 'month'],
    ['monthly', 'month'],
    ['day', 'day'],
    ['daily', 'day'],
    [undefined, 'day'],
  ])('getTrends maps period=%s to groupBy=%s', async (period, expectedGroupBy) => {
    const repoStub = makeRepoStub();
    const svc = new WasteService(repoStub as never);
    const q: Record<string, string> = { days: '14' };
    if (period !== undefined) q['period'] = period;
    const res = await svc.getTrends(q);
    expect(res.ok).toBe(true);
    expect(repoStub.getTrends).toHaveBeenCalledWith(expectedGroupBy, expect.any(String));
  });

  it('getTrends defaults to 30 days when "days" is missing/invalid', async () => {
    const repoStub = makeRepoStub();
    const svc = new WasteService(repoStub as never);
    await svc.getTrends({});
    const [, dateFromArg] = repoStub.getTrends.mock.calls[0] as [string, string];
    const expectedFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(dateFromArg).toBe(expectedFrom);
  });

  it('getAnalysis recommends the top waste-type label with translated name and quantity', async () => {
    const repoStub = makeRepoStub();
    repoStub.getAnalysisData.mockResolvedValue(Ok({
      byType: [{ waste_type: 'trim', total_quantity: 12.345 }],
      byMaterial: [],
      topCauses: [],
    }));
    const svc = new WasteService(repoStub as never);
    const res = await svc.getAnalysis();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { recommendations: string[] };
      expect(data.recommendations[0]).toContain('Kesish chiqindisi');
      expect(data.recommendations[0]).toContain('12.3 kg');
    }
  });

  it('getAnalysis falls back to the raw waste_type when no label mapping exists', async () => {
    const repoStub = makeRepoStub();
    repoStub.getAnalysisData.mockResolvedValue(Ok({
      byType: [{ waste_type: 'unknown_type', total_quantity: 5 }],
      byMaterial: [],
      topCauses: [],
    }));
    const svc = new WasteService(repoStub as never);
    const res = await svc.getAnalysis();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { recommendations: string[] };
      expect(data.recommendations[0]).toContain('unknown_type');
    }
  });

  it('getAnalysis adds a top-cause recommendation only when topCauses is non-empty', async () => {
    const repoStub = makeRepoStub();
    repoStub.getAnalysisData.mockResolvedValue(Ok({
      byType: [],
      byMaterial: [],
      topCauses: [{ cause: 'machine misalignment', record_count: 7 }],
    }));
    const svc = new WasteService(repoStub as never);
    const res = await svc.getAnalysis();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { recommendations: string[] };
      const causeRec = data.recommendations.find((r) => r.includes('machine misalignment'));
      expect(causeRec).toBeDefined();
      expect(causeRec).toContain('7');
    }
  });

  it('getAnalysis always appends the 3 static improvement recommendations', async () => {
    const repoStub = makeRepoStub();
    const svc = new WasteService(repoStub as never);
    const res = await svc.getAnalysis();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { recommendations: string[] };
      // no byType/topCauses supplied -> exactly the 3 static recommendations remain
      expect(data.recommendations).toHaveLength(3);
    }
  });

  it('getDashboard delegates to repo.getDashboardStats and reshapes the result', async () => {
    const repoStub = makeRepoStub();
    repoStub.getDashboardStats.mockResolvedValue(Ok({
      todayR: { total_quantity: 1 }, weekR: { total_quantity: 7 }, monthR: { total_quantity: 30 },
      byType: [{ waste_type: 'trim' }], topCauses: [], recyclable: {}, byMachine: [],
    }));
    const svc = new WasteService(repoStub as never);
    const res = await svc.getDashboard();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { today: { total_quantity: number }; week: { total_quantity: number } };
      expect(data.today.total_quantity).toBe(1);
      expect(data.week.total_quantity).toBe(7);
    }
    expect(repoStub.getDashboardStats).toHaveBeenCalled();
  });

  it('getTargets and createTarget delegate straight to the repo', async () => {
    const repoStub = makeRepoStub();
    const svc = new WasteService(repoStub as never);
    await svc.getTargets();
    expect(repoStub.getTargets).toHaveBeenCalled();
    await svc.createTarget({ wasteType: 'trim', targetQuantity: 10 });
    expect(repoStub.createTarget).toHaveBeenCalledWith({ wasteType: 'trim', targetQuantity: 10 });
  });
});
