/**
 * @module warehouse-label.spec
 * @description Unit tests for WarehouseLabelController.
 */

import { Test } from '@nestjs/testing';
import { WarehouseLabelController } from '../../src/modules/compatibility/warehouse-label.controller';
import { WarehouseLabelCompatService } from '../../src/modules/compatibility/warehouse-label.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('WarehouseLabelController', () => {
  let ctrl: WarehouseLabelController;
  let svc: jest.Mocked<Partial<WarehouseLabelCompatService>>;

  beforeEach(async () => {
    svc = {
      printLabel: jest.fn(), getLabelBatches: jest.fn(),
      getPrintHistory: jest.fn(), updateBatchStatus: jest.fn(),
      createLabelPrintJob: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [WarehouseLabelController],
      providers: [{ provide: WarehouseLabelCompatService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .compile();
    ctrl = mod.get(WarehouseLabelController);
  });

  it('printLabel forwards body', async () => {
    (svc.printLabel as jest.Mock).mockResolvedValue(ok({ jobId: 'j1' }));
    await ctrl.printLabel({ batchId: 'b1', format: 'A4' } as never);
    expect(svc.printLabel).toHaveBeenCalledWith({ batchId: 'b1', format: 'A4' });
  });

  it('getLabelBatches forwards filters', async () => {
    (svc.getLabelBatches as jest.Mock).mockResolvedValue(ok([{ id: 'b1' }]));
    await ctrl.getLabelBatches('w1', 'active');
    expect(svc.getLabelBatches).toHaveBeenCalledWith('w1', 'active');
  });

  it('getPrintHistory parses limit string to integer', async () => {
    (svc.getPrintHistory as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getPrintHistory('w1', '25');
    expect(svc.getPrintHistory).toHaveBeenCalledWith('w1', 25);
  });

  it('getPrintHistory defaults limit to 50', async () => {
    (svc.getPrintHistory as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getPrintHistory();
    expect(svc.getPrintHistory).toHaveBeenCalledWith(undefined, 50);
  });

  it('updateBatchStatus passes status and notes', async () => {
    (svc.updateBatchStatus as jest.Mock).mockResolvedValue(ok({ id: 'b1' }));
    await ctrl.updateBatchStatus('b1', { status: 'printed', notes: 'ok' } as never);
    expect(svc.updateBatchStatus).toHaveBeenCalledWith('b1', 'printed', 'ok');
  });

  it('createLabelPrintJob defaults copies to 1', async () => {
    (svc.createLabelPrintJob as jest.Mock).mockResolvedValue(ok({ id: 'job1' }));
    await ctrl.createLabelPrintJob({ batchId: 'b1', format: 'A4' } as never);
    expect(svc.createLabelPrintJob).toHaveBeenCalledWith('b1', 'A4', 1);
  });

  it('printLabel throws on service error', async () => {
    (svc.printLabel as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.printLabel({ batchId: 'b1' } as never)).rejects.toThrow(InternalServerErrorException);
  });
});
