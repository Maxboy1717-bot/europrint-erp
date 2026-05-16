/**
 * @module pos.controller.e2e-spec
 * @description E2E tests for CashRegisterController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CashRegisterController } from '../../src/modules/pos/presentation/cash-register.controller';
import { CashRegisterService } from '../../src/modules/pos/application/services/cash-register.service';
import { RolesGuard } from '../../src/modules/shared/guards/roles.guard';

interface SvcMock {
  getProducts: jest.Mock; addProduct: jest.Mock; scanBarcode: jest.Mock;
  getTransactions: jest.Mock; createTransaction: jest.Mock; refundTransaction: jest.Mock; getReceipt: jest.Mock;
}

describe('CashRegisterController (e2e)', () => {
  let app: NestFastifyApplication;
  let svc: SvcMock; let rolesAllowed = true;

  beforeAll(async () => {
    svc = {
      getProducts: jest.fn(), addProduct: jest.fn(), scanBarcode: jest.fn(),
      getTransactions: jest.fn(), createTransaction: jest.fn(), refundTransaction: jest.fn(), getReceipt: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [CashRegisterController],
      providers: [
        { provide: CashRegisterService, useValue: svc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 4, role: 'cashier' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; });

  it('returns 200 with products list when cashier queries POS products endpoint', async () => {
    svc.getProducts.mockResolvedValue({ ok: true, data: [{ id: 1, name: 'A' }] });
    const res = await app.inject({ method: 'GET', url: '/pos/products' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard rejects non-cashier role', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/pos/products' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with product when scanning a valid barcode', async () => {
    svc.scanBarcode.mockResolvedValue({ ok: true, data: { id: 1, name: 'A' } });
    const res = await app.inject({ method: 'GET', url: '/pos/scan/4001234567890' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 not found when barcode does not match any product', async () => {
    svc.scanBarcode.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'absent' } });
    const res = await app.inject({ method: 'GET', url: '/pos/scan/0000000' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 201 created when cashier adds a new product to catalog', async () => {
    svc.addProduct.mockResolvedValue({ ok: true, data: { id: 99 } });
    const res = await app.inject({
      method: 'POST', url: '/pos/products',
      payload: { name: 'Box', price: 10, quantity: 100 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 bad request when add product payload contains negative price', async () => {
    const res = await app.inject({
      method: 'POST', url: '/pos/products',
      payload: { name: 'Box', price: -1 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 created when cashier records a sale transaction', async () => {
    svc.createTransaction.mockResolvedValue({ ok: true, data: { id: 'tx-1' } });
    const res = await app.inject({
      method: 'POST', url: '/pos/transactions',
      payload: { items: [{ product_id: 1, quantity: 1 }], payment_method: 'cash' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 200 with receipt when valid transaction id is supplied', async () => {
    svc.getReceipt.mockResolvedValue({ ok: true, data: { id: 'tx-1', total: 100 } });
    const res = await app.inject({ method: 'GET', url: '/pos/receipt/tx-1' });
    expect(res.statusCode).toBe(200);
  });
});
