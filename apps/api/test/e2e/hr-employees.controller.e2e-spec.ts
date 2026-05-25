/**
 * @module hr-employees.controller.e2e-spec
 * @description E2E tests for HrEmployeesController.
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HrEmployeesController } from '../../src/modules/hr/presentation/hr-employees.controller';
import { HR_REPO } from '../../src/modules/hr/domain/repositories/i-hr.repo';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface BusMock { execute: jest.Mock }
interface HrRepoMock {
  findEmployeeById: jest.Mock; saveEmployee: jest.Mock; updateEmployee: jest.Mock;
  getAttendanceStats: jest.Mock; getLeaveBalance: jest.Mock;
}

describe('HrEmployeesController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: BusMock; let queryBus: BusMock; let hrRepo: HrRepoMock;
  let rolesAllowed = true;

  beforeAll(async () => {
    commandBus = { execute: jest.fn() }; queryBus = { execute: jest.fn() };
    hrRepo = {
      findEmployeeById: jest.fn(), saveEmployee: jest.fn(), updateEmployee: jest.fn(),
      getAttendanceStats: jest.fn(), getLeaveBalance: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [HrEmployeesController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: HR_REPO, useValue: hrRepo },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(RolesGuard).useValue({ canActivate: (): boolean => rolesAllowed })
      .overrideGuard(ThrottlerGuard).useValue({ canActivate: (): boolean => true })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.getHttpAdapter().getInstance().addHook('onRequest', (req, _reply, done) => {
      (req as unknown as { user: { id: number; role: string } }).user = { id: 1, role: 'HR_MANAGER' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; });

  it('returns 200 with employees list when HR_MANAGER queries the endpoint', async () => {
    queryBus.execute.mockResolvedValue({ ok: true, data: { items: [{ id: '1' }] } });
    const res = await app.inject({ method: 'GET', url: '/hr/employees' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard denies non-HR user', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/hr/employees' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with employee detail when employee id is found', async () => {
    hrRepo.findEmployeeById.mockResolvedValue({ ok: true, data: { id: 'emp-1', firstName: 'Ali' } });
    const res = await app.inject({ method: 'GET', url: '/hr/employees/emp-1' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 not found when employee id does not exist', async () => {
    hrRepo.findEmployeeById.mockResolvedValue({ ok: true, data: null });
    const res = await app.inject({ method: 'GET', url: '/hr/employees/missing' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with KPI summary when employee KPI endpoint succeeds', async () => {
    hrRepo.getAttendanceStats.mockResolvedValue({ ok: true, data: { present: 20 } });
    hrRepo.getLeaveBalance.mockResolvedValue({ ok: true, data: { vacation: 5 } });
    const res = await app.inject({ method: 'GET', url: '/hr/employees/emp-2/kpi' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 201 created when HR_MANAGER creates a new employee', async () => {
    hrRepo.saveEmployee.mockResolvedValue({ ok: true, data: { id: 'emp-new' } });
    const res = await app.inject({
      method: 'POST', url: '/hr/employees',
      payload: { firstName: 'Bek', lastName: 'Aliev', salary: 5000000 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 bad request when create employee payload has negative salary', async () => {
    const res = await app.inject({
      method: 'POST', url: '/hr/employees',
      payload: { firstName: 'A', salary: -1 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 when updating employee status to a valid enum value', async () => {
    hrRepo.updateEmployee.mockResolvedValue({ ok: true, data: { id: 'emp-1', status: 'on_leave' } });
    const res = await app.inject({
      method: 'PATCH', url: '/hr/employees/emp-1/status',
      payload: { status: 'on_leave' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 bad request when status field is not in allowed enum', async () => {
    const res = await app.inject({
      method: 'PATCH', url: '/hr/employees/emp-1/status',
      payload: { status: 'invalid_status' },
    });
    expect(res.statusCode).toBe(400);
  });
});
