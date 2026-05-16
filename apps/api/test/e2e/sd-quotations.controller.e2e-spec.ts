/**
 * @module sd-quotations.controller.e2e-spec
 * @description E2E tests for SdQuotationsController.
 */

import 'reflect-metadata';

jest.mock('@shared/db', () => ({
  __esModule: true,
  runQuery: jest.fn().mockResolvedValue({ rows: [{ id: '1', status: 'sent', updated_at: '2026-01-01' }] }),
  db: {},
}));

import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SdQuotationsController } from '../../src/modules/sd/presentation/sd-quotations.controller';
import { SdQuotationsService } from '../../src/modules/sd/application/sd-quotations.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface SvcMock {
  listQuotations: jest.Mock; createQuotation: jest.Mock; createContract: jest.Mock;
  listPriceFormulas: jest.Mock; calculatePrice: jest.Mock; getKpiTeam: jest.Mock;
  getKpiTargets: jest.Mock; getFunnelReport: jest.Mock; convertToOrder: jest.Mock;
}

describe('SdQuotationsController (e2e)', () => {
  let app: NestFastifyApplication;
  let svc: SvcMock; let rolesAllowed = true; let jwtAllowed = true;

  beforeAll(async () => {
    svc = {
      listQuotations: jest.fn(), createQuotation: jest.fn(), createContract: jest.fn(),
      listPriceFormulas: jest.fn(), calculatePrice: jest.fn(), getKpiTeam: jest.fn(),
      getKpiTargets: jest.fn(), getFunnelReport: jest.fn(), convertToOrder: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [SdQuotationsController],
      providers: [
        { provide: SdQuotationsService, useValue: svc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (): boolean => jwtAllowed })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 1, role: 'sales_manager' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; jwtAllowed = true; });

  it('returns 200 with quotations list when sales role queries quotations', async () => {
    svc.listQuotations.mockResolvedValue({ ok: true, data: [{ id: 'q1' }] });
    const res = await app.inject({ method: 'GET', url: '/sd/quotations' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard denies the access', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/sd/quotations' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 403 forbidden when jwt guard denies the request', async () => {
    jwtAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/sd/quotations' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with calculated price when valid product and quantity are sent', async () => {
    svc.calculatePrice.mockResolvedValue({ ok: true, data: { total: 999 } });
    const res = await app.inject({
      method: 'POST', url: '/sd/calculate-price',
      payload: { product_id: 1, quantity: 5 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 bad request when calculate-price payload is empty', async () => {
    const res = await app.inject({ method: 'POST', url: '/sd/calculate-price', payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 with KPI team data when period is supplied', async () => {
    svc.getKpiTeam.mockResolvedValue({ ok: true, data: [{ user: 'a', sales: 100 }] });
    const res = await app.inject({ method: 'GET', url: '/sd/kpi/team?period=2026-05' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 when sending an existing quotation triggers status update', async () => {
    const res = await app.inject({ method: 'POST', url: '/sd/quotations/1/send' });
    expect(res.statusCode).toBe(201);
  });

  it('returns 200 when converting a quotation into a sales order', async () => {
    svc.convertToOrder.mockResolvedValue({ ok: true, data: { orderId: 5 } });
    const res = await app.inject({ method: 'POST', url: '/sd/quotations/1/convert-to-order' });
    expect(res.statusCode).toBe(200);
  });
});
