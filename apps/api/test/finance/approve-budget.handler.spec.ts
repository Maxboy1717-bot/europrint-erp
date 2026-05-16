/**
 * test/finance/approve-budget.handler.spec.ts
 *
 * Unit tests for ApproveBudgetHandler. IFinanceRepo is mocked; the Budget
 * aggregate is real and exercises its DRAFT/PENDING/APPROVED state machine.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ApproveBudgetHandler } from '../../src/modules/finance/application/commands/approve-budget.handler';
import { ApproveBudgetCommand } from '../../src/modules/finance/application/commands/approve-budget.command';
import {
  BudgetStatus,
} from '../../src/modules/finance/domain/aggregates/budget.aggregate';
import {
  FINANCE_REPO,
  IFinanceRepo,
} from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

interface BudgetRow {
  id: string;
  name: string;
  fiscalYear: number;
  quarter: number | null;
  department: string | null;
  status: BudgetStatus;
  lines: unknown[];
  totalPlanned: string | number;
  totalActual: string | number;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function makeBudgetRow(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: 'bud-123',
    name: 'FY2026 OPEX',
    fiscalYear: 2026,
    quarter: null,
    department: 'Finance',
    status: BudgetStatus.PENDING_APPROVAL,
    lines: [],
    totalPlanned: '100000000',
    totalActual: '0',
    createdBy: 'user-1',
    approvedBy: null,
    approvedAt: null,
    notes: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeRepo(row: BudgetRow | null): jest.Mocked<IFinanceRepo> {
  const findResult = row
    ? Ok(row as unknown as Record<string, unknown>)
    : Err(AppErr('NOT_FOUND', 'Budget not found'));
  return {
    findBudgetById: jest.fn().mockResolvedValue(findResult),
    updateBudgetStatus: jest.fn().mockResolvedValue(Ok({ id: row?.id ?? '' })),
    findInvoiceById: jest.fn(),
    findInvoices: jest.fn(),
    findInvoiceBySalesOrderId: jest.fn(),
    saveInvoice: jest.fn(),
    updateInvoice: jest.fn(),
    findPayments: jest.fn(),
    savePayment: jest.fn(),
    saveGlEntry: jest.fn(),
    findGlEntries: jest.fn(),
    getArAging: jest.fn(),
    getCashFlow: jest.fn(),
    getAdvanceSummary: jest.fn(),
    findBudgets: jest.fn(),
    saveBudget: jest.fn(),
    updateActuals: jest.fn(),
    getBudgetStats: jest.fn(),
  } as unknown as jest.Mocked<IFinanceRepo>;
}

async function buildHandler(repo: IFinanceRepo): Promise<ApproveBudgetHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ApproveBudgetHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(ApproveBudgetHandler);
}

describe('ApproveBudgetHandler', () => {
  const cmd = new ApproveBudgetCommand('bud-123', 'user-99');

  it('returns NOT_FOUND when budget does not exist', async () => {
    const repo = makeRepo(null);
    const handler = await buildHandler(repo);

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Budget not found');
    }
  });

  it('returns VALIDATION when budget is not in PENDING_APPROVAL state', async () => {
    const repo = makeRepo(makeBudgetRow({ status: BudgetStatus.DRAFT }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION');
      expect(repo.updateBudgetStatus).not.toHaveBeenCalled();
    }
  });

  it('approves budget when pending approval', async () => {
    const repo = makeRepo(makeBudgetRow({ status: BudgetStatus.PENDING_APPROVAL }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe(BudgetStatus.APPROVED);
      expect(result.data.approvedBy).toBe('user-99');
      expect(result.data.approvedAt).toBeInstanceOf(Date);
    }
  });

  it('persists new status when approval succeeds', async () => {
    const repo = makeRepo(makeBudgetRow({ status: BudgetStatus.PENDING_APPROVAL }));
    const handler = await buildHandler(repo);

    await handler.execute(cmd);

    expect(repo.updateBudgetStatus).toHaveBeenCalledWith('bud-123', BudgetStatus.APPROVED);
  });

  it('returns INTERNAL when persistence of approved status fails', async () => {
    const repo = makeRepo(makeBudgetRow({ status: BudgetStatus.PENDING_APPROVAL }));
    (repo.updateBudgetStatus as jest.Mock).mockResolvedValue(
      Err(AppErr('DB_ERROR', 'connection lost')),
    );
    const handler = await buildHandler(repo);

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL');
  });
});
