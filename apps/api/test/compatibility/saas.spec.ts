/**
 * @module saas.spec
 * @description Unit tests for SaasController.
 */

import { Test } from '@nestjs/testing';
import { SaasController } from '../../src/modules/compatibility/saas.controller';
import { SaasService } from '../../src/modules/compatibility/saas.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('SaasController', () => {
  let ctrl: SaasController;
  let svc: jest.Mocked<Partial<SaasService>>;

  beforeEach(async () => {
    svc = {
      getTenants: jest.fn(), createTenant: jest.fn(), getPlatformStats: jest.fn(),
      getErrorLogs: jest.fn(), updateTenantStatus: jest.fn(), getModules: jest.fn(),
      getExpiryAlerts: jest.fn(), getTenantById: jest.fn(),
      updateTenant: jest.fn(), deleteTenant: jest.fn(),
      // onboardTenant is now a real service method (no longer calls notImplemented)
      onboardTenant: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [SaasController],
      providers: [{ provide: SaasService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(SaasController);
  });

  it('getTenants returns tenant list', async () => {
    (svc.getTenants as jest.Mock).mockResolvedValue(ok([{ id: 't1' }]));
    expect(await ctrl.getTenants()).toEqual([{ id: 't1' }]);
  });

  it('createTenant validates required name', async () => {
    await expect(ctrl.createTenant({})).rejects.toThrow();
  });

  it('createTenant uses defaults for plan and employeeLimit', async () => {
    (svc.createTenant as jest.Mock).mockResolvedValue(ok({ id: 't2' }));
    await ctrl.createTenant({ name: 'Acme' });
    expect(svc.createTenant).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Acme', plan: 'basic', employeeLimit: 50,
    }));
  });

  it('updateTenantStatus validates allowed statuses', async () => {
    await expect(ctrl.updateTenantStatus('t1', { status: 'invalid' })).rejects.toThrow();
  });

  it('updateTenantStatus forwards valid status', async () => {
    (svc.updateTenantStatus as jest.Mock).mockResolvedValue(ok({ id: 't1', status: 'active' }));
    await ctrl.updateTenantStatus('t1', { status: 'active' });
    expect(svc.updateTenantStatus).toHaveBeenCalledWith('t1', 'active');
  });

  it('getTenantById throws NotFound when service errs', async () => {
    (svc.getTenantById as jest.Mock).mockResolvedValue(err('NOT_FOUND'));
    await expect(ctrl.getTenantById('t99')).rejects.toThrow(NotFoundException);
  });

  it('getPlatformStats throws on service error', async () => {
    (svc.getPlatformStats as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getPlatformStats()).rejects.toThrow(InternalServerErrorException);
  });

  it('deleteTenant returns service payload', async () => {
    (svc.deleteTenant as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteTenant('t1')).toEqual({ deleted: true });
  });

  it('updateTenant accepts partial body', async () => {
    (svc.updateTenant as jest.Mock).mockResolvedValue(ok({ id: 't1', name: 'X' }));
    expect(await ctrl.updateTenant('t1', { name: 'X' })).toEqual({ id: 't1', name: 'X' });
  });

  it('onboardTenant returns service payload when service resolves Ok', async () => {
    // SaasService.onboardTenant is now implemented (activates tenant + sets modules).
    // The controller delegates to the service; on success it unwraps the result.
    const payload = { tenantId: 't1', status: 'active', modules: [] };
    (svc.onboardTenant as jest.Mock).mockResolvedValue(ok(payload));
    const result = await ctrl.onboardTenant('t1', { plan: 'pro' });
    expect(svc.onboardTenant).toHaveBeenCalledWith('t1', expect.objectContaining({}));
    expect(result).toEqual(payload);
  });
});
