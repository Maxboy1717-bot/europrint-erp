/**
 * @module general-legacy-b.spec
 * @description Unit tests for GeneralLegacyBController.
 */

import { Test } from '@nestjs/testing';
import { GeneralLegacyBController } from '../../src/modules/legacy/controllers/general-legacy-b.controller';
import { LegacyService } from '../../src/modules/legacy/services/legacy.service';
import { LegacyIotService } from '../../src/modules/legacy/services/legacy-iot.service';
import { LmsRepository } from '../../src/modules/lms/infrastructure/repositories/drizzle-lms.repo';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { InternalServerErrorException } from '@nestjs/common';

const ok = <T>(data: T) => ({ ok: true as const, data });
const err = (code = 'DB_ERROR', message = 'fail') => ({ ok: false as const, error: { code, message } });
const allow = { canActivate: () => true };

describe('GeneralLegacyBController', () => {
  let ctrl: GeneralLegacyBController;
  let svc: jest.Mocked<Partial<LegacyService>>;
  let iotSvc: jest.Mocked<Partial<LegacyIotService>>;
  let lms: { findAllCourses: jest.Mock; findEnrollmentsByUser: jest.Mock };

  beforeEach(async () => {
    svc = {
      getOrdersByDate: jest.fn(), getWarehouseStock: jest.fn(),
      getWarehouseTransfers: jest.fn(), getWarehouseLots: jest.fn(),
      getWarehouseInternalRequests: jest.fn(), getWarehouseOccupancy: jest.fn(),
      getSalaryBenchmark: jest.fn(), getCertificatesUser: jest.fn(),
      getSafetyViolationsUser: jest.fn(), getDisciplineUser: jest.fn(),
    };
    iotSvc = {
      getIotDashboardStats: jest.fn(), getIotProductionSessions: jest.fn(),
      getIotDowntimeEvents: jest.fn(), getIotTabletDefectReasons: jest.fn(),
      getProductionOrdersReport: jest.fn(), getPpProductionOrders: jest.fn(),
      getProducts: jest.fn(), getTechnologyCards: jest.fn(),
    };
    lms = { findAllCourses: jest.fn(), findEnrollmentsByUser: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [GeneralLegacyBController],
      providers: [
        { provide: LegacyService, useValue: svc },
        { provide: LegacyIotService, useValue: iotSvc },
        { provide: LmsRepository, useValue: lms },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(allow)
      .overrideGuard(RolesGuard).useValue(allow)
      .compile();
    ctrl = mod.get(GeneralLegacyBController);
  });

  it('getOrdersByDate returns service data', async () => {
    (svc.getOrdersByDate as jest.Mock).mockResolvedValue(ok([{ id: 'o1' }]));
    expect(await ctrl.getOrdersByDate({})).toEqual([{ id: 'o1' }]);
  });

  it('getWarehouseStock forwards warehouseId from query', async () => {
    (svc.getWarehouseStock as jest.Mock).mockResolvedValue(ok([]));
    await ctrl.getWarehouseStock({ warehouseId: 'w1' });
    expect(svc.getWarehouseStock).toHaveBeenCalledWith('w1');
  });

  it('getSalaryBenchmark throws on service error', async () => {
    (svc.getSalaryBenchmark as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getSalaryBenchmark()).rejects.toThrow(InternalServerErrorException);
  });

  it('getProgressUser computes percentage from enrollments', async () => {
    lms.findAllCourses.mockResolvedValue(ok({ items: [{ id: 'c1' }, { id: 'c2' }] }));
    lms.findEnrollmentsByUser.mockResolvedValue(ok({ items: [
      { id: 'e1', status: 'completed' },
      { id: 'e2', status: 'in_progress' },
    ] }));
    const res = await ctrl.getProgressUser('u1');
    expect(res.progress).toBe(50);
    expect(res.courses).toHaveLength(2);
    expect(res.enrollments).toHaveLength(2);
  });

  it('getProgressUser returns 0 when no enrollments', async () => {
    lms.findAllCourses.mockResolvedValue(ok({ items: [] }));
    lms.findEnrollmentsByUser.mockResolvedValue(ok({ items: [] }));
    const res = await ctrl.getProgressUser('u1');
    expect(res.progress).toBe(0);
  });

  it('getProgressUser handles repo errors gracefully', async () => {
    lms.findAllCourses.mockResolvedValue(err());
    lms.findEnrollmentsByUser.mockResolvedValue(err());
    const res = await ctrl.getProgressUser();
    expect(res).toEqual({ courses: [], enrollments: [], progress: 0, skills: [] });
  });

  it('getAbcAnalysisUser returns stub category', async () => {
    expect(await ctrl.getAbcAnalysisUser('u1')).toEqual({ category: 'A', score: 85 });
  });

  it('getIotDashboardStats returns service data after assertOk', async () => {
    (iotSvc.getIotDashboardStats as jest.Mock).mockResolvedValue(ok({ oee: 0.85 }));
    expect(await ctrl.getIotDashboardStats()).toEqual({ oee: 0.85 });
  });

  it('getIotDashboardStats throws on service error', async () => {
    (iotSvc.getIotDashboardStats as jest.Mock).mockResolvedValue(err());
    await expect(ctrl.getIotDashboardStats()).rejects.toThrow();
  });

  it('createAttendance returns id and merged body', async () => {
    const res = await ctrl.createAttendance({ employeeId: 'e1' });
    expect(res).toMatchObject({ employeeId: 'e1', created: true });
    expect(res).toHaveProperty('id');
  });

  it('getProducts forwards to iot service', async () => {
    (iotSvc.getProducts as jest.Mock).mockResolvedValue(ok([{ id: 'p1' }]));
    expect(await ctrl.getProducts({})).toEqual([{ id: 'p1' }]);
  });
});
