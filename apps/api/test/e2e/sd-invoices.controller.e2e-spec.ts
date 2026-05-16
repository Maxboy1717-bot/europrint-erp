/**
 * @module sd-invoices.controller.e2e-spec
 * @description E2E tests for SdInvoicesController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SdInvoicesController } from '../../src/modules/sd/presentation/sd-invoices.controller';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface BusMock { execute: jest.Mock }

describe('SdInvoicesController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: BusMock; let queryBus: BusMock;
  let rolesAllowed = true; let jwtAllowed = true;

  beforeAll(async () => {
    commandBus = { execute: jest.fn() }; queryBus = { execute: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [SdInvoicesController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (): boolean => jwtAllowed })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 12, role: 'finance_manager' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; jwtAllowed = true; });

  it('returns 200 with invoices list when finance role queries invoices', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [{ id: 'inv-1' }] } });
    const res = await app.inject({ method: 'GET', url: '/sd/invoices' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when non-finance role tries to query invoices', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/sd/invoices' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with invoice detail when invoice id is found in query bus', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { id: 'inv-7', amount: 100 } });
    const res = await app.inject({ method: 'GET', url: '/sd/invoices/inv-7' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 not found when invoice id does not exist in query bus', async () => {
    queryBus.execute.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'gone' } });
    const res = await app.inject({ method: 'GET', url: '/sd/invoices/missing' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 201 created when invoice create succeeds with valid payload', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { id: 'new-inv' } });
    const res = await app.inject({
      method: 'POST', url: '/sd/invoices',
      payload: {
        salesOrderId: '00000000-0000-0000-0000-000000000001',
        customerName: 'Acme', items: [{ name: 'Box', quantity: 1, unitPrice: 10 }],
        dueDate: '2026-12-31T00:00:00.000Z',
      },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns error when invoice create payload misses required salesOrderId', async () => {
    const res = await app.inject({
      method: 'POST', url: '/sd/invoices',
      payload: { customerName: 'Acme', items: [], dueDate: '2026-12-31T00:00:00.000Z' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('returns 403 forbidden when invoice list is requested without authenticated jwt', async () => {
    jwtAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/sd/invoices' });
    expect(res.statusCode).toBe(403);
  });
});
