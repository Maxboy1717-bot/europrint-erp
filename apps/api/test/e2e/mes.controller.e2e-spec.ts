/**
 * @module mes.controller.e2e-spec
 * @description E2E tests for MesOperationsController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MesOperationsController } from '../../src/modules/mes/presentation/mes-operations.controller';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface BusMock { execute: jest.Mock }

describe('MesOperationsController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: BusMock; let queryBus: BusMock;
  let rolesAllowed = true;

  beforeAll(async () => {
    commandBus = { execute: jest.fn() }; queryBus = { execute: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [MesOperationsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 7, role: 'production_manager' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; });

  it('returns 200 with sessions list when production_manager queries operations', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [{ id: 's1' }] } });
    const res = await app.inject({ method: 'GET', url: '/mes/operations' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard denies the request', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/mes/operations' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with downtime events when query bus returns valid data', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [{ id: 'd1' }] } });
    const res = await app.inject({ method: 'GET', url: '/mes/operations/downtime' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 with reason codes list when operator requests the codes', async () => {
    const res = await app.inject({ method: 'GET', url: '/mes/operations/reason-codes' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(JSON.parse(res.payload))).toBe(true);
  });

  it('returns 201 created when operator records a downtime event', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { id: 'dt-1' } });
    const res = await app.inject({
      method: 'POST', url: '/mes/operations/downtime',
      payload: {
        sessionId: '00000000-0000-0000-0000-000000000001',
        eventType: 'planned',
        reasonCode: 'MAINT',
      },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns error when downtime payload has invalid uuid for sessionId', async () => {
    const res = await app.inject({
      method: 'POST', url: '/mes/operations/downtime',
      payload: { sessionId: 'not-uuid', eventType: 'planned', reasonCode: 'MAINT' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('returns 404 not found when ending downtime event id does not exist', async () => {
    commandBus.execute.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'no' } });
    const res = await app.inject({
      method: 'PATCH', url: '/mes/operations/downtime/missing/end',
      payload: {},
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 201 created when recording downtime for a session via param route', async () => {
    commandBus.execute.mockResolvedValue({ ok: true, data: { id: 'dt-2' } });
    const res = await app.inject({
      method: 'POST', url: '/mes/operations/sess-1/downtime',
      payload: { eventType: 'unplanned', reasonCode: 'BREAK' },
    });
    expect(res.statusCode).toBe(201);
  });
});
