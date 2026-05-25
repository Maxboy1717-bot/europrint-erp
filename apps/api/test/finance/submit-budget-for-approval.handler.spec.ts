/**
 * test/finance/submit-budget-for-approval.handler.spec.ts
 *
 * Unit tests for SubmitBudgetForApprovalHandler. IFinanceRepo is mocked;
 * the Budget aggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SubmitBudgetForApprovalHandler } from '../../src/modules/finance/application/commands/submit-budget-for-approval.handler';
import { SubmitBudgetForApprovalCommand } from '../../src/modules/finance/application/commands/submit-budget-for-approval.command';
import { BudgetStatus } from '../../src/modules/finance/domain/aggregates/budget.aggregate';
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
  totalPlanned: string;
  totalActual: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function makeBudgetRow(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: 'bud-77',
    name: 'Q1 OPEX',
    fiscalYear: 2026,
    quarter: 1,
    department: null,
    status: BudgetStatus.DRAFT,
    lines: [],
    totalPlanned: '50000000',
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

function makeRepo(row: BudgetRow | null, updateOk = true): jest.Mocked<IFinanceRepo> {
  return {
    findBudgetById: jest.fn().mockResolvedValue(
      row ? Ok(row as unknown as Record<string, unknown>) : Err(AppErr('NOT_FOUND', 'not found')),
    ),
    updateBudgetStatus: jest.fn().mockResolvedValue(
      updateOk ? Ok({ id: row?.id ?? '' }) : Err(AppErr('DB_ERROR', 'update failed')),
    ),
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

async function buildHandler(repo: IFinanceRepo): Promise<SubmitBudgetForApprovalHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SubmitBudgetForApprovalHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(SubmitBudgetForApprovalHandler);
}

describe('SubmitBudgetForApprovalHandler', () => {
  const cmd = new SubmitBudgetForApprovalCommand('bud-77');

  it('returns Err when budget is not found', async () => {
    const repo = makeRepo(null);
    const handler = await buildHandler(repo);

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('Budget not found');
  });

  it('rejects when budget is not in DRAFT state', async () => {
    const repo = makeRepo(makeBudgetRow({ status: BudgetStatus.APPROVED }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/draft/i);
    expect(repo.updateBudgetStatus).not.toHaveBeenCalled();
  });

  it('moves DRAFT budget to PENDING_APPROVAL', async () => {
    const repo = makeRepo(makeBudgetRow({ status: BudgetStatus.DRAFT }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe(BudgetStatus.PENDING_APPROVAL);
    expect(repo.updateBudgetStatus).toHaveBeenCalledWith('bud-77', BudgetStatus.PENDING_APPROVAL);
  });

  it('returns Err when status persistence fails', async () => {
    const repo = makeRepo(makeBudgetRow({ status: BudgetStatus.DRAFT }), false);
    const handler = await buildHandler(repo);

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/Failed to update/);
  });

  it('reads existing budget by id from repository', async () => {
    const repo = makeRepo(makeBudgetRow());
    const handler = await buildHandler(repo);

    await handler.execute(cmd);

    expect(repo.findBudgetById).toHaveBeenCalledWith('bud-77');
  });
});
