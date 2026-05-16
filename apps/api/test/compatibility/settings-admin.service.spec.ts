/**
 * Smoke spec for SettingsAdminService (Rule 22: every service needs a unit test).
 */
import { SettingsAdminService } from '../../src/modules/compatibility/settings-admin.service';

describe('SettingsAdminService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    findAllGuidelines:  jest.fn().mockResolvedValue(Ok([])),
    insertGuideline:    jest.fn().mockResolvedValue(Ok([{ id: '1', title: 't' }])),
    updateGuideline:    jest.fn().mockResolvedValue(Ok([{ id: '1', title: 't2' }])),
    deleteGuideline:    jest.fn().mockResolvedValue(Ok([{ id: '1' }])),
    getContactSettings: jest.fn().mockResolvedValue(Ok({})),
  };

  it('class is defined', () => {
    expect(SettingsAdminService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(SettingsAdminService.name).toBe('SettingsAdminService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new SettingsAdminService(repoStub as never);
    expect(svc).toBeInstanceOf(SettingsAdminService);
  });

  it('getGuidelines returns an empty array via stub', async () => {
    const svc = new SettingsAdminService(repoStub as never);
    const res = await svc.getGuidelines();
    expect(res.ok).toBe(true);
    if (res.ok) expect(Array.isArray(res.data)).toBe(true);
  });

  it('createGuideline delegates to repo.insertGuideline', async () => {
    const svc = new SettingsAdminService(repoStub as never);
    const res = await svc.createGuideline({ title: 't', content: 'c', category: 'cat', isActive: true });
    expect(res.ok).toBe(true);
    expect(repoStub.insertGuideline).toHaveBeenCalled();
  });
});
