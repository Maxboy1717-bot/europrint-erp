/**
 * @module finance-accounting.spec
 * @description Jest / Vitest test suite.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FinanceAccountingController } from '../src/modules/finance/presentation/finance-accounting.controller';
import { FinancePayrollController } from '../src/modules/finance/presentation/finance-payroll.controller';
import { FinanceArController } from '../src/modules/finance/presentation/finance-ar.controller';
import { FinanceApController } from '../src/modules/finance/presentation/finance-ap.controller';
import { FinanceAccountingService } from '../src/modules/finance/application/finance-accounting.service';
import { FinancePayrollService } from '../src/modules/finance/application/finance-payroll.service';
import { FinanceArService } from '../src/modules/finance/application/finance-ar.service';
import { FinanceApService } from '../src/modules/finance/application/finance-ap.service';
import { JwtAuthGuard } from 'shared/guards/jwt-auth.guard';
import { RolesGuard } from 'shared/guards/roles.guard';

const ok = (data: unknown) => ({ ok: true, data });
const mockGuard = { canActivate: () => true };

describe('Finance Accounting Routes (NestJS migration)', () => {
  let accountingCtrl: FinanceAccountingController;
  let payrollCtrl: FinancePayrollController;
  let arCtrl: FinanceArController;
  let apCtrl: FinanceApController;

  let mockAccountingSvc: jest.Mocked<Partial<FinanceAccountingService>>;
  let mockPayrollSvc: jest.Mocked<Partial<FinancePayrollService>>;
  let mockArSvc: jest.Mocked<Partial<FinanceArService>>;
  let mockApSvc: jest.Mocked<Partial<FinanceApService>>;

  beforeEach(async () => {
    mockAccountingSvc = {
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
    mockPayrollSvc = {
      byDepartment: jest.fn(),
      byBrigade: jest.fn(),
      taxSummary: jest.fn(),
    };
    mockArSvc = {
      getAgingBuckets: jest.fn(),
      getOverdue: jest.fn(),
      recalculateAging: jest.fn(),
    };
    mockApSvc = {
      getAgingBuckets: jest.fn(),
      getOverdue: jest.fn(),
      recalculateAging: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        FinanceAccountingController,
        FinancePayrollController,
        FinanceArController,
        FinanceApController,
      ],
      providers: [
        { provide: FinanceAccountingService, useValue: mockAccountingSvc },
        { provide: FinancePayrollService, useValue: mockPayrollSvc },
        { provide: FinanceArService, useValue: mockArSvc },
        { provide: FinanceApService, useValue: mockApSvc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();

    accountingCtrl = module.get(FinanceAccountingController);
    payrollCtrl = module.get(FinancePayrollController);
    arCtrl = module.get(FinanceArController);
    apCtrl = module.get(FinanceApController);
  });

  describe('GET /accounting/dashboard', () => {
    it('returns structured dashboard data', async () => {
      const dashRow = {
        gl_total: '150', gl_posted: '120', gl_entries: '500',
        periods_open: '2', periods_closed: '10',
        ar_total: '1000000', ar_unpaid: '300000',
        ap_total: '800000', ap_unpaid: '200000',
      };
      (mockAccountingSvc.getDashboard as jest.Mock).mockResolvedValue(dashRow);

      const result = await accountingCtrl.getDashboard();
      expect(result).toMatchObject({
        glDocuments: { total: 150, posted: 120 },
        glEntries: 500,
        periods: { open: 2, closed: 10 },
        accountsReceivable: { total: 1000000, unpaid: 300000 },
        accountsPayable: { total: 800000, unpaid: 200000 },
      });
    });

    it('handles empty database gracefully', async () => {
      (mockAccountingSvc.getDashboard as jest.Mock).mockResolvedValue({});
      const result = await accountingCtrl.getDashboard();
      expect(result.glDocuments.total).toBe(0);
      expect(result.accountsReceivable.unpaid).toBe(0);
    });
  });

  describe('GET /accounting/periods', () => {
    it('returns accounting periods list', async () => {
      const periods = [
        { id: 1, fiscal_year: 2024, month: 1, status: 'closed' },
        { id: 2, fiscal_year: 2024, month: 2, status: 'open' },
      ];
      (mockAccountingSvc.getPeriods as jest.Mock).mockResolvedValue(ok(periods));
      const result = await accountingCtrl.getPeriods();
      expect(result).toEqual(periods);
    });
  });

  describe('POST /accounting/periods/:id/close', () => {
    it('throws NotFoundException when period not found', async () => {
      (mockAccountingSvc.getPeriod as jest.Mock).mockResolvedValue(null);
      await expect(accountingCtrl.closePeriod('999', {})).rejects.toThrow('Davr topilmadi');
    });

    it('throws BadRequestException when period already closed', async () => {
      (mockAccountingSvc.getPeriod as jest.Mock).mockResolvedValue({ id: 1, status: 'closed' });
      await expect(accountingCtrl.closePeriod('1', {})).rejects.toThrow('Davr allaqachon yopilgan');
    });

    it('closes an open period successfully', async () => {
      const updatedPeriod = { id: 1, status: 'closed', closed_at: new Date() };
      (mockAccountingSvc.getPeriod as jest.Mock).mockResolvedValue({ id: 1, status: 'open' });
      (mockAccountingSvc.closePeriod as jest.Mock).mockResolvedValue(ok(updatedPeriod));
      const result = await accountingCtrl.closePeriod('1', { closedBy: 1 });
      expect(result).toEqual(updatedPeriod);
    });
  });

  describe('GET /accounting/inventory-valuation', () => {
    it('returns materials with summary', async () => {
      const materials = [{ id: 1, name: "Qog'oz", current_stock: 100, unit_price: 5000 }];
      const summary = { totalItems: 1, totalStock: 100, totalValue: 500000 };
      (mockAccountingSvc.getInventoryValuation as jest.Mock).mockResolvedValue({ materials, summary });
      const result = await accountingCtrl.getInventoryValuation();
      expect(result.materials).toHaveLength(1);
      expect(result.summary.totalItems).toBe(1);
    });
  });

  describe('GET /payroll/by-department', () => {
    it('returns payroll grouped by department', async () => {
      const rows = [
        { department_id: 1, department_name: 'Bosim', employee_count: '10', total_salary: '50000000' },
      ];
      (mockPayrollSvc.byDepartment as jest.Mock).mockResolvedValue(ok(rows));
      const result = await payrollCtrl.byDepartment();
      expect(result).toEqual(rows);
    });
  });

  describe('GET /payroll/tax-summary', () => {
    it('calculates INPS and JSHD taxes correctly', async () => {
      const grossSalary = 100000000;
      const inpsTotal = Math.round(grossSalary * 0.12);
      const jshdTotal = Math.round((grossSalary - inpsTotal) * 0.12);
      const taxData = { employeeCount: 10, grossSalary, netSalary: 88000000, inpsTotal, jshdTotal };
      (mockPayrollSvc.taxSummary as jest.Mock).mockResolvedValue(ok(taxData));
      const result = await payrollCtrl.taxSummary();
      expect(result.inpsTotal).toBe(inpsTotal);
      expect(result.jshdTotal).toBe(jshdTotal);
      expect(result.grossSalary).toBe(grossSalary);
    });
  });

  describe('GET /ar/aging', () => {
    it('returns AR aging buckets with totals', async () => {
      const buckets = [{ id: 1, customer_id: 'Acme', total_outstanding: 500000 }];
      const totals = { current: '200000', days31to60: '150000', days61to90: '100000', days91to120: '50000', over120: '0', total_outstanding: '500000' };
      (mockArSvc.getAgingBuckets as jest.Mock).mockResolvedValue(ok({ buckets, totals }));
      const result = await arCtrl.getAgingBuckets();
      expect(result.buckets).toHaveLength(1);
      expect(result.totals.totalOutstanding).toBe(500000);
    });

    it('maps days61to90 from the correct field (not days61to60 typo)', async () => {
      const buckets: unknown[] = [];
      const totals = { current: '100', days31to60: '200', days61to90: '999', days91to120: '0', over120: '0', total_outstanding: '1299' };
      (mockArSvc.getAgingBuckets as jest.Mock).mockResolvedValue(ok({ buckets, totals }));
      const result = await arCtrl.getAgingBuckets();
      expect(result.totals.days61to90).toBe(999);
      expect(result.totals.days31to60).toBe(200);
    });
  });

  describe('GET /ar/overdue', () => {
    it('returns overdue sales invoices', async () => {
      const rows = [{ id: 1, customer_name: 'Acme', payment_status: 'unpaid' }];
      (mockArSvc.getOverdue as jest.Mock).mockResolvedValue(ok(rows));
      const result = await arCtrl.getOverdue();
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /ap/aging', () => {
    it('returns AP aging buckets with totals', async () => {
      const buckets = [{ id: 1, vendor_id: null, total_outstanding: 300000 }];
      const totals = { current: '300000', days31to60: '0', days61to90: '0', days91to120: '0', over120: '0', total_outstanding: '300000' };
      (mockApSvc.getAgingBuckets as jest.Mock).mockResolvedValue(ok({ buckets, totals }));
      const result = await apCtrl.getAgingBuckets();
      expect(result.totals.totalOutstanding).toBe(300000);
    });
  });
});
