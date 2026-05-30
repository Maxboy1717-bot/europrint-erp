/**
 * @module finance.controller.e2e-spec
 * @description E2E tests for FinanceGlController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FinanceGlController } from '../../src/modules/finance/presentation/finance-gl.controller';
import { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface BusMock { execute: jest.Mock }
interface GlSvcMock { postSalesInvoice: jest.Mock; postPayroll: jest.Mock }

describe('FinanceGlController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: BusMock; let queryBus: BusMock; let glSvc: GlSvcMock;
  let rolesAllowed = true;

  beforeAll(async () => {
    commandBus = { execute: jest.fn() }; queryBus = { execute: jest.fn() };
    glSvc = { postSalesInvoice: jest.fn(), postPayroll: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [FinanceGlController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: GlPostingService, useValue: glSvc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 1, role: 'ACCOUNTANT' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; });

  it('returns 200 with GL entries list when ACCOUNTANT queries the data', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [{ id: 1 }] } });
    const res = await app.inject({ method: 'GET', url: '/finance/gl' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard rejects unauthorized role', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/finance/gl' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 201 created when posting a valid sales invoice to GL', async () => {
    glSvc.postSalesInvoice.mockResolvedValue({ ok: true, data: 555 });
    const res = await app.inject({
      method: 'POST', url: '/finance/gl/post-sales-invoice',
      payload: { invoiceId: 1, amount: 1000, tax: 120, postedBy: 1 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 bad request when post-sales-invoice has invalid invoiceId', async () => {
    const res = await app.inject({
      method: 'POST', url: '/finance/gl/post-sales-invoice',
      payload: { invoiceId: -1, amount: 0, tax: 0, postedBy: 1 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 created when posting payroll batch to GL succeeds', async () => {
    glSvc.postPayroll.mockResolvedValue({ ok: true, data: 777 });
    const res = await app.inject({
      method: 'POST', url: '/finance/gl/post-payroll',
      payload: { payrollId: 1, gross: 10000, postedBy: 1 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 500 when GL service reports a posting failure for payroll', async () => {
    glSvc.postPayroll.mockResolvedValue({ ok: false, error: { code: 'INTERNAL', message: 'GL error' } });
    const res = await app.inject({
      method: 'POST', url: '/finance/gl/post-payroll',
      payload: { payrollId: 1, gross: 10000, postedBy: 1 },
    });
    expect(res.statusCode).toBe(500);
  });

  it('returns 200 with balanced trial balance when ACCOUNTANT requests it', async () => {
    const res = await app.inject({ method: 'GET', url: '/finance/gl/trial-balance' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).data.balanced).toBe(true);
  });

  it('returns 200 with empty ledger when account code has no entries', async () => {
    const res = await app.inject({ method: 'GET', url: '/finance/gl/ledger/4100' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).data.accountCode).toBe('4100');
  });
});
