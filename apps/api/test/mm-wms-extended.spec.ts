import { Test, TestingModule } from '@nestjs/testing';
import { MmVendorsPrController } from '../src/modules/mm/presentation/mm-vendors-pr.controller';
import { MmGoodsController } from '../src/modules/mm/presentation/mm-goods.controller';
import { WmsExtendedController } from '../src/modules/wms/presentation/wms-extended.controller';
import { WmsCountsController } from '../src/modules/wms/presentation/wms-counts.controller';
import { MmVendorsPrService } from '../src/modules/mm/application/mm-vendors-pr.service';
import { MmGoodsService } from '../src/modules/mm/application/mm-goods.service';
import { WmsExtendedService } from '../src/modules/wms/application/wms-extended.service';
import { WmsCountsService } from '../src/modules/wms/application/wms-counts.service';
import { WmsCrudService } from '../src/modules/wms/application/wms-crud.service';
import { JwtAuthGuard } from 'shared/guards/jwt-auth.guard';
import { RolesGuard } from 'shared/guards/roles.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const ok = (data: unknown) => ({ ok: true, data });
const mockGuard = { canActivate: () => true };
const adminUser = { id: 1, username: 'test', role: 'super_admin' };

describe('MM Vendors and WMS Extended Controllers — Behavioral Integration Tests', () => {
  let vendorsController: MmVendorsPrController;
  let goodsController: MmGoodsController;
  let wmsController: WmsExtendedController;
  let wmsCountsController: WmsCountsController;

  let mockVendorsSvc: jest.Mocked<Partial<MmVendorsPrService>>;
  let mockGoodsSvc: jest.Mocked<Partial<MmGoodsService>>;
  let mockWmsExtSvc: jest.Mocked<Partial<WmsExtendedService>>;
  let mockWmsCountsSvc: jest.Mocked<Partial<WmsCountsService>>;
  let mockWmsCrudSvc: jest.Mocked<Partial<WmsCrudService>>;

  beforeEach(async () => {
    mockVendorsSvc = {
      listVendors: jest.fn(),
      getVendor: jest.fn(),
      createVendor: jest.fn(),
      updateVendor: jest.fn(),
      deleteVendor: jest.fn(),
      listRequisitions: jest.fn(),
      createRequisition: jest.fn(),
    };
    mockGoodsSvc = {
      listGoodsReceipts: jest.fn(),
      createGoodsReceipt: jest.fn(),
      listGoodsIssues: jest.fn(),
      createGoodsIssue: jest.fn(),
    };
    mockWmsExtSvc = {
      getTotalStats: jest.fn(),
      listTransactions: jest.fn(),
      createTransaction: jest.fn(),
      getAlerts: jest.fn(),
      getReplenishmentSuggestions: jest.fn(),
    };
    mockWmsCountsSvc = {
      listInventoryCounts: jest.fn(),
      createInventoryCount: jest.fn(),
      listInternalRequests: jest.fn(),
      createInternalRequest: jest.fn(),
    };
    mockWmsCrudSvc = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MmVendorsPrController, MmGoodsController, WmsExtendedController, WmsCountsController],
      providers: [
        { provide: MmVendorsPrService, useValue: mockVendorsSvc },
        { provide: MmGoodsService, useValue: mockGoodsSvc },
        { provide: WmsExtendedService, useValue: mockWmsExtSvc },
        { provide: WmsCountsService, useValue: mockWmsCountsSvc },
        { provide: WmsCrudService, useValue: mockWmsCrudSvc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();

    vendorsController = module.get(MmVendorsPrController);
    goodsController = module.get(MmGoodsController);
    wmsController = module.get(WmsExtendedController);
    wmsCountsController = module.get(WmsCountsController);
  });

  // ─── MmVendorsPrController ───────────────────────────────────────────────────

  describe('MmVendorsController', () => {
    describe('listVendors()', () => {
      it('returns vendors from service', async () => {
        const vendors = [{ id: 1, name: 'Tex Savdo', rating: 4.5 }];
        (mockVendorsSvc.listVendors as jest.Mock).mockResolvedValue(ok(vendors));
        const result = await vendorsController.listVendors();
        expect(result).toEqual(vendors);
      });

      it('returns empty array when no vendors exist', async () => {
        (mockVendorsSvc.listVendors as jest.Mock).mockResolvedValue(ok([]));
        const result = await vendorsController.listVendors();
        expect(result).toEqual([]);
      });
    });

    describe('getVendor()', () => {
      it('returns vendor record', async () => {
        const vendor = { id: 2, name: "Qog'oz Savdo", rating: 4.2, order_count: 12 };
        (mockVendorsSvc.getVendor as jest.Mock).mockResolvedValue(ok([vendor]));
        const result = await vendorsController.getVendor('2');
        expect(result).toEqual(vendor);
      });

      it('throws NotFoundException for missing vendor', async () => {
        (mockVendorsSvc.getVendor as jest.Mock).mockResolvedValue(ok(null));
        await expect(vendorsController.getVendor('999')).rejects.toThrow(NotFoundException);
      });
    });

    describe('createVendor()', () => {
      it('creates vendor and returns created record', async () => {
        const body = { name: 'Yangi Vendor', phone: '+998901234567', email: 'vendor@test.uz' };
        const created = { id: 10, ...body };
        (mockVendorsSvc.createVendor as jest.Mock).mockResolvedValue(ok(created));
        const result = await vendorsController.createVendor(body);
        expect(result).toEqual(created);
      });

      it('throws BadRequestException when name missing', async () => {
        await expect(vendorsController.createVendor({ phone: '+998901234567' })).rejects.toThrow(BadRequestException);
      });
    });

    describe('updateVendor()', () => {
      it('updates vendor and returns updated record', async () => {
        const updated = { id: 5, name: 'Updated Vendor', rating: 4.8 };
        (mockVendorsSvc.updateVendor as jest.Mock).mockResolvedValue(ok([updated]));
        const result = await vendorsController.updateVendor('5', { name: 'Updated Vendor' });
        expect(result).toEqual(updated);
      });

      it('throws NotFoundException when vendor not found', async () => {
        (mockVendorsSvc.updateVendor as jest.Mock).mockResolvedValue(ok(null));
        await expect(vendorsController.updateVendor('999', { name: 'X' })).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteVendor()', () => {
      it('soft-deletes vendor', async () => {
        (mockVendorsSvc.deleteVendor as jest.Mock).mockResolvedValue(undefined);
        const result = await vendorsController.deleteVendor('5');
        expect(result).toEqual({ success: true });
      });
    });

    describe('listRequisitions()', () => {
      it('returns purchase requisitions', async () => {
        const reqs = [{ id: 1, vendor_id: 2, status: 'pending', total: 500000 }];
        (mockVendorsSvc.listRequisitions as jest.Mock).mockResolvedValue(ok(reqs));
        const result = await vendorsController.listRequisitions();
        expect(result).toEqual(reqs);
      });
    });

    describe('createRequisition()', () => {
      it('creates requisition with title and returns record', async () => {
        const created = { id: 15, title: "Qog'oz buyurtma", status: 'pending' };
        (mockVendorsSvc.createRequisition as jest.Mock).mockResolvedValue(ok(created));
        const result = await vendorsController.createRequisition(
          { title: "Qog'oz buyurtma", items: [{ material_id: 1, quantity: 100, unit_price: 5000 }] },
          adminUser,
        );
        expect(result).toEqual(created);
      });

      it('throws BadRequestException when title missing', async () => {
        await expect(
          vendorsController.createRequisition({ items: [] }, adminUser)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('listGoodsReceipts()', () => {
      it('returns goods receipts', async () => {
        const receipts = [{ id: 1, vendor_id: 2, status: 'completed' }];
        (mockGoodsSvc.listGoodsReceipts as jest.Mock).mockResolvedValue(ok(receipts));
        const result = await goodsController.listGoodsReceipts();
        expect(result).toEqual(receipts);
      });
    });

    describe('createGoodsReceipt()', () => {
      it('throws BadRequestException when vendor_id missing', async () => {
        await expect(
          goodsController.createGoodsReceipt({ quantity: 100 } as any)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('listGoodsIssues()', () => {
      it('returns goods issues list', async () => {
        const issues = [{ id: 1, material_id: 3, quantity: 50 }];
        (mockGoodsSvc.listGoodsIssues as jest.Mock).mockResolvedValue(ok(issues));
        const result = await goodsController.listGoodsIssues();
        expect(result).toEqual(issues);
      });
    });

    describe('createGoodsIssue()', () => {
      it('creates goods issue and returns record', async () => {
        const created = { id: 20, issued_by: 3, status: 'pending' };
        (mockGoodsSvc.createGoodsIssue as jest.Mock).mockResolvedValue(ok(created));
        const result = await goodsController.createGoodsIssue({
          issued_by: 3,
          items: [{ material_id: 1, quantity: 50 }],
        } as any);
        expect(result).toEqual(created);
      });
    });
  });

  // ─── WmsExtendedController ───────────────────────────────────────────────────

  describe('WmsExtendedController', () => {
    describe('listTransactions()', () => {
      it('returns warehouse transactions', async () => {
        const txns = [{ id: 1, type: 'inbound', quantity: 200 }];
        (mockWmsExtSvc.listTransactions as jest.Mock).mockResolvedValue(ok(txns));
        const result = await wmsController.listTransactions();
        expect(result).toEqual(txns);
      });
    });

    describe('createTransaction()', () => {
      it('creates a warehouse transaction', async () => {
        const body = { type: 'inbound', warehouse_id: 1, material_id: 3, quantity: 50 };
        const created = { id: 25, ...body };
        (mockWmsExtSvc.createTransaction as jest.Mock).mockResolvedValue(ok(created));
        const result = await wmsController.createTransaction(body, adminUser);
        expect(result).toEqual(created);
      });

      it('throws BadRequestException when material_id or quantity missing', async () => {
        await expect(wmsController.createTransaction({ type: 'inbound', warehouse_id: 1 }, adminUser)).rejects.toThrow(BadRequestException);
      });
    });

    describe('getAlerts()', () => {
      it('returns warehouse alerts', async () => {
        const alerts = [{ id: 1, type: 'low_stock', material_id: 3, warehouse_id: 1 }];
        (mockWmsExtSvc.getAlerts as jest.Mock).mockResolvedValue(ok(alerts));
        const result = await wmsController.getAlerts();
        expect(result).toEqual(alerts);
      });
    });

    describe('getReplenishmentSuggestions()', () => {
      it('returns replenishment suggestions', async () => {
        const suggestions = [{ material_id: 3, current_stock: 5, reorder_point: 20, suggested_qty: 100 }];
        (mockWmsExtSvc.getReplenishmentSuggestions as jest.Mock).mockResolvedValue(ok(suggestions));
        const result = await wmsController.getReplenishmentSuggestions();
        expect(result).toEqual(suggestions);
      });
    });

    describe('listInventoryCounts()', () => {
      it('returns inventory count sessions', async () => {
        const counts = [{ id: 1, warehouse_id: 2, status: 'in_progress' }];
        (mockWmsCountsSvc.listInventoryCounts as jest.Mock).mockResolvedValue(ok(counts));
        const result = await wmsCountsController.listInventoryCounts();
        expect(result).toEqual({ items: counts, total: counts.length });
      });
    });

    describe('createInventoryCount()', () => {
      it('creates inventory count session', async () => {
        const created = { id: 5, warehouse_id: 2, status: 'pending' };
        (mockWmsCountsSvc.createInventoryCount as jest.Mock).mockResolvedValue(ok(created));
        const result = await wmsCountsController.createInventoryCount({ warehouse_id: 2 } as any);
        expect(result).toEqual(created);
      });

      it('throws BadRequestException when warehouse_id missing', async () => {
        await expect(wmsCountsController.createInventoryCount({} as any)).rejects.toThrow(BadRequestException);
      });
    });

    describe('createInternalRequest()', () => {
      it('creates internal warehouse request', async () => {
        const body = { material_id: 5, quantity: 30, from_warehouse_id: 1, to_warehouse_id: 2 };
        const created = { id: 8, ...body, status: 'pending' };
        (mockWmsCountsSvc.createInternalRequest as jest.Mock).mockResolvedValue(ok(created));
        const result = await wmsCountsController.createInternalRequest(body as any, adminUser);
        expect(result).toEqual(created);
      });

      it('throws BadRequestException when material_id or quantity missing', async () => {
        await expect(wmsCountsController.createInternalRequest({ from_warehouse_id: 1 } as any, adminUser)).rejects.toThrow(BadRequestException);
      });
    });

    describe('getTotalStats()', () => {
      it('returns inventory summary stats', async () => {
        const stats = { total_items: 500, total_warehouses: 3, low_stock_count: 12 };
        (mockWmsExtSvc.getTotalStats as jest.Mock).mockResolvedValue(ok(stats));
        const result = await wmsController.getTotalStats();
        expect(result).toBeDefined();
      });
    });

    describe('listInternalRequests()', () => {
      it('returns internal warehouse transfer requests', async () => {
        const requests = [{ id: 1, material_id: 3, quantity: 50, status: 'pending' }];
        (mockWmsCountsSvc.listInternalRequests as jest.Mock).mockResolvedValue(ok(requests));
        const result = await wmsCountsController.listInternalRequests();
        expect(result).toEqual(requests);
      });
    });
  });
});
