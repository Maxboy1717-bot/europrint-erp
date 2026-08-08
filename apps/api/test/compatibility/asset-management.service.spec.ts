/**
 * Smoke spec for AssetManagementService (Rule 22: every service needs a unit test).
 *
 * The service depends on AssetManagementRepo. We provide a minimal stub that
 * returns successful `Result` values so the service paths execute without DB.
 */
import { AssetManagementService } from '../../src/modules/compatibility/asset-management.service';

describe('AssetManagementService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    findAllAssets:      jest.fn().mockResolvedValue(Ok([])),
    insertAsset:        jest.fn().mockResolvedValue(Ok(undefined)),
    findAllMaintenance: jest.fn().mockResolvedValue(Ok([])),
    findAllDisposals:   jest.fn().mockResolvedValue(Ok([])),
    findAllTransfers:   jest.fn().mockResolvedValue(Ok([])),
    depreciateAsset:    jest.fn(),
  };
  // F8 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): depreciateAsset() now posts to GL.
  const glPostingStub = { postJournal: jest.fn().mockResolvedValue(Ok(1)) };

  it('class is defined', () => {
    expect(AssetManagementService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(AssetManagementService.name).toBe('AssetManagementService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new AssetManagementService(repoStub as never, glPostingStub as never);
    expect(svc).toBeInstanceOf(AssetManagementService);
  });

  it('exposes async getAssets returning Result with ok=true on stub data', async () => {
    const svc = new AssetManagementService(repoStub as never, glPostingStub as never);
    expect(typeof svc.getAssets).toBe('function');
    const res = await svc.getAssets();
    expect(res.ok).toBe(true);
    expect(Array.isArray((res as { data: unknown[] }).data)).toBe(true);
  });

  describe('depreciateAsset() — F8 GL posting', () => {
    beforeEach(() => {
      repoStub.depreciateAsset.mockReset();
      glPostingStub.postJournal.mockReset().mockResolvedValue(Ok(1));
    });

    it('posts Dr 9430 (Amortizatsiya) / Cr 0200 (accumulated) when monthlyDepreciation > 0', async () => {
      repoStub.depreciateAsset.mockResolvedValue(Ok([{ id: 5, currentValue: 900, accumulatedDepreciation: 100, monthlyDepreciation: 100 }]));
      const svc = new AssetManagementService(repoStub as never, glPostingStub as never);

      const r = await svc.depreciateAsset('5');

      expect(r.ok).toBe(true);
      expect(glPostingStub.postJournal).toHaveBeenCalledWith(
        [
          { accountCode: '9430', accountName: expect.any(String), debit: 100, credit: 0 },
          { accountCode: '0200', accountName: expect.any(String), debit: 0, credit: 100 },
        ],
        expect.stringMatching(/^DEP-5-\d{4}-\d{2}$/),
      );
    });

    it('does not call the GL engine when monthlyDepreciation is 0 (fully depreciated / no useful_life)', async () => {
      repoStub.depreciateAsset.mockResolvedValue(Ok([{ id: 6, currentValue: 0, accumulatedDepreciation: 500, monthlyDepreciation: 0 }]));
      const svc = new AssetManagementService(repoStub as never, glPostingStub as never);

      const r = await svc.depreciateAsset('6');

      expect(r.ok).toBe(true);
      expect(glPostingStub.postJournal).not.toHaveBeenCalled();
    });

    it('still returns Ok(asset row) even when the GL post fails (best-effort, matches AutoGlPostingService pattern)', async () => {
      repoStub.depreciateAsset.mockResolvedValue(Ok([{ id: 7, currentValue: 200, accumulatedDepreciation: 300, monthlyDepreciation: 50 }]));
      glPostingStub.postJournal.mockResolvedValueOnce({ ok: false, error: { message: 'davr yopilgan' } });
      const svc = new AssetManagementService(repoStub as never, glPostingStub as never);

      const r = await svc.depreciateAsset('7');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data['id']).toBe(7);
    });
  });
});
