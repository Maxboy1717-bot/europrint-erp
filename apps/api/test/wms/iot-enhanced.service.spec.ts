/**
 * @file iot-enhanced.service.spec.ts
 * @description Unit tests for IotEnhancedService (Rule 22: every service needs a
 *   unit test). Constructed directly with a mock IIotEnhancedRepo — no Nest DI,
 *   no DB. Covers:
 *   1. Pure delegation methods forward args/return repo Result untouched.
 *   2. `calculateBom` / `getMaterialKitById` / `prepareMaterialKit` /
 *      `readyMaterialKit` wrap repo calls in `safeCall` — including the
 *      documented behaviour that these methods do NOT unwrap the repo's
 *      Result (the repo already returns `Result<...>`, so `row ?? fallback`
 *      never falls back because a Result object is always truthy).
 *   3. `generateMaterialKit`'s field-priority resolution
 *      (orderId ?? productionOrderId ?? production_order_id ?? null) and
 *      that it forwards to `repo.createMaterialKit` merged with the body.
 *   4. `calculateBom` failure path when the repo call throws.
 */
import { IotEnhancedService } from '../../src/modules/wms/application/iot-enhanced.service';
import type { IIotEnhancedRepo } from '../../src/modules/wms/domain/repositories/i-iot-enhanced.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeMockRepo(overrides: Partial<jest.Mocked<IIotEnhancedRepo>> = {}): jest.Mocked<IIotEnhancedRepo> {
  return {
    getOrdersForKits: jest.fn(async () => Ok([{ id: 1, order_no: 'ORD-1' }])),
    getMaterialKits: jest.fn(async () => Ok([{ id: 1, status: 'draft' }])),
    createMaterialKit: jest.fn(async () => Ok({ id: 10, status: 'draft' })),
    calculateBom: jest.fn(async () => Ok([{ material_id: 5, qty: 3 }])),
    getKitItems: jest.fn(async () => Ok([{ id: 1, material_id: 5 }])),
    addKitItem: jest.fn(async () => Ok({ id: 1, material_id: 5 })),
    getMaterialKitById: jest.fn(async () => Ok({ id: 10, status: 'draft' })),
    updateMaterialKitStatus: jest.fn(async () => Ok({ id: 10, status: 'preparing' })),
    ...overrides,
  };
}

