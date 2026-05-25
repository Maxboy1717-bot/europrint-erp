/**
 * test/finance/check-advance.handler.spec.ts
 *
 * Unit tests for CheckAdvanceHandler. FinanceRepository is mocked; the
 * threshold logic and override branches are exercised against real numbers.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  CheckAdvanceHandler,
  CheckAdvanceCommand,
} from '../../src/modules/finance/application/commands/check-advance.handler';
import { FINANCE_REPO } from '../../src/modules/finance/domain/repositories/i-finance.repo';

interface FakeFinanceRepo {
  getSettingValue: jest.Mock;
  findEmployeeBalance: jest.Mock;
  recordAdvance: jest.Mock;
}

function makeRepo(overrides: Partial<{
  advancePercent: number;
  baseSalary: number | null;
}> = {}): FakeFinanceRepo {
  return {
    getSettingValue: jest.fn().mockResolvedValue(overrides.advancePercent ?? 50),
    findEmployeeBalance: jest.fn().mockResolvedValue(
      overrides.baseSalary === null
        ? null
        : { baseSalary: overrides.baseSalary ?? 5_000_000 },
    ),
    recordAdvance: jest.fn().mockResolvedValue(undefined),
  };
}

async function buildHandler(repo: FakeFinanceRepo): Promise<CheckAdvanceHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CheckAdvanceHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(CheckAdvanceHandler);
}

describe('CheckAdvanceHandler', () => {
  it('returns NOT_FOUND when employee balance is missing', async () => {
    const repo = makeRepo({ baseSalary: null });
    const handler = await buildHandler(repo);

    const result = await handler.execute(
      new CheckAdvanceCommand(99, 100_000, 7),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    expect(repo.recordAdvance).not.toHaveBeenCalled();
  });

  it('approves advance when request is within threshold', async () => {
    const repo = makeRepo({ advancePercent: 50, baseSalary: 4_000_000 });
    const handler = await buildHandler(repo);
    // limit = 4_000_000 * 0.5 = 2_000_000

    const result = await handler.execute(
      new CheckAdvanceCommand(1, 1_500_000, 7),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.approved).toBe(true);
      expect(result.data.status).toBe('approved');
    }
    expect(repo.recordAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 1, status: 'approved', approvedBy: 7 }),
    );
  });

  it('records pending when request exceeds limit without override', async () => {
    const repo = makeRepo({ advancePercent: 30, baseSalary: 1_000_000 });
    const handler = await buildHandler(repo);
    // limit = 300_000; request 500_000 exceeds

    const result = await handler.execute(
      new CheckAdvanceCommand(2, 500_000, 7),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.approved).toBe(false);
      expect(result.data.status).toBe('pending_advance');
    }
    expect(repo.recordAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending_advance' }),
    );
  });

  it('overrides limit when overrideBy is supplied with reason', async () => {
    const repo = makeRepo({ advancePercent: 20, baseSalary: 1_000_000 });
    const handler = await buildHandler(repo);
    // limit = 200_000; request 800_000 with override

    const result = await handler.execute(
      new CheckAdvanceCommand(3, 800_000, 7, 99, 'CEO discretion'),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe('approved_override');
    expect(repo.recordAdvance).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved_override',
        approvedBy: 99,
        remarks: 'CEO discretion',
      }),
    );
  });

  it('reads advance threshold from repository setting', async () => {
    const repo = makeRepo({ advancePercent: 70, baseSalary: 2_000_000 });
    const handler = await buildHandler(repo);

    await handler.execute(new CheckAdvanceCommand(4, 1_300_000, 7));

    expect(repo.getSettingValue).toHaveBeenCalledWith('advance_percent');
  });
});
