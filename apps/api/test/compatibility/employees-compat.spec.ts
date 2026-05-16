/**
 * @module employees-compat.spec
 * @description Unit tests for EmployeesCompatController.
 */

import { Test } from '@nestjs/testing';
import { EmployeesCompatController } from '../../src/modules/compatibility/employees-compat.controller';
import { EmployeesCompatService } from '../../src/modules/compatibility/employees-compat.service';
import { EmployeesCompatSubService } from '../../src/modules/compatibility/employees-compat-sub.service';
import { EmployeesListExtendedService } from '../../src/modules/compatibility/employees-list-extended.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 1, role: 'admin' };

describe('EmployeesCompatController', () => {
  let ctrl: EmployeesCompatController;
  let svc: jest.Mocked<Partial<EmployeesCompatService>>;
  let subSvc: jest.Mocked<Partial<EmployeesCompatSubService>>;
  let ext: jest.Mocked<Partial<EmployeesListExtendedService>>;

  beforeEach(async () => {
    svc = {
      createEmployee: jest.fn(), getEmployeesForFace: jest.fn(),
      getEmployee: jest.fn(), updateEmployee: jest.fn(), deleteEmployee: jest.fn(),
      updateProfileImage: jest.fn(), assignOrgFunctions: jest.fn(),
      getEmployeeOrgDepartments: jest.fn(),
    };
    subSvc = { importEmployees: jest.fn() };
    ext = { listExtended: jest.fn(), countExtended: jest.fn(), getById: jest.fn() };

    const mod = await Test.createTestingModule({
      controllers: [EmployeesCompatController],
      providers: [
        { provide: EmployeesCompatService, useValue: svc },
        { provide: EmployeesCompatSubService, useValue: subSvc },
        { provide: EmployeesListExtendedService, useValue: ext },
      ],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(EmployeesCompatController);
  });

  it('listEmployees returns items+total from extended service', async () => {
    (ext.listExtended as jest.Mock).mockResolvedValue(ok([{ id: 'e1' }]));
    (ext.countExtended as jest.Mock).mockResolvedValue(ok(1));
    expect(await ctrl.listEmployees()).toEqual({ items: [{ id: 'e1' }], total: 1 });
  });

  it('listEmployees safely defaults to empty list and zero on error', async () => {
    (ext.listExtended as jest.Mock).mockResolvedValue(err());
    (ext.countExtended as jest.Mock).mockResolvedValue(err());
    expect(await ctrl.listEmployees()).toEqual({ items: [], total: 0 });
  });

  it('createEmployee delegates to service', async () => {
    (svc.createEmployee as jest.Mock).mockResolvedValue(ok({ id: 'e2' }));
    expect(await ctrl.createEmployee({ name: 'Ali' })).toEqual({ id: 'e2' });
  });

  it('importEmployees forwards employees array', async () => {
    (subSvc.importEmployees as jest.Mock).mockResolvedValue(ok({ count: 2 }));
    await ctrl.importEmployees({ employees: [{ name: 'A' }, { name: 'B' }] } as never);
    expect(subSvc.importEmployees).toHaveBeenCalledWith([{ name: 'A' }, { name: 'B' }]);
  });

  it('getEmployee prefers extended service hit when available', async () => {
    (ext.getById as jest.Mock).mockResolvedValue(ok({ id: 'e1', name: 'X' }));
    expect(await ctrl.getEmployee('e1')).toEqual({ id: 'e1', name: 'X' });
  });

  it('getEmployee falls back to base service when extended returns no data', async () => {
    (ext.getById as jest.Mock).mockResolvedValue(ok(null));
    (svc.getEmployee as jest.Mock).mockResolvedValue(ok({ id: 'e1', name: 'Y' }));
    expect(await ctrl.getEmployee('e1')).toEqual({ id: 'e1', name: 'Y' });
  });

  it('updateEmployee forwards body', async () => {
    (svc.updateEmployee as jest.Mock).mockResolvedValue(ok({ id: 'e1' }));
    await ctrl.updateEmployee('e1', { name: 'Z' });
    expect(svc.updateEmployee).toHaveBeenCalledWith('e1', { name: 'Z' });
  });

  it('deleteEmployee returns service payload', async () => {
    (svc.deleteEmployee as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteEmployee('e1')).toEqual({ deleted: true });
  });

  it('updateProfileImage passes url and user id', async () => {
    (svc.updateProfileImage as jest.Mock).mockResolvedValue(ok({ url: 'u' }));
    await ctrl.updateProfileImage('e1', { url: 'u' }, USER);
    expect(svc.updateProfileImage).toHaveBeenCalledWith('e1', 'u', 1);
  });

  it('assignOrgFunctions delegates to service', async () => {
    (svc.assignOrgFunctions as jest.Mock).mockResolvedValue(ok({ ok: true }));
    await ctrl.assignOrgFunctions('e1', { departmentIds: [1, 2] });
    expect(svc.assignOrgFunctions).toHaveBeenCalledWith('e1', { departmentIds: [1, 2] });
  });

  it('getOrgDepartments throws on service error', async () => {
    (svc.getEmployeeOrgDepartments as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getOrgDepartments('e1')).rejects.toThrow(InternalServerErrorException);
  });
});
