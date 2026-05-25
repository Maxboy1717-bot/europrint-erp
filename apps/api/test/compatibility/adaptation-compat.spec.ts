/**
 * @module adaptation-compat.spec
 * @description Unit tests for AdaptationCompatController.
 */

import { Test } from '@nestjs/testing';
import { AdaptationCompatController } from '../../src/modules/compatibility/adaptation-compat.controller';
import { AdaptationCompatService } from '../../src/modules/compatibility/adaptation-compat.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });

describe('AdaptationCompatController', () => {
  let ctrl: AdaptationCompatController;
  let svc: jest.Mocked<Partial<AdaptationCompatService>>;

  beforeEach(async () => {
    svc = {
      createProgram: jest.fn(),
      getProgram: jest.fn(),
      updateProgram: jest.fn(),
      deleteProgram: jest.fn(),
      getNewEmployees: jest.fn(),
      getFeedback: jest.fn(),
      createFeedback: jest.fn(),
      getFeedbackById: jest.fn(),
      updateFeedback: jest.fn(),
      getWelcomeEvents: jest.fn(),
      createWelcomeEvent: jest.fn(),
      getWelcomeEventById: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdaptationCompatController],
      providers: [{ provide: AdaptationCompatService, useValue: svc }],
    })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    ctrl = moduleRef.get(AdaptationCompatController);
  });

  it('createProgram returns unwrapped data on success', async () => {
    (svc.createProgram as jest.Mock).mockResolvedValue(ok({ id: 'p1', title: 'Onboarding' }));
    const res = await ctrl.createProgram({ title: 'Onboarding' });
    expect(res).toEqual({ id: 'p1', title: 'Onboarding' });
    expect(svc.createProgram).toHaveBeenCalledWith({ title: 'Onboarding' });
  });

  it('getProgram returns program data', async () => {
    (svc.getProgram as jest.Mock).mockResolvedValue(ok({ id: 'p1', title: 'X' }));
    const res = await ctrl.getProgram('p1');
    expect(res).toEqual({ id: 'p1', title: 'X' });
  });

  it('updateProgram propagates service errors as InternalServerError', async () => {
    (svc.updateProgram as jest.Mock).mockResolvedValue(err('DB_ERROR', 'update fail'));
    await expect(ctrl.updateProgram('p1', { title: 'Updated' })).rejects.toThrow(InternalServerErrorException);
  });

  it('deleteProgram returns service ok payload', async () => {
    (svc.deleteProgram as jest.Mock).mockResolvedValue(ok({ deleted: true }));
    const res = await ctrl.deleteProgram('p1');
    expect(res).toEqual({ deleted: true });
  });

  it('getNewEmployees uses default limit/offset when none supplied', async () => {
    (svc.getNewEmployees as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getNewEmployees();
    expect(svc.getNewEmployees).toHaveBeenCalledWith('50', '0');
  });

  it('getFeedback forwards employeeId filter', async () => {
    (svc.getFeedback as jest.Mock).mockResolvedValue(ok([{ id: 'f1' }]));
    const res = await ctrl.getFeedback('emp-1');
    expect(svc.getFeedback).toHaveBeenCalledWith('emp-1');
    expect(res).toEqual([{ id: 'f1' }]);
  });

  it('createFeedback returns feedback id', async () => {
    (svc.createFeedback as jest.Mock).mockResolvedValue(ok({ id: 'f2' }));
    const res = await ctrl.createFeedback({ employeeId: 'e1', rating: 5 });
    expect(res).toEqual({ id: 'f2' });
  });

  it('getWelcomeEvents returns event list', async () => {
    (svc.getWelcomeEvents as jest.Mock).mockResolvedValue(ok([{ id: 'w1', title: 'Tanishuv' }]));
    const res = await ctrl.getWelcomeEvents();
    expect(res).toEqual([{ id: 'w1', title: 'Tanishuv' }]);
  });

  it('createWelcomeEvent forwards body to service', async () => {
    (svc.createWelcomeEvent as jest.Mock).mockResolvedValue(ok({ id: 'w2' }));
    await ctrl.createWelcomeEvent({ title: 'Welcome' });
    expect(svc.createWelcomeEvent).toHaveBeenCalledWith({ title: 'Welcome' });
  });

  it('getFeedbackById throws when service returns error', async () => {
    (svc.getFeedbackById as jest.Mock).mockResolvedValue(err('NOT_FOUND', 'no feedback'));
    await expect(ctrl.getFeedbackById('missing')).rejects.toThrow();
  });
});
