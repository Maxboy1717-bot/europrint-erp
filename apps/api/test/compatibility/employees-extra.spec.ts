/**
 * @module employees-extra.spec
 * @description Unit tests for EmployeesExtraController.
 */

import { Test } from '@nestjs/testing';
import { EmployeesExtraController } from '../../src/modules/compatibility/employees-extra.controller';
import { EmployeesCompatService } from '../../src/modules/compatibility/employees-compat.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 9, role: 'admin' };

describe('EmployeesExtraController', () => {
  let ctrl: EmployeesExtraController;
  let svc: jest.Mocked<Partial<EmployeesCompatService>>;

  beforeEach(async () => {
    svc = { updateEmployee: jest.fn(), updateProfileImage: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [EmployeesExtraController],
      providers: [{ provide: EmployeesCompatService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(EmployeesExtraController);
  });

  it('patchEmployee delegates to updateEmployee', async () => {
    (svc.updateEmployee as jest.Mock).mockResolvedValue(ok({ id: 'e1', name: 'X' }));
    expect(await ctrl.patchEmployee('e1', { name: 'X' })).toEqual({ id: 'e1', name: 'X' });
  });

  it('patchEmployee throws on service error', async () => {
    (svc.updateEmployee as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.patchEmployee('e1', { name: 'X' })).rejects.toThrow(InternalServerErrorException);
  });

  it('uploadProfileImage forwards url and user id', async () => {
    (svc.updateProfileImage as jest.Mock).mockResolvedValue(ok({ url: 'u' }));
    await ctrl.uploadProfileImage('e1', { url: 'u' }, USER);
    expect(svc.updateProfileImage).toHaveBeenCalledWith('e1', 'u', 9);
  });

  it('signCorporateInventory returns signed:true stub', () => {
    expect(ctrl.signCorporateInventory('e1', 'i1')).toEqual({ signed: true });
  });

  it('returnCorporateInventory returns returned:true stub', () => {
    expect(ctrl.returnCorporateInventory('e1', 'i1')).toEqual({ returned: true });
  });

  it('uploadProfileImage throws on service error', async () => {
    (svc.updateProfileImage as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.uploadProfileImage('e1', { url: 'u' }, USER)).rejects.toThrow(InternalServerErrorException);
  });
});
