/**
 * @module order-status.spec
 * @description Unit tests for OrderStatusController.
 */

import { Test } from '@nestjs/testing';
import { OrderStatusController } from '../../src/modules/remaining/order-status.controller';
import { OrderStatusService, STATUS_TRANSITIONS } from '../../src/modules/remaining/order-status.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };
const USER = { id: 8, role: 'manager' };

describe('OrderStatusController', () => {
  let ctrl: OrderStatusController;
  let svc: jest.Mocked<Partial<OrderStatusService>>;

  beforeEach(async () => {
    svc = {
      getStatusChain: jest.fn(), getStatusLog: jest.fn(), transition: jest.fn(),
      designApproved: jest.fn(), techApproved: jest.fn(), advanceReceived: jest.fn(),
      qcResult: jest.fn(), mesComplete: jest.fn(), deliveryFailed: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [OrderStatusController],
      providers: [{ provide: OrderStatusService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .compile();
    ctrl = mod.get(OrderStatusController);
  });

  it('getStatusChain returns chain data', () => {
    (svc.getStatusChain as jest.Mock).mockReturnValue(ok(['draft', 'in_progress', 'done']));
    expect(ctrl.getStatusChain()).toEqual(['draft', 'in_progress', 'done']);
  });

  it('getTransitions returns STATUS_TRANSITIONS constant', () => {
    expect(ctrl.getTransitions()).toBe(STATUS_TRANSITIONS);
  });

  it('getStatusLog returns log for order', async () => {
    (svc.getStatusLog as jest.Mock).mockResolvedValue(ok([{ id: 'l1', status: 'draft' }]));
    expect(await ctrl.getStatusLog('o1')).toEqual([{ id: 'l1', status: 'draft' }]);
  });

  it('getStatusLog throws NotFound when order missing', async () => {
    (svc.getStatusLog as jest.Mock).mockResolvedValue(err('NOT_FOUND'));
    await expect(ctrl.getStatusLog('o99')).rejects.toThrow(NotFoundException);
  });

  it('transition forwards body and user id', async () => {
    (svc.transition as jest.Mock).mockResolvedValue(ok({ orderId: 'o1', status: 'next' }));
    await ctrl.transition('o1', { to: 'next' }, USER);
    expect(svc.transition).toHaveBeenCalledWith('o1', { to: 'next' }, 8);
  });

  it('designApproved forwards order id and user', async () => {
    (svc.designApproved as jest.Mock).mockResolvedValue(ok({ ok: true }));
    await ctrl.designApproved('o1', USER);
    expect(svc.designApproved).toHaveBeenCalledWith('o1', 8);
  });

  it('techApproved forwards order id only', async () => {
    (svc.techApproved as jest.Mock).mockResolvedValue(ok({ ok: true }));
    await ctrl.techApproved('o1');
    expect(svc.techApproved).toHaveBeenCalledWith('o1');
  });

  it('qcResult forwards body to service', async () => {
    (svc.qcResult as jest.Mock).mockResolvedValue(ok({ passed: true }));
    await ctrl.qcResult('o1', { passed: true });
    expect(svc.qcResult).toHaveBeenCalledWith('o1', { passed: true });
  });

  it('deliveryFailed throws InternalServerError on service error', async () => {
    (svc.deliveryFailed as jest.Mock).mockResolvedValue(err('DB_ERROR'));
    await expect(ctrl.deliveryFailed('o1')).rejects.toThrow(InternalServerErrorException);
  });

  it('getMachineBreakdown returns stub shape', () => {
    expect(ctrl.getMachineBreakdown('o1')).toEqual({ orderId: 'o1', breakdown: null, machineId: null });
  });
});
