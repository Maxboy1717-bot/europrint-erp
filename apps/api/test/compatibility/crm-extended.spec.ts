/**
 * @module crm-extended.spec
 * @description Unit tests for CrmExtendedCompatController.
 */

import { Test } from '@nestjs/testing';
import { CrmExtendedCompatController } from '../../src/modules/compatibility/crm-extended.controller';
import { CrmExtendedCompatService } from '../../src/modules/compatibility/crm-extended.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('CrmExtendedCompatController', () => {
  let ctrl: CrmExtendedCompatController;
  let svc: jest.Mocked<Partial<CrmExtendedCompatService>>;

  beforeEach(async () => {
    svc = {
      getCrmInvoices: jest.fn(), getAiDashboardAnalysis: jest.fn(),
      getSupervisorDashboard: jest.fn(), getNextBestAction: jest.fn(),
      getExtendedInsights: jest.fn(), createTask: jest.fn(),
      processChat: jest.fn(), runAutoTasks: jest.fn(),
      churnAnalysis: jest.fn(), processVoice: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [CrmExtendedCompatController],
      providers: [{ provide: CrmExtendedCompatService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .compile();
    ctrl = mod.get(CrmExtendedCompatController);
  });

  it('getCrmInvoices forwards pagination params', async () => {
    (svc.getCrmInvoices as jest.Mock).mockResolvedValue(ok({ items: [], total: 0 }));
    await ctrl.getCrmInvoices('1', '20');
    expect(svc.getCrmInvoices).toHaveBeenCalledWith('1', '20');
  });

  it('getAiDashboardAnalysis returns AI insights', async () => {
    (svc.getAiDashboardAnalysis as jest.Mock).mockResolvedValue(ok({ summary: 'good' }));
    expect(await ctrl.getAiDashboardAnalysis()).toEqual({ summary: 'good' });
  });

  it('getSupervisorDashboard returns supervisor dashboard data', async () => {
    (svc.getSupervisorDashboard as jest.Mock).mockResolvedValue(ok({ leads: 3 }));
    expect(await ctrl.getSupervisorDashboard()).toEqual({ leads: 3 });
  });

  it('getNextBestAction wraps result as items+total', async () => {
    (svc.getNextBestAction as jest.Mock).mockResolvedValue(ok([{ id: 'a1' }, { id: 'a2' }]));
    expect(await ctrl.getNextBestAction()).toEqual({ items: [{ id: 'a1' }, { id: 'a2' }], total: 2 });
  });

  it('getNextBestAction returns empty list on error', async () => {
    (svc.getNextBestAction as jest.Mock).mockResolvedValue(err());
    expect(await ctrl.getNextBestAction()).toEqual({ items: [], total: 0 });
  });

  it('createTask forwards body to service', async () => {
    (svc.createTask as jest.Mock).mockResolvedValue(ok({ id: 't1' }));
    await ctrl.createTask({ title: 'Call' } as never);
    expect(svc.createTask).toHaveBeenCalledWith({ title: 'Call' });
  });

  it('processChat delegates to service', async () => {
    (svc.processChat as jest.Mock).mockResolvedValue(ok({ reply: 'hi' }));
    expect(await ctrl.processChat({ message: 'hi' } as never)).toEqual({ reply: 'hi' });
  });

  it('churnAnalysis returns service payload', async () => {
    (svc.churnAnalysis as jest.Mock).mockResolvedValue(ok({ risk: 0.7 }));
    expect(await ctrl.churnAnalysis({ customerId: 'c1' } as never)).toEqual({ risk: 0.7 });
  });

  it('processVoice throws on service error', async () => {
    (svc.processVoice as jest.Mock).mockResolvedValue(err('DB_ERROR'));
    await expect(ctrl.processVoice({ url: 'x' } as never)).rejects.toThrow(InternalServerErrorException);
  });

  it('runAutoTasks returns service result', async () => {
    (svc.runAutoTasks as jest.Mock).mockResolvedValue(ok({ created: 2 }));
    expect(await ctrl.runAutoTasks({} as never)).toEqual({ created: 2 });
  });
});
