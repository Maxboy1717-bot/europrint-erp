/**
 * test/finance/create-budget.handler.spec.ts
 *
 * Unit tests for CreateBudgetHandler. IFinanceRepo is mocked; the Budget
 * aggregate and totalPlanned reduction logic are real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CreateBudgetHandler } from '../../src/modules/finance/application/commands/create-budget.handler';
import {
  CreateBudgetCommand,
  BudgetLineInput,
} from '../../src/modules/finance/application/commands/create-budget.command';
import { BudgetStatus } from '../../src/modules/finance/domain/aggregates/budget.aggregate';
import {
  FINANCE_REPO,
  IFinanceRepo,
} from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(saveOk = true): jest.Mocked<IFinanceRepo> {
  return {
    saveBudget: jest.fn().mockResolvedValue(
      saveOk ? Ok({ id: 'new-id' }) : Err(AppErr('DB_ERROR', 'insert failed')),
    ),
    findBudgetById: jest.fn(),
    updateBudgetStatus: jest.fn(),
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
    updateActuals: jest.fn(),
    getBudgetStats: jest.fn(),
  } as unknown as jest.Mocked<IFinanceRepo>;
}

async function buildHandler(repo: IFinanceRepo): Promise<CreateBudgetHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CreateBudgetHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(CreateBudgetHandler);
}

function buildLines(): BudgetLineInput[] {
  return [
    { category: 'salary', description: 'Engineers', plannedAmount: 60_000_000 },
    { category: 'rent', description: 'Office', plannedAmount: 40_000_000 },
  ];
}

describe('CreateBudgetHandler', () => {
  it('creates budget in DRAFT state with summed totalPlanned', async () => {
    const repo = makeRepo();
    const handler = await buildHandler(repo);
    const cmd = new CreateBudgetCommand(
      'FY2026 OPEX', 2026, null, 'Finance', buildLines(), null, 'user-1',
    );

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe(BudgetStatus.DRAFT);
      expect(result.data.totalPlanned).toBe(100_000_000);
      expect(result.data.totalActual).toBe(0);
    }
  });

  it('returns INTERNAL when saveBudget fails', async () => {
    const repo = makeRepo(false);
    const handler = await buildHandler(repo);
    const cmd = new CreateBudgetCommand(
      'X', 2026, null, null, buildLines(), null, 'user-1',
    );

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL');
  });

  it('passes serialized line rows with cuid ids to repository', async () => {
    const repo = makeRepo();
    const handler = await buildHandler(repo);
    const cmd = new CreateBudgetCommand(
      'Q1', 2026, 1, null, buildLines(), 'memo', 'user-7',
    );

    await handler.execute(cmd);

    const [, linesArg] = (repo.saveBudget as jest.Mock).mock.calls[0];
    expect(linesArg).toHaveLength(2);
    expect(linesArg[0]).toEqual(
      expect.objectContaining({
        category: 'salary',
        plannedAmount: '60000000',
        actualAmount: '0',
      }),
    );
  });

  it('initialises totalPlanned to zero when lines array is empty', async () => {
    const repo = makeRepo();
    const handler = await buildHandler(repo);
    const cmd = new CreateBudgetCommand(
      'Empty', 2026, null, null, [], null, 'user-1',
    );

    const result = await handler.execute(cmd);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.totalPlanned).toBe(0);
  });

  it('persists creator id and metadata onto saved budget row', async () => {
    const repo = makeRepo();
    const handler = await buildHandler(repo);
    const cmd = new CreateBudgetCommand(
      'FY2027', 2027, 2, 'Sales', buildLines(), 'audit note', 'user-42',
    );

    await handler.execute(cmd);

    const [budgetArg] = (repo.saveBudget as jest.Mock).mock.calls[0];
    expect(budgetArg).toEqual(
      expect.objectContaining({
        name: 'FY2027',
        fiscalYear: 2027,
        quarter: 2,
        department: 'Sales',
        status: BudgetStatus.DRAFT,
        createdBy: 'user-42',
        notes: 'audit note',
      }),
    );
  });
});
