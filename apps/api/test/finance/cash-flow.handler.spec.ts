/**
 * test/finance/cash-flow.handler.spec.ts
 *
 * Unit tests for CashFlowHandler. FinanceRepository is mocked; aggregation
 * math is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  CashFlowHandler,
  CashFlowQuery,
} from '../../src/modules/finance/application/queries/cash-flow.handler';
import { FINANCE_REPO } from '../../src/modules/finance/domain/repositories/i-finance.repo';

interface FakeRepo {
  getCashBalance: jest.Mock;
  getSalesReceipts: jest.Mock;
  getOtherReceipts: jest.Mock;
  getExpenses: jest.Mock;
  getPayrollDisbursements: jest.Mock;
  getOtherDisbursements: jest.Mock;
}

function makeRepo(values: Partial<{
  opening: number;
  sales: number;
  other: number;
  expenses: number;
  payroll: number;
  otherOut: number;
}> = {}): FakeRepo {
  return {
    getCashBalance:           jest.fn().mockResolvedValue(values.opening ?? 1_000_000),
    getSalesReceipts:         jest.fn().mockResolvedValue(values.sales ?? 5_000_000),
    getOtherReceipts:         jest.fn().mockResolvedValue(values.other ?? 200_000),
    getExpenses:              jest.fn().mockResolvedValue(values.expenses ?? 1_500_000),
    getPayrollDisbursements:  jest.fn().mockResolvedValue(values.payroll ?? 2_000_000),
    getOtherDisbursements:    jest.fn().mockResolvedValue(values.otherOut ?? 100_000),
  };
}

async function buildHandler(repo: FakeRepo): Promise<CashFlowHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CashFlowHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(CashFlowHandler);
}

describe('CashFlowHandler', () => {
  const start = new Date('2026-05-01');
  const end = new Date('2026-05-31');

  it('aggregates receipts and disbursements into net flow', async () => {
    const handler = await buildHandler(makeRepo({
      opening: 1_000_000, sales: 5_000_000, other: 0,
      expenses: 2_000_000, payroll: 1_000_000, otherOut: 0,
    }));

    const result = await handler.execute(new CashFlowQuery(start, end));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.netFlow).toBe(2_000_000);
      expect(result.data.closingBalance).toBe(3_000_000);
    }
  });

  it('handles negative net flow when disbursements exceed receipts', async () => {
    const handler = await buildHandler(makeRepo({
      opening: 500_000, sales: 100_000, other: 0,
      expenses: 200_000, payroll: 400_000, otherOut: 0,
    }));

    const result = await handler.execute(new CashFlowQuery(start, end));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.netFlow).toBe(-500_000);
      expect(result.data.closingBalance).toBe(0);
    }
  });

  it('splits receipts into sales and other categories', async () => {
    const handler = await buildHandler(makeRepo({
      sales: 700_000, other: 300_000,
    }));

    const result = await handler.execute(new CashFlowQuery(start, end));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.receipts.sales).toBe(700_000);
      expect(result.data.receipts.other).toBe(300_000);
    }
  });

  it('formats period using ISO date strings', async () => {
    const handler = await buildHandler(makeRepo());

    const result = await handler.execute(new CashFlowQuery(start, end));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.period).toBe('2026-05-01 to 2026-05-31');
  });

  it('passes start and end dates to every repository accessor', async () => {
    const repo = makeRepo();
    const handler = await buildHandler(repo);

    await handler.execute(new CashFlowQuery(start, end));

    expect(repo.getCashBalance).toHaveBeenCalledWith(start);
    expect(repo.getSalesReceipts).toHaveBeenCalledWith(start, end);
    expect(repo.getPayrollDisbursements).toHaveBeenCalledWith(start, end);
  });
});
