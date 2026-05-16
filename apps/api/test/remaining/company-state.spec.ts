/**
 * @module company-state.spec
 * @description Unit tests for CompanyStateController.
 */

import { Test } from '@nestjs/testing';
import { CompanyStateController } from '../../src/modules/remaining/company-state.controller';
import { CompanyStateService } from '../../src/modules/remaining/company-state.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code: string, message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('CompanyStateController', () => {
  let ctrl: CompanyStateController;
  let svc: jest.Mocked<Partial<CompanyStateService>>;

  beforeEach(async () => {
    svc = { getCurrent: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [CompanyStateController],
      providers: [{ provide: CompanyStateService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(CompanyStateController);
  });

  it('getCurrent returns service payload', async () => {
    (svc.getCurrent as jest.Mock).mockResolvedValue(ok({ revenue: 5000 }));
    expect(await ctrl.getCurrent()).toEqual({ revenue: 5000 });
  });

  it('getCurrent throws 500 on DB_ERROR', async () => {
    (svc.getCurrent as jest.Mock).mockResolvedValue(err('DB_ERROR'));
    await expect(ctrl.getCurrent()).rejects.toThrow(InternalServerErrorException);
  });

  it('getCurrent throws NotFound on NOT_FOUND', async () => {
    (svc.getCurrent as jest.Mock).mockResolvedValue(err('NOT_FOUND'));
    await expect(ctrl.getCurrent()).rejects.toThrow(NotFoundException);
  });

  it('getCurrent throws BadRequest on VALIDATION', async () => {
    (svc.getCurrent as jest.Mock).mockResolvedValue(err('VALIDATION'));
    await expect(ctrl.getCurrent()).rejects.toThrow(BadRequestException);
  });

  it('getCurrent invokes service exactly once', async () => {
    (svc.getCurrent as jest.Mock).mockResolvedValue(ok({}));
    await ctrl.getCurrent();
    expect(svc.getCurrent).toHaveBeenCalledTimes(1);
  });
});
