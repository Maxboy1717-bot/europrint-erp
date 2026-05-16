/**
 * @module general-legacy-a.spec
 * @description Unit tests for GeneralLegacyAController.
 */

import { Test } from '@nestjs/testing';
import { GeneralLegacyAController } from '../../src/modules/legacy/controllers/general-legacy-a.controller';
import { LegacyService } from '../../src/modules/legacy/services/legacy.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('GeneralLegacyAController', () => {
  let ctrl: GeneralLegacyAController;
  let svc: jest.Mocked<Partial<LegacyService>>;

  beforeEach(async () => {
    svc = {
      getFaceEmbeddings: jest.fn(), deleteFaceEmbedding: jest.fn(),
      getAttendance: jest.fn(), getMyAttendance: jest.fn(),
      getZoneLogs: jest.fn(), getAttendanceStats: jest.fn(),
      getPapkaOrders: jest.fn(), createPapkaOrder: jest.fn(),
      updatePapkaOrder: jest.fn(), getMachineTasks: jest.fn(),
      createMachineTask: jest.fn(), getPlanningOperations: jest.fn(),
      createPlanningOperation: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [GeneralLegacyAController],
      providers: [{ provide: LegacyService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(GeneralLegacyAController);
  });

  it('getFaceEmbeddings returns service data', async () => {
    (svc.getFaceEmbeddings as jest.Mock).mockResolvedValue(ok([{ id: 'f1' }]));
    expect(await ctrl.getFaceEmbeddings()).toEqual([{ id: 'f1' }]);
  });

  it('getFaceEmbeddings throws 500 on error', async () => {
    (svc.getFaceEmbeddings as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getFaceEmbeddings()).rejects.toThrow(InternalServerErrorException);
  });

  it('deleteFaceEmbedding returns id payload', async () => {
    (svc.deleteFaceEmbedding as jest.Mock).mockResolvedValue(undefined);
    expect(await ctrl.deleteFaceEmbedding('f1')).toEqual({ id: 'f1' });
  });

  it('getAttendance returns service data', async () => {
    (svc.getAttendance as jest.Mock).mockResolvedValue(ok([{ id: 'a1' }]));
    expect(await ctrl.getAttendance({})).toEqual([{ id: 'a1' }]);
  });

  it('getMyAttendance forwards employee id', async () => {
    (svc.getMyAttendance as jest.Mock).mockResolvedValue(ok([{ id: 'a1' }]));
    await ctrl.getMyAttendance('e1');
    expect(svc.getMyAttendance).toHaveBeenCalledWith('e1');
  });

  it('createPapkaOrder forwards normalized payload', async () => {
    (svc.createPapkaOrder as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = await ctrl.createPapkaOrder({ order_id: 1, mahsulot_nomi: 'Karton', quantity: 5 } as never);
    expect(svc.createPapkaOrder).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 1, mahsulot_nomi: 'Karton', quantity: 5,
    }));
    expect(res).toEqual({ id: 'p1' });
  });

  it('createPapkaOrder falls back to body+id on service throw', async () => {
    (svc.createPapkaOrder as jest.Mock).mockRejectedValue(new Error('boom'));
    const body = { order_id: 1, mahsulot_nomi: 'X', quantity: 1 };
    const res = await ctrl.createPapkaOrder(body as never);
    expect(res).toMatchObject({ order_id: 1, mahsulot_nomi: 'X', quantity: 1 });
    expect(res).toHaveProperty('id');
  });

  it('deletePapkaOrder returns stub response', async () => {
    expect(await ctrl.deletePapkaOrder('p1')).toEqual({ id: 'p1', deleted: true });
  });

  it('updatePapkaOrder returns body when no fields change', async () => {
    const body = {};
    expect(await ctrl.updatePapkaOrder('p1', body as never)).toBe(body);
  });

  it('updatePapkaOrder forwards parsed updates', async () => {
    (svc.updatePapkaOrder as jest.Mock).mockResolvedValue({ id: 'p1' });
    await ctrl.updatePapkaOrder('p1', { status: 'done', quantity: 5 } as never);
    expect(svc.updatePapkaOrder).toHaveBeenCalledWith('p1', expect.objectContaining({ status: 'done', quantity: 5 }));
  });

  it('uploadFile returns stub response', async () => {
    const res = await ctrl.uploadFile({} as never);
    expect(res).toEqual({ url: '', filename: '', message: 'Fayl yuklandi' });
  });

  it('logClientError returns received:true', async () => {
    expect(await ctrl.logClientError({} as never)).toEqual({ received: true });
  });
});