describe('IotEnhancedService', () => {
  describe('pure delegation methods', () => {
    it('getOrdersForKits forwards status and returns repo Result untouched', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      const r = await svc.getOrdersForKits('cutting');

      expect(repo.getOrdersForKits).toHaveBeenCalledWith('cutting');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([{ id: 1, order_no: 'ORD-1' }]);
    });

    it('getMaterialKits forwards status and returns repo Result untouched', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      const r = await svc.getMaterialKits('ready');

      expect(repo.getMaterialKits).toHaveBeenCalledWith('ready');
      expect(r.ok).toBe(true);
    });

    it('createMaterialKit forwards body/userId verbatim', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);
      const body = { orderId: 7 };

      await svc.createMaterialKit(body, 42);

      expect(repo.createMaterialKit).toHaveBeenCalledWith(body, 42);
    });

    it('getKitItems forwards kitId and returns repo Result untouched', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      const r = await svc.getKitItems(10);

      expect(repo.getKitItems).toHaveBeenCalledWith(10);
      expect(r.ok).toBe(true);
    });

    it('addKitItem forwards kitId/body and returns repo Result untouched', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);
      const body = { materialId: 5, quantity: 3 };

      await svc.addKitItem(10, body);

      expect(repo.addKitItem).toHaveBeenCalledWith(10, body);
    });

    it('propagates a repo Err untouched (no swallowing)', async () => {
      const repo = makeMockRepo({
        getOrdersForKits: jest.fn(async () => Err(AppErr('DB_ERROR', 'connection lost'))),
      });
      const svc = new IotEnhancedService(repo);

      const r = await svc.getOrdersForKits();

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    });
  });

  describe('calculateBom', () => {
    it('wraps repo result under order_id/bom_items without unwrapping the inner Result', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      const r = await svc.calculateBom(99);

      expect(repo.calculateBom).toHaveBeenCalledWith(99);
      expect(r.ok).toBe(true);
      if (r.ok) {
        const data = r.data as { order_id: number; bom_items: unknown };
        expect(data.order_id).toBe(99);
        // Documented current behaviour: repo.calculateBom already resolves to a
        // Result, and the service does not unwrap it before embedding —
        // bom_items is the raw Result object, not a plain array.
        expect(data.bom_items).toEqual(Ok([{ material_id: 5, qty: 3 }]));
      }
    });

    it('returns Err when the repo call throws', async () => {
      const repo = makeMockRepo({
        calculateBom: jest.fn(async () => { throw new Error('bom calc exploded'); }),
      });
      const svc = new IotEnhancedService(repo);

      const r = await svc.calculateBom(1);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('bom calc exploded');
    });
  });

  describe('getMaterialKitById', () => {
    it('resolves to the repo Result (never the `?? null` fallback, since a Result is always truthy)', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      const r = await svc.getMaterialKitById(10);

      expect(repo.getMaterialKitById).toHaveBeenCalledWith(10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual(Ok({ id: 10, status: 'draft' }));
    });

    it('returns Err when the repo call throws', async () => {
      const repo = makeMockRepo({
        getMaterialKitById: jest.fn(async () => { throw new Error('kit lookup failed'); }),
      });
      const svc = new IotEnhancedService(repo);

      const r = await svc.getMaterialKitById(10);

      expect(r.ok).toBe(false);
    });
  });

  describe('prepareMaterialKit / readyMaterialKit', () => {
    it('prepareMaterialKit calls updateMaterialKitStatus with "preparing"', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      const r = await svc.prepareMaterialKit(10);

      expect(repo.updateMaterialKitStatus).toHaveBeenCalledWith(10, 'preparing');
      expect(r.ok).toBe(true);
    });

    it('readyMaterialKit calls updateMaterialKitStatus with "ready"', async () => {
      const repo = makeMockRepo({
        updateMaterialKitStatus: jest.fn(async () => Ok({ id: 10, status: 'ready' })),
      });
      const svc = new IotEnhancedService(repo);

      const r = await svc.readyMaterialKit(10);

      expect(repo.updateMaterialKitStatus).toHaveBeenCalledWith(10, 'ready');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual(Ok({ id: 10, status: 'ready' }));
    });
  });

  describe('generateMaterialKit — orderId field-priority resolution', () => {
    it('prefers body.orderId when present', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      await svc.generateMaterialKit(
        { orderId: 1, productionOrderId: 2, production_order_id: 3 },
        7,
      );

      expect(repo.createMaterialKit).toHaveBeenCalledWith(
        expect.objectContaining({ productionOrderId: 1 }),
        7,
      );
    });

    it('falls back to body.productionOrderId when orderId is absent', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      await svc.generateMaterialKit({ productionOrderId: 2, production_order_id: 3 }, 7);

      expect(repo.createMaterialKit).toHaveBeenCalledWith(
        expect.objectContaining({ productionOrderId: 2 }),
        7,
      );
    });

    it('falls back to body.production_order_id when both camelCase fields are absent', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      await svc.generateMaterialKit({ production_order_id: 3 }, 7);

      expect(repo.createMaterialKit).toHaveBeenCalledWith(
        expect.objectContaining({ productionOrderId: 3 }),
        7,
      );
    });

    it('resolves to null when none of the three fields are present', async () => {
      const repo = makeMockRepo();
      const svc = new IotEnhancedService(repo);

      await svc.generateMaterialKit({ notes: 'no order ref' }, null);

      expect(repo.createMaterialKit).toHaveBeenCalledWith(
        expect.objectContaining({ productionOrderId: null, notes: 'no order ref' }),
        null,
      );
    });
  });
});
