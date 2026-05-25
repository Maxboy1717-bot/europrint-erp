/**
 * @module settings-admin.spec
 * @description Unit tests for SettingsAdminController.
 */

import { Test } from '@nestjs/testing';
import { SettingsAdminController } from '../../src/modules/compatibility/settings-admin.controller';
import { SettingsAdminService } from '../../src/modules/compatibility/settings-admin.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code: string, message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('SettingsAdminController', () => {
  let ctrl: SettingsAdminController;
  let svc: jest.Mocked<Partial<SettingsAdminService>>;

  beforeEach(async () => {
    svc = {
      getGuidelines: jest.fn(), createGuideline: jest.fn(),
      updateGuideline: jest.fn(), deleteGuideline: jest.fn(),
      getContactSettings: jest.fn(), updateContactSettings: jest.fn(),
      getSystemSettings: jest.fn(), updateSystemSettings: jest.fn(),
      getFilters: jest.fn(), createFilter: jest.fn(),
      updateFilter: jest.fn(), deleteFilter: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [SettingsAdminController],
      providers: [{ provide: SettingsAdminService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(SettingsAdminController);
  });

  it('getGuidelines returns service data', async () => {
    (svc.getGuidelines as jest.Mock).mockResolvedValue(ok([{ id: 'g1' }]));
    expect(await ctrl.getGuidelines()).toEqual([{ id: 'g1' }]);
  });

  it('createGuideline validates title and content', async () => {
    await expect(ctrl.createGuideline({ title: '' })).rejects.toThrow();
  });

  it('createGuideline forwards parsed dto', async () => {
    (svc.createGuideline as jest.Mock).mockResolvedValue(ok({ id: 'g2' }));
    await ctrl.createGuideline({ title: 'T', content: 'C' });
    expect(svc.createGuideline).toHaveBeenCalledWith(expect.objectContaining({ title: 'T', content: 'C' }));
  });

  it('updateGuideline throws NotFound on error', async () => {
    (svc.updateGuideline as jest.Mock).mockResolvedValue(err('NOT_FOUND'));
    await expect(ctrl.updateGuideline('g1', { title: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('deleteGuideline returns service payload', async () => {
    (svc.deleteGuideline as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteGuideline('g1')).toEqual({ deleted: true });
  });

  it('updateContactSettings validates email format', async () => {
    await expect(ctrl.updateContactSettings({ email: 'not-an-email' })).rejects.toThrow();
  });

  it('updateContactSettings accepts valid optional fields', async () => {
    (svc.updateContactSettings as jest.Mock).mockResolvedValue(ok({ ok: true }));
    await ctrl.updateContactSettings({ email: 'a@b.com', phone: '+998' });
    expect(svc.updateContactSettings).toHaveBeenCalledWith({ email: 'a@b.com', phone: '+998' });
  });

  it('updateSystemSettings rejects invalid logoUrl', async () => {
    await expect(ctrl.updateSystemSettings({ logoUrl: 'not-a-url' })).rejects.toThrow();
  });

  it('createFilter forwards valid dto', async () => {
    (svc.createFilter as jest.Mock).mockResolvedValue(ok({ id: 'f1' }));
    await ctrl.createFilter({ name: 'F1' });
    expect(svc.createFilter).toHaveBeenCalledWith(expect.objectContaining({ name: 'F1', filterType: 'general' }));
  });

  it('deleteFilter throws NotFound on error', async () => {
    (svc.deleteFilter as jest.Mock).mockResolvedValue(err('NOT_FOUND'));
    await expect(ctrl.deleteFilter('f1')).rejects.toThrow(NotFoundException);
  });
});
