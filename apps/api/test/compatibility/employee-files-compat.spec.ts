/**
 * @module employee-files-compat.spec
 * @description Unit tests for EmployeeFilesCompatController.
 */

import { Test } from '@nestjs/testing';
import { EmployeeFilesCompatController } from '../../src/modules/compatibility/employee-files-compat.controller';
import { EmployeeFilesCompatService } from '../../src/modules/compatibility/employee-files-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code: string, message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 1, role: 'admin' };

describe('EmployeeFilesCompatController', () => {
  let ctrl: EmployeeFilesCompatController;
  let svc: jest.Mocked<Partial<EmployeeFilesCompatService>>;

  beforeEach(async () => {
    svc = {
      listFiles: jest.fn(), createFile: jest.fn(),
      getFile: jest.fn(), updateFile: jest.fn(), deleteFile: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [EmployeeFilesCompatController],
      providers: [{ provide: EmployeeFilesCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(EmployeeFilesCompatController);
  });

  it('listFiles forwards filter params', async () => {
    (svc.listFiles as jest.Mock).mockResolvedValue(ok([{ id: 'f1' }]));
    await ctrl.listFiles('e1', 'contract');
    expect(svc.listFiles).toHaveBeenCalledWith('e1', 'contract');
  });

  it('listFiles returns files', async () => {
    (svc.listFiles as jest.Mock).mockResolvedValue(ok([{ id: 'f1', name: 'cv.pdf' }]));
    expect(await ctrl.listFiles()).toEqual([{ id: 'f1', name: 'cv.pdf' }]);
  });

  it('createFile passes user id to service', async () => {
    (svc.createFile as jest.Mock).mockResolvedValue(ok({ id: 'f2' }));
    await ctrl.createFile({ name: 'x' }, USER);
    expect(svc.createFile).toHaveBeenCalledWith({ name: 'x' }, 1);
  });

  it('getFile throws NotFound on NOT_FOUND', async () => {
    (svc.getFile as jest.Mock).mockResolvedValue(err('NOT_FOUND', 'missing'));
    await expect(ctrl.getFile('f99')).rejects.toThrow(NotFoundException);
  });

  it('updateFile applies partial update', async () => {
    (svc.updateFile as jest.Mock).mockResolvedValue(ok({ id: 'f1', name: 'new' }));
    expect(await ctrl.updateFile('f1', { name: 'new' })).toEqual({ id: 'f1', name: 'new' });
  });

  it('deleteFile returns service payload', async () => {
    (svc.deleteFile as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteFile('f1')).toEqual({ deleted: true });
  });

  it('createFile maps VALIDATION error to BadRequest', async () => {
    (svc.createFile as jest.Mock).mockResolvedValue(err('VALIDATION', 'bad'));
    await expect(ctrl.createFile({}, USER)).rejects.toThrow(BadRequestException);
  });
});
