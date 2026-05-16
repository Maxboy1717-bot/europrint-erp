/**
 * @module hr-payroll.controller.e2e-spec
 * @description E2E tests for HrPayrollController.
 */

import 'reflect-metadata';

jest.mock('../../src/modules/compatibility/employees-org-assignment.helper', () => ({
  findUserIdByEmployee: jest.fn().mockResolvedValue(42),
  hasAnyOrgAssignment: jest.fn().mockResolvedValue(true),
}));

import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HrPayrollController } from '../../src/modules/hr/presentation/hr-payroll.controller';
import { HR_REPO } from '../../src/modules/hr/domain/repositories/i-hr.repo';
import { RolesGuard } from '../../src/common/guards/roles.guard';

interface BusMock { execute: jest.Mock }
interface HrRepoMock {
  findPayroll: jest.Mock; savePayroll: jest.Mock; updatePayroll: jest.Mock; getPayrollSummary: jest.Mock;
}

describe('HrPayrollController (e2e)', () => {
  let app: NestFastifyApplication;
  let commandBus: BusMock; let queryBus: BusMock; let hrRepo: HrRepoMock;
  let rolesAllowed = true;

  beforeAll(async () => {
    commandBus = { execute: jest.fn() }; queryBus = { execute: jest.fn() };
    hrRepo = {
      findPayroll: jest.fn(), savePayroll: jest.fn(), updatePayroll: jest.fn(), getPayrollSummary: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [HrPayrollController],
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
      (req as unknown as { user: { id: number; role: string } }).user = { id: 3, role: 'PAYROLL_OFFICER' };
      done();
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); rolesAllowed = true; });

  it('returns 200 with payrolls list when payroll officer queries the data', async () => {
    hrRepo.findPayroll.mockResolvedValue({ ok: true, data: [{ id: 'p1' }] });
    const res = await app.inject({ method: 'GET', url: '/hr/payroll' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 forbidden when role guard rejects non-payroll role', async () => {
    rolesAllowed = false;
    const res = await app.inject({ method: 'GET', url: '/hr/payroll' });
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with payroll summary when valid period is requested', async () => {
    hrRepo.getPayrollSummary.mockResolvedValue({
      ok: true, data: { totalGross: 100, totalNet: 80, totalINPS: 8, totalJSHD: 12, employeeCount: 1 },
    });
    const res = await app.inject({ method: 'GET', url: '/hr/payroll/summary/2026-05' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 not found when payroll summary period has no data', async () => {
    hrRepo.getPayrollSummary.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'gone' } });
    const res = await app.inject({ method: 'GET', url: '/hr/payroll/summary/1999-01' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 201 created when calculate payroll succeeds for assigned employee', async () => {
    hrRepo.savePayroll.mockResolvedValue({ ok: true, data: { id: 'pay-1' } });
    const res = await app.inject({
      method: 'POST', url: '/hr/payroll/calculate',
      payload: { employeeId: 1, baseSalary: 1000000, period: '2026-05' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 bad request when calculate payload has missing required baseSalary', async () => {
    const res = await app.inject({
      method: 'POST', url: '/hr/payroll/calculate',
      payload: { employeeId: 1 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 when DIRECTOR approves a payroll record', async () => {
    hrRepo.updatePayroll.mockResolvedValue({ ok: true, data: { id: 'p1', status: 'approved' } });
    const res = await app.inject({ method: 'POST', url: '/hr/payroll/p1/approve' });
    expect(res.statusCode).toBe(201);
  });

  it('returns 201 when DIRECTOR posts payroll record to general ledger', async () => {
    hrRepo.updatePayroll.mockResolvedValue({ ok: true, data: { id: 'p1', status: 'paid' } });
    const res = await app.inject({ method: 'POST', url: '/hr/payroll/p1/post-to-gl' });
    expect(res.statusCode).toBe(201);
  });
});
