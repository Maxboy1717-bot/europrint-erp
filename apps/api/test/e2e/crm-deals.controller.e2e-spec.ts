/**
 * @module crm-deals.controller.e2e-spec
 * @description E2E tests for CrmDealsController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CrmDealsController } from '../../src/modules/crm/presentation/crm-deals.controller';
import { DealsService } from '../../src/modules/crm/deals/deals.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';

interface BusMock { execute: jest.Mock }
interface ServiceMock {
  findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock; update: jest.Mock; remove: jest.Mock;
}

describe('CrmDealsController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: BusMock; let queryBus: BusMock; let svc: ServiceMock;
  let rolesAllowed = true;

  beforeAll(async () => {
    commandBus = { execute: jest.fn() }; queryBus = { execute: jest.fn() };
    svc = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [CrmDealsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: DealsService, useValue: svc },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (): boolean => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 5, role: 'SALES_MANAGER' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; });

  it('returns 200 with deals list when sales role queries deals endpoint', async () => {
    svc.findAll.mockResolvedValue({ ok: true, data: { items: [{ id: 1 }], total: 1 } });
    const res = await app.inject({ method: 'GET', url: '/crm/deals' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard denies non-sales access', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/crm/deals' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with deal detail when deal id is found', async () => {
    svc.findOne.mockResolvedValue({ ok: true, data: { id: 11 } });
    const res = await app.inject({ method: 'GET', url: '/crm/deals/11' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).id).toBe(11);
  });

  it('returns 404 not found when deal id does not exist in service', async () => {
    svc.findOne.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'gone' } });
    const res = await app.inject({ method: 'GET', url: '/crm/deals/404' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 201 created when create succeeds with valid deal dto', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { id: 22 } });
    const res = await app.inject({
      method: 'POST', url: '/crm/deals',
      payload: { companyId: 1, leadId: 2, totalAmount: 1000, expectedClosureDate: '2026-12-01', assignedTo: 3 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns error when create payload fails zod validation with negative amount', async () => {
    const res = await app.inject({
      method: 'POST', url: '/crm/deals',
      payload: { companyId: 1, leadId: 2, totalAmount: -1, expectedClosureDate: '2026-12-01', assignedTo: 3 },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('returns 200 when marking deal as won by sales manager role', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { id: 5, status: 'won' } });
    const res = await app.inject({ method: 'PATCH', url: '/crm/deals/5/won' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 bad request when stage update body misses stageId field', async () => {
    const res = await app.inject({ method: 'PATCH', url: '/crm/deals/1/stage', payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 when deleting an existing deal by id', async () => {
    svc.remove.mockResolvedValue({ ok: true, data: { deleted: true } });
    const res = await app.inject({ method: 'DELETE', url: '/crm/deals/9' });
    expect(res.statusCode).toBe(200);
  });
});
