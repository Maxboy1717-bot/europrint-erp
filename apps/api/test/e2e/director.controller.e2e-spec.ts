/**
 * @module director.controller.e2e-spec
 * @description E2E tests for DashboardController (director module).
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DashboardController } from '../../src/modules/director/presentation/dashboard.controller';
import { DashboardQueryService } from '../../src/modules/director/application/dashboard-query.service';
import { DirectorDataService } from '../../src/modules/director/application/director-data.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface QueryBusMock { execute: jest.Mock }
interface DataSvcMock { getDashboard: jest.Mock }
interface QuerySvcMock { getProductionSummary: jest.Mock; getFinanceSummary: jest.Mock; getHrSummary: jest.Mock }

describe('DashboardController (Director e2e)', () => {
  let app: NestFastifyApplication;
  let queryBus: QueryBusMock; let dataSvc: DataSvcMock; let querySvc: QuerySvcMock;
  let rolesAllowed = true;

  beforeAll(async () => {
    queryBus = { execute: jest.fn() };
    dataSvc = { getDashboard: jest.fn() };
    querySvc = { getProductionSummary: jest.fn(), getFinanceSummary: jest.fn(), getHrSummary: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: QueryBus, useValue: queryBus },
        { provide: DashboardQueryService, useValue: querySvc },
        { provide: DirectorDataService, useValue: dataSvc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 1, role: 'DIRECTOR' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; });

  it('returns 200 with dashboard data when DIRECTOR queries the root endpoint', async () => {
    dataSvc.getDashboard.mockResolvedValue({ ok: true, data: { kpis: { revenue: 1000 } } });
    const res = await app.inject({ method: 'GET', url: '/director/dashboard' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard rejects non-director user', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/director/dashboard' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with KPIs when director requests dashboard kpis endpoint', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { salesOrders: 5, revenue: 100 } });
    const res = await app.inject({ method: 'GET', url: '/director/dashboard/kpis' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 with production summary when director requests production data', async () => {
    querySvc.getProductionSummary.mockResolvedValue({ activePoCount: 5, completedToday: 3, avgOee: 0.8 });
    const res = await app.inject({ method: 'GET', url: '/director/dashboard/production-summary' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).data.activePoCount).toBe(5);
  });

  it('returns 200 with finance summary when director requests finance data', async () => {
    querySvc.getFinanceSummary.mockResolvedValue({ revenueVsLastMonth: 0.1, topUnpaidInvoices: [], advancePending: 0 });
    const res = await app.inject({ method: 'GET', url: '/director/dashboard/finance-summary' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 with HR summary when director requests HR endpoint', async () => {
    querySvc.getHrSummary.mockResolvedValue({ attendanceToday: { attended: 100, total: 120 }, openPayrollCount: 1 });
    const res = await app.inject({ method: 'GET', url: '/director/dashboard/hr-summary' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 500 internal error when KPI query bus reports failure result', async () => {
    queryBus.execute.mockResolvedValue({ ok: false, error: { code: 'INTERNAL', message: 'db' } });
    const res = await app.inject({ method: 'GET', url: '/director/dashboard/kpis' });
    expect(res.statusCode).toBe(500);
  });

  it('returns 404 not found when an unknown director sub-route is requested', async () => {
    const res = await app.inject({ method: 'GET', url: '/director/dashboard/unknown-section' });
    expect(res.statusCode).toBe(404);
  });
});
