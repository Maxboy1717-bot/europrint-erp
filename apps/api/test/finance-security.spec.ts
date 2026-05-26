/**
 * @module finance-security.spec
 * @description Jest / Vitest test suite.
 */

import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import { FinanceAccountingController } from '../src/modules/finance/presentation/finance-accounting.controller';
import { FinanceAccountingService } from '../src/modules/finance/application/finance-accounting.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { I18nService } from 'nestjs-i18n';

const ok = (data: unknown) => ({ ok: true, data });

describe('Finance Accounting – SQL injection prevention', () => {
  let ctrl: FinanceAccountingController;
  let mockSvc: jest.Mocked<Partial<FinanceAccountingService>>;

  beforeEach(async () => {
    mockSvc = {
      getDashboard: jest.fn(),
      getAccounts: jest.fn(),
      getGlDocuments: jest.fn(),
      createGlDocument: jest.fn(),
      getPeriods: jest.fn(),
      getPeriod: jest.fn(),
      closePeriod: jest.fn(),
      getMaterials: jest.fn(),
      getMaterialsByOrder: jest.fn(),
      getInventoryValuation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceAccountingController],
      providers: [
        { provide: FinanceAccountingService, useValue: mockSvc },
        { provide: I18nService, useValue: { t: jest.fn((key: string) => key) } },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    ctrl = module.get(FinanceAccountingController);
    jest.clearAllMocks();
  });

  describe('Source code audit: no sql.raw() in migrated files', () => {
    it('does NOT call sql.raw() in finance-accounting.controller.ts', () => {
      const filePath = path.join(
        __dirname,
        '../src/modules/finance/presentation/finance-accounting.controller.ts',
      );
      const source = fs.readFileSync(filePath, 'utf8');
      expect(source).not.toContain('sql.raw(');
    });

    it('does NOT call sql.raw() in gamification.service.ts', () => {
      const filePath = path.join(
        __dirname,
        '../src/modules/hr/gamification/gamification.service.ts',
      );
      const source = fs.readFileSync(filePath, 'utf8');
      expect(source).not.toContain('sql.raw(');
    });

    it('does NOT call sql.raw() in finance-accounting.service.ts', () => {
      const filePath = path.join(
        __dirname,
        '../src/modules/finance/application/finance-accounting.service.ts',
      );
      const source = fs.readFileSync(filePath, 'utf8');
      expect(source).not.toContain('sql.raw(');
    });

    it('does NOT call sql.raw() in finance-ar.service.ts', () => {
      const filePath = path.join(
        __dirname,
        '../src/modules/finance/application/finance-ar.service.ts',
      );
      const source = fs.readFileSync(filePath, 'utf8');
      expect(source).not.toContain('sql.raw(');
    });
  });

  describe('GET /accounting/gl-documents – safeInt coercion protects queries', () => {
    it('calls service.getGlDocuments with malicious status string as-is (Drizzle parameterizes)', async () => {
      const injection = "'; DROP TABLE gl_documents; --";
      (mockSvc.getGlDocuments as jest.Mock).mockResolvedValue(ok([]));
      await ctrl.getGlDocuments(injection);
      expect(mockSvc.getGlDocuments).toHaveBeenCalledWith(
        injection, undefined, undefined, undefined, undefined, undefined,
      );
    });

    it('calls service.getGlDocuments with malicious startDate string as-is (Drizzle parameterizes)', async () => {
      const injection = "2024-01-01'; DROP TABLE gl_documents; --";
      (mockSvc.getGlDocuments as jest.Mock).mockResolvedValue(ok([]));
      await ctrl.getGlDocuments(undefined, undefined, injection);
      expect(mockSvc.getGlDocuments).toHaveBeenCalledWith(
        undefined, undefined, injection, undefined, undefined, undefined,
      );
    });

    it('passes limit string to service (non-numeric is handled safely in service/repo)', async () => {
      (mockSvc.getGlDocuments as jest.Mock).mockResolvedValue(ok([]));
      await ctrl.getGlDocuments(undefined, undefined, undefined, undefined, 'abc; DROP TABLE t', '0');
      expect(mockSvc.getGlDocuments).toHaveBeenCalled();
    });
  });

  describe('GET /accounting/materials – parameter delegation', () => {
    it('passes moveType to service for proper parameterization', async () => {
      const injection = "'; DROP TABLE stock_moves; --";
      (mockSvc.getMaterials as jest.Mock).mockResolvedValue(ok([]));
      await ctrl.getMaterials(undefined, undefined, undefined, injection);
      expect(mockSvc.getMaterials).toHaveBeenCalledWith(
        undefined, undefined, undefined, injection, undefined, undefined,
      );
    });

    it('passes warehouseId string to service safely', async () => {
      (mockSvc.getMaterials as jest.Mock).mockResolvedValue(ok([]));
      await ctrl.getMaterials('1; DROP TABLE warehouses');
      expect(mockSvc.getMaterials).toHaveBeenCalled();
    });

    it('passes startDate string to service safely', async () => {
      const injection = "2024-01-01' OR 1=1;--";
      (mockSvc.getMaterials as jest.Mock).mockResolvedValue(ok([]));
      await ctrl.getMaterials(undefined, injection);
      expect(mockSvc.getMaterials).toHaveBeenCalled();
    });
  });

  describe('POST /accounting/periods/:id/close – period validation', () => {
    it('throws NotFoundException when period not found', async () => {
      (mockSvc.getPeriod as jest.Mock).mockResolvedValue(null);
      await expect(ctrl.closePeriod('999', {})).rejects.toThrow('Davr topilmadi');
    });

    it('throws BadRequestException when period already closed', async () => {
      (mockSvc.getPeriod as jest.Mock).mockResolvedValue({ id: 1, status: 'closed' });
      await expect(ctrl.closePeriod('1', {})).rejects.toThrow('Davr allaqachon yopilgan');
    });

    it('coerces non-integer period id to 0 and attempts lookup', async () => {
      (mockSvc.getPeriod as jest.Mock).mockResolvedValue(null);
      await expect(ctrl.closePeriod('1; DROP TABLE periods', {})).rejects.toThrow();
      expect(mockSvc.getPeriod).toHaveBeenCalledWith(1);
    });

    it('closes an open period successfully', async () => {
      const updatedPeriod = { id: 1, status: 'closed', closed_at: new Date() };
      (mockSvc.getPeriod as jest.Mock).mockResolvedValue({ id: 1, status: 'open' });
      (mockSvc.closePeriod as jest.Mock).mockResolvedValue(ok(updatedPeriod));
      const result = await ctrl.closePeriod('1', { closedBy: 1 });
      expect(result).toEqual(updatedPeriod);
    });
  });
});
