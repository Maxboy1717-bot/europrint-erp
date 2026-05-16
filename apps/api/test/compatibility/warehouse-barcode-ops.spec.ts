/**
 * @module warehouse-barcode-ops.spec
 * @description Unit tests for WarehouseBarcodeOpsController.
 */

import { Test } from '@nestjs/testing';
import { WarehouseBarcodeOpsController } from '../../src/modules/compatibility/warehouse-barcode-ops.controller';
import { WarehouseBarcodeOpsService } from '../../src/modules/compatibility/warehouse-barcode-ops.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('WarehouseBarcodeOpsController', () => {
  let ctrl: WarehouseBarcodeOpsController;
  let svc: jest.Mocked<Partial<WarehouseBarcodeOpsService>>;

  beforeEach(async () => {
    svc = {
      generateBarcode: jest.fn(), scanBarcode: jest.fn(),
      bulkGenerateBarcodes: jest.fn(), getPrintPreview: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [WarehouseBarcodeOpsController],
      providers: [{ provide: WarehouseBarcodeOpsService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .compile();
    ctrl = mod.get(WarehouseBarcodeOpsController);
  });

  it('generateBarcode forwards type and entity id', async () => {
    (svc.generateBarcode as jest.Mock).mockResolvedValue(ok({ barcode: 'B1' }));
    await ctrl.generateBarcode({ type: 'material', entityId: 'e1' } as never);
    expect(svc.generateBarcode).toHaveBeenCalledWith('material', 'e1');
  });

  it('scanBarcode forwards barcode value', async () => {
    (svc.scanBarcode as jest.Mock).mockResolvedValue(ok({ id: 'm1' }));
    await ctrl.scanBarcode({ barcode: 'ABC123' } as never);
    expect(svc.scanBarcode).toHaveBeenCalledWith('ABC123');
  });

  it('bulkGenerateBarcodes passes empty array when missing', async () => {
    (svc.bulkGenerateBarcodes as jest.Mock).mockResolvedValue(ok({ count: 0 }));
    await ctrl.bulkGenerateBarcodes({ type: 'material' } as never);
    expect(svc.bulkGenerateBarcodes).toHaveBeenCalledWith([], 'material');
  });

  it('bulkGenerateBarcodes forwards entity ids', async () => {
    (svc.bulkGenerateBarcodes as jest.Mock).mockResolvedValue(ok({ count: 2 }));
    await ctrl.bulkGenerateBarcodes({ entityIds: ['e1', 'e2'], type: 'material' } as never);
    expect(svc.bulkGenerateBarcodes).toHaveBeenCalledWith(['e1', 'e2'], 'material');
  });

  it('getPrintPreview forwards id and type', async () => {
    (svc.getPrintPreview as jest.Mock).mockResolvedValue(ok({ html: '<x/>' }));
    await ctrl.getPrintPreview('e1', 'material');
    expect(svc.getPrintPreview).toHaveBeenCalledWith('e1', 'material');
  });

  it('generateBarcode throws on service error', async () => {
    (svc.generateBarcode as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.generateBarcode({ type: 'm', entityId: 'e1' } as never)).rejects.toThrow(InternalServerErrorException);
  });
});
