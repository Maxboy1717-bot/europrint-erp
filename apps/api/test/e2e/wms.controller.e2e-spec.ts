/**
 * @module wms.controller.e2e-spec
 * @description E2E tests for WmsInventoryController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WmsInventoryController } from '../../src/modules/wms/presentation/wms-inventory.controller';
import { WmsCrudService } from '../../src/modules/wms/application/wms-crud.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface BusMock { execute: jest.Mock }
interface CrudMock { patchInventory: jest.Mock; softDeleteInventory: jest.Mock }

describe('WmsInventoryController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: BusMock; let queryBus: BusMock; let crudSvc: CrudMock;
  let rolesAllowed = true;

  beforeAll(async () => {
    commandBus = { execute: jest.fn() }; queryBus = { execute: jest.fn() };
    crudSvc = { patchInventory: jest.fn(), softDeleteInventory: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [WmsInventoryController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: WmsCrudService, useValue: crudSvc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 8, role: 'warehouse_manager' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; });

  it('returns 200 with inventory items when warehouse_manager queries inventory', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [{ id: '1', qty: 10 }] } });
    const res = await app.inject({ method: 'GET', url: '/wms/inventory' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).total).toBe(1);
  });

  it('returns 403 forbidden when role guard denies the wms request', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/wms/inventory' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with low stock items when threshold query is provided', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: [{ id: '1', qty: 2 }] });
    const res = await app.inject({ method: 'GET', url: '/wms/inventory/low-stock' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 with inventory item when matching id is found in the list', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [{ id: '42', qty: 5 }] } });
    const res = await app.inject({ method: 'GET', url: '/wms/inventory/42' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 bad request when inventory item with given id is missing', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [] } });
    const res = await app.inject({ method: 'GET', url: '/wms/inventory/missing' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 not found when patching an inventory record that does not exist', async () => {
    crudSvc.patchInventory.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'no' } });
    const res = await app.inject({ method: 'PATCH', url: '/wms/inventory/999', payload: { qty: 5 } });
    expect(res.statusCode).toBe(404);
  });

  it('returns 501 not implemented when POST creates inventory adjustment', async () => {
    const res = await app.inject({ method: 'POST', url: '/wms/inventory', payload: {} });
    expect(res.statusCode).toBe(501);
  });

  it('returns 200 when warehouse manager patches an inventory record', async () => {
    crudSvc.patchInventory.mockResolvedValue({ ok: true, data: { id: 1, qty: 50 } });
    const res = await app.inject({ method: 'PATCH', url: '/wms/inventory/1', payload: { qty: 50 } });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 bad request when patch id param is not an integer', async () => {
    const res = await app.inject({ method: 'PATCH', url: '/wms/inventory/abc', payload: { qty: 1 } });
    expect(res.statusCode).toBe(400);
  });
});
