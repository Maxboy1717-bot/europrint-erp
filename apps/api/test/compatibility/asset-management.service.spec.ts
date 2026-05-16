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
  };

  it('class is defined', () => {
    expect(AssetManagementService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(AssetManagementService.name).toBe('AssetManagementService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new AssetManagementService(repoStub as never);
    expect(svc).toBeInstanceOf(AssetManagementService);
  });

  it('exposes async getAssets returning Result with ok=true on stub data', async () => {
    const svc = new AssetManagementService(repoStub as never);
    expect(typeof svc.getAssets).toBe('function');
    const res = await svc.getAssets();
    expect(res.ok).toBe(true);
    expect(Array.isArray((res as { data: unknown[] }).data)).toBe(true);
  });
});
