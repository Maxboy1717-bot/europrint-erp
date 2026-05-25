/**
 * @module exception-log.spec
 * @description Unit tests for ExceptionLogController.
 */

import { Test } from '@nestjs/testing';
import { ExceptionLogController } from '../../src/modules/remaining/exception-log.controller';
import { ExceptionLogService } from '../../src/modules/remaining/exception-log.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 7, role: 'admin' };

describe('ExceptionLogController', () => {
  let ctrl: ExceptionLogController;
  let svc: jest.Mocked<Partial<ExceptionLogService>>;

  beforeEach(async () => {
    svc = {
      getAll: jest.fn(), getStats: jest.fn(), getOne: jest.fn(),
      create: jest.fn(), advanceBypass: jest.fn(), statusForce: jest.fn(),
      designReject: jest.fn(), advanceBlock: jest.fn(),
      materialShortage: jest.fn(), machineBreakdown: jest.fn(),
      qcFailed: jest.fn(), deliveryFailed: jest.fn(),
      employeeAbsent: jest.fn(), materialNotReturned: jest.fn(),
      update: jest.fn(), deleteOne: jest.fn(), certExpiryCheck: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [ExceptionLogController],
      providers: [{ provide: ExceptionLogService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .compile();
    ctrl = mod.get(ExceptionLogController);
  });

  it('getAll forwards query filters', async () => {
    (svc.getAll as jest.Mock).mockResolvedValue(ok([{ id: 'e1' }]));
    await ctrl.getAll({ severity: 'high' });
    expect(svc.getAll).toHaveBeenCalledWith({ severity: 'high' });
  });

  it('getStats returns service data', async () => {
    (svc.getStats as jest.Mock).mockResolvedValue(ok({ total: 10 }));
    expect(await ctrl.getStats()).toEqual({ total: 10 });
  });

  it('getOne throws on service error', async () => {
    (svc.getOne as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getOne('e1')).rejects.toThrow(InternalServerErrorException);
  });

  it('create passes user id to service', async () => {
    (svc.create as jest.Mock).mockResolvedValue(ok({ id: 'e2' }));
    await ctrl.create({ type: 'qc', orderId: 'o1' } as never, USER);
    expect(svc.create).toHaveBeenCalledWith({ type: 'qc', orderId: 'o1' }, 7);
  });

  it('advanceBypass forwards body and user id', async () => {
    (svc.advanceBypass as jest.Mock).mockResolvedValue(ok({ id: 'e3' }));
    await ctrl.advanceBypass({ reason: 'r' } as never, USER);
    expect(svc.advanceBypass).toHaveBeenCalledWith({ reason: 'r' }, 7);
  });

  it('qcFailed routes through qcFailed service method', async () => {
    (svc.qcFailed as jest.Mock).mockResolvedValue(ok({ id: 'e4' }));
    await ctrl.qcFailed({ type: 'qc-failed' } as never, USER);
    expect(svc.qcFailed).toHaveBeenCalledWith({ type: 'qc-failed' }, 7);
  });

  it('update forwards body to service', async () => {
    (svc.update as jest.Mock).mockResolvedValue(ok({ id: 'e1', resolved: true }));
    await ctrl.update('e1', { resolved: true }, USER);
    expect(svc.update).toHaveBeenCalledWith('e1', { resolved: true });
  });

  it('deleteOne returns service payload', async () => {
    (svc.deleteOne as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    expect(await ctrl.deleteOne('e1')).toEqual({ deleted: true });
  });

  it('certExpiryCheck invokes service', async () => {
    (svc.certExpiryCheck as jest.Mock).mockResolvedValue(ok({ expired: 0 }));
    expect(await ctrl.certExpiryCheck()).toEqual({ expired: 0 });
  });

  it('machineBreakdown forwards payload and user id', async () => {
    (svc.machineBreakdown as jest.Mock).mockResolvedValue(ok({ id: 'm1' }));
    await ctrl.machineBreakdown({ machineId: 'm1' } as never, USER);
    expect(svc.machineBreakdown).toHaveBeenCalledWith({ machineId: 'm1' }, 7);
  });
});
