/**
 * @module crm-leads.controller.e2e-spec
 * @description E2E tests for CrmLeadsController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CrmLeadsController } from '../../src/modules/crm/presentation/crm-leads.controller';
import { LeadsService } from '../../src/modules/crm/leads/leads.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface CommandBusMock { execute: jest.Mock }
interface LeadsServiceMock {
  findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock; update: jest.Mock;
}

describe('CrmLeadsController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: CommandBusMock;
  let leadsService: LeadsServiceMock;
  let rolesAllowed = true;
  let jwtAllowed = true;
  let currentRole = 'sales_manager';

  beforeAll(async () => {
    commandBus = { execute: jest.fn() };
    leadsService = {
      findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [CrmLeadsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: LeadsService, useValue: leadsService },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (): boolean => jwtAllowed })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 1, role: currentRole };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => {
    jest.clearAllMocks();
    rolesAllowed = true; jwtAllowed = true; currentRole = 'sales_manager';
  });

  it('returns 200 with leads list when sales_manager queries the endpoint', async () => {
    leadsService.findAll.mockResolvedValue({ ok: true, data: { items: [{ id: 1 }], total: 1 } });
    const res = await app.inject({ method: 'GET', url: '/crm/leads' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).items[0].id).toBe(1);
  });

  it('returns 403 forbidden when JWT guard rejects the unauthenticated request', async () => {
    jwtAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/crm/leads' });
    expect(res.statusCode).toBe(403);
    jwtAllowed = true;
  });

  it('returns 403 forbidden when role guard rejects a non-sales role', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/crm/leads' });
    expect(res.statusCode).toBe(403);
    rolesAllowed = true;
  });

  it('returns 200 with lead detail when get by id finds the record', async () => {
    leadsService.findOne.mockResolvedValue({ ok: true, data: { id: 42, name: 'Acme' } });
    const res = await app.inject({ method: 'GET', url: '/crm/leads/42' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).id).toBe(42);
  });

  it('returns 404 not found when lead with given id does not exist', async () => {
    leadsService.findOne.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'no' } });
    const res = await app.inject({ method: 'GET', url: '/crm/leads/999' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with new lead when create succeeds with valid payload', async () => {
    leadsService.create.mockResolvedValue({ ok: true, data: { id: 7 } });
    const res = await app.inject({ method: 'POST', url: '/crm/leads', payload: { firstName: 'Ali', lastName: 'Vali', phone: '+998901112233' } });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 bad request when create handler reports validation error', async () => {
    leadsService.create.mockResolvedValue({ ok: false, error: { code: 'VALIDATION', message: 'bad' } });
    const res = await app.inject({ method: 'POST', url: '/crm/leads', payload: { firstName: '' } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 when patching lead stage to a new status value', async () => {
    leadsService.update.mockResolvedValue({ ok: true, data: { id: 1, status: 'qualified' } });
    const res = await app.inject({ method: 'PATCH', url: '/crm/leads/1/stage', payload: { statusId: 'QUALIFIED' } });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 when qualifying a lead via command bus', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { dealId: 99 } });
    const res = await app.inject({ method: 'PATCH', url: '/crm/leads/1/qualify', payload: { expectedDealAmount: 1000 } });
    expect(res.statusCode).toBe(200);
  });
});
