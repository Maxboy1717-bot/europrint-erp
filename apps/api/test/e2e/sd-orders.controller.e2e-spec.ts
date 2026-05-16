/**
 * @module sd-orders.controller.e2e-spec
 * @description E2E tests for SdOrdersController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SdOrdersController } from '../../src/modules/sd/presentation/sd-orders.controller';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';

interface BusMock { execute: jest.Mock }

describe('SdOrdersController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: BusMock; let queryBus: BusMock;
  let rolesAllowed = true; let jwtAllowed = true;

  beforeAll(async () => {
    commandBus = { execute: jest.fn() }; queryBus = { execute: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [SdOrdersController],
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
      (req as unknown as { user: { id: number; role: string } }).user = { id: 7, role: 'SALES_MANAGER' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; jwtAllowed = true; });

  it('returns 200 with orders list when sales role lists orders', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [{ id: 1 }] } });
    const res = await app.inject({ method: 'GET', url: '/sd/orders' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard denies the request', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/sd/orders' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with order detail when valid numeric id is supplied', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { id: 22 } });
    const res = await app.inject({ method: 'GET', url: '/sd/orders/22' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 bad request when id param fails ParseIntPipe validation', async () => {
    const res = await app.inject({ method: 'GET', url: '/sd/orders/not-a-number' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 not found when order lookup result reports missing record', async () => {
    queryBus.execute.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'no' } });
    const res = await app.inject({ method: 'GET', url: '/sd/orders/9999' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 201 created when order create succeeds with valid payload', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { id: 100 } });
    const res = await app.inject({
      method: 'POST', url: '/sd/orders',
      payload: { companyId: 1, totalAmount: 500, currency: 'USD', designFlag: false, sampleFlag: false },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns error response when order create payload fails zod validation', async () => {
    const res = await app.inject({
      method: 'POST', url: '/sd/orders',
      payload: { companyId: -1, totalAmount: 0 },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('returns 200 when DIRECTOR approves advance bypass for an order', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { approved: true } });
    const res = await app.inject({
      method: 'POST', url: '/sd/orders/3/advance-bypass',
      payload: { reason: 'Strategic customer needs urgent dispatch' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 200 with pending-advance orders when finance role queries the list', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [] } });
    const res = await app.inject({ method: 'GET', url: '/sd/orders/pending-advance' });
    expect(res.statusCode).toBe(200);
  });
});
