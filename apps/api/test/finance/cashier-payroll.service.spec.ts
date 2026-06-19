/**
 * CASHIER-HUB Phase 2 — CashierPayrollService (KAS-2) + CashierPodotchetService (podotchet).
 * Mocks ICashierPayrollRepository + CashierHubService (no DB, no real GL). Verifies:
 *   A1. salary_payout is BLOCKED until the chain is fully approved (status='approved').
 *   A2. salary_payout is BLOCKED without a valid PIN (KAS-1 recordMovement gate surfaces FORBIDDEN).
 *   A3. fully-approved chain + valid PIN → pays out (delegates to KAS-1) + marks chain paid.
 *   A4. stages must be approved in order.
 *   B1. issueAdvance opens an employee_debt row (and cash-out via KAS-1).
 *   B2. approveAdvanceReport clears the matching debt (status='cleared').
 *   B3. getEmployeeDebt returns SUM(open debt).
 *   B4. issueAdvance is idempotent (re-fired reference → existing debt, no second cash-out).
 */

import { CashierPayrollService } from '../../src/modules/finance/cashier-hub/cashier-payroll.service';
import { CashierPodotchetService } from '../../src/modules/finance/cashier-hub/cashier-podotchet.service';
import type { ICashierPayrollRepository } from '../../src/modules/finance/cashier-hub/i-cashier-payroll.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

type Chain = {
  id: number;
  employeeId: number;
  amount: number;
  reference: string;
  status: 'pending' | 'ai_checked' | 'hr_approved' | 'finance_approved' | 'approved' | 'rejected';
  aiCheckedAt: Date | null;
  hrApprovedAt: Date | null;
  financeApprovedAt: Date | null;
  directorApprovedAt: Date | null;
  paidMovementId: number | null;
};

function chain(over: Partial<Chain> = {}): Chain {
  return {
    id: 1,
    employeeId: 7,
    amount: 1_000_000,
    reference: 'PAY-2026-06',
    status: 'pending',
    aiCheckedAt: null,
    hrApprovedAt: null,
    financeApprovedAt: null,
    directorApprovedAt: null,
    paidMovementId: null,
    ...over,
  };
}

const APPROVED_CHAIN = chain({
  status: 'approved',
  aiCheckedAt: new Date(),
  hrApprovedAt: new Date(),
  financeApprovedAt: new Date(),
  directorApprovedAt: new Date(),
});

function makeRepo(overrides: Partial<ICashierPayrollRepository> = {}): ICashierPayrollRepository {
  const base: ICashierPayrollRepository = {
    findApprovalByReference: jest.fn(async () => Ok(null)),
    findApprovalById: jest.fn(async () => Ok(null)),
    createApproval: jest.fn(async (dto) => Ok(chain({ reference: dto.reference, employeeId: dto.employeeId, amount: dto.amount }) as never)),
    setApprovalStage: jest.fn(async (id, _stage, _by, status) => Ok(chain({ id, status: status as Chain['status'] }) as never)),
    rejectApproval: jest.fn(async (id) => Ok(chain({ id, status: 'rejected' }) as never)),
    markApprovalPaid: jest.fn(async (id, movementId) => Ok(chain({ id, status: 'approved', paidMovementId: movementId }) as never)),
    findDebtByReference: jest.fn(async () => Ok(null)),
    findDebtById: jest.fn(async () => Ok(null)),
    createDebt: jest.fn(async (dto) => Ok({ id: 11, employeeId: dto.employeeId, amount: dto.amount, status: 'open', reference: dto.reference } as never)),
    clearDebt: jest.fn(async (id) => Ok({ id, status: 'cleared' } as never)),
    getOpenDebtTotal: jest.fn(async () => Ok(0)),
    listOpenDebts: jest.fn(async () => Ok([])),
    findAdvanceReportByReference: jest.fn(async () => Ok(null)),
    createAdvanceReport: jest.fn(async (dto) => Ok({ id: 21, ...dto, approved: false } as never)),
    approveAdvanceReport: jest.fn(async (id) => Ok({ id, debtId: 11, approved: true } as never)),
  };
  return { ...base, ...overrides };
}

/** A KAS-1 CashierHubService double: recordMovement returns a fake movement row. */
function makeHub(recordImpl?: jest.Mock) {
  return {
    recordMovement:
      recordImpl ?? jest.fn(async () => Ok({ id: 999, glEntryId: 555 })),
  } as unknown as { recordMovement: jest.Mock };
}

describe('CashierPayrollService (KAS-2 salary-payout gate)', () => {
  it('A1) salary_payout is BLOCKED until the chain is fully approved', async () => {
    const repo = makeRepo({
      findApprovalByReference: jest.fn(async () => Ok(chain({ status: 'finance_approved' }) as never)),
    });
    const hub = makeHub();
    const svc = new CashierPayrollService(repo, hub as never);

    const res = await svc.recordSalaryPayout({ shiftId: 1, reference: 'PAY-2026-06', pin: '1234' }, 7);
    expect(res.ok).toBe(false);
    expect(!res.ok && res.error.code).toBe('FORBIDDEN');
    // gate must fire BEFORE any cash-out / GL post
    expect(hub.recordMovement).not.toHaveBeenCalled();
    expect(repo.markApprovalPaid).not.toHaveBeenCalled();
  });

  it('A2) salary_payout is BLOCKED without a valid PIN (KAS-1 gate surfaces FORBIDDEN)', async () => {
    const repo = makeRepo({
      findApprovalByReference: jest.fn(async () => Ok(APPROVED_CHAIN as never)),
    });
    // KAS-1 recordMovement rejects because the PIN store is not configured / PIN wrong.
    const hub = makeHub(jest.fn(async () => Err(AppErr('FORBIDDEN', 'PIN tasdiqlanmadi'))));
    const svc = new CashierPayrollService(repo, hub as never);

    const res = await svc.recordSalaryPayout({ shiftId: 1, reference: 'PAY-2026-06', pin: '0000' }, 7);
    expect(res.ok).toBe(false);
    expect(!res.ok && res.error.code).toBe('FORBIDDEN');
    // chain was approved so we DID attempt the cash-out, but it failed → no markPaid
    expect(hub.recordMovement).toHaveBeenCalledTimes(1);
    expect(repo.markApprovalPaid).not.toHaveBeenCalled();
  });

  it('A3) fully-approved chain + valid PIN → pays out (KAS-1) and marks chain paid', async () => {
    const repo = makeRepo({
      findApprovalByReference: jest.fn(async () => Ok(APPROVED_CHAIN as never)),
    });
    const hub = makeHub(jest.fn(async () => Ok({ id: 999, glEntryId: 555 })));
    const svc = new CashierPayrollService(repo, hub as never);

    const res = await svc.recordSalaryPayout({ shiftId: 1, reference: 'PAY-2026-06', pin: '1234' }, 7);
    expect(res.ok).toBe(true);
    expect(hub.recordMovement).toHaveBeenCalledTimes(1);
    // delegated with type=salary_payout + the PIN + amount from the chain
    const [, payload] = hub.recordMovement.mock.calls[0];
    expect(payload.type).toBe('salary_payout');
    expect(payload.amount).toBe(APPROVED_CHAIN.amount);
    expect(payload.pin).toBe('1234');
    expect(repo.markApprovalPaid).toHaveBeenCalledWith(APPROVED_CHAIN.id, 999);
  });

  it('A3b) already-paid chain is idempotent (no second cash-out)', async () => {
    const repo = makeRepo({
      findApprovalByReference: jest.fn(async () => Ok(chain({ ...APPROVED_CHAIN, paidMovementId: 999 }) as never)),
    });
    const hub = makeHub();
    const svc = new CashierPayrollService(repo, hub as never);

    const res = await svc.recordSalaryPayout({ shiftId: 1, reference: 'PAY-2026-06', pin: '1234' }, 7);
    expect(res.ok).toBe(true);
    expect(res.ok && (res.data as { alreadyPaid: boolean }).alreadyPaid).toBe(true);
    expect(hub.recordMovement).not.toHaveBeenCalled();
  });

  it('A4) stages must be approved in order (cannot skip ahead)', async () => {
    const repo = makeRepo({
      findApprovalById: jest.fn(async () => Ok(chain({ status: 'pending' }) as never)),
    });
    const svc = new CashierPayrollService(repo, makeHub() as never);

    // jumping straight to director when nothing is approved yet → rejected
    const skip = await svc.approveStage(1, { stage: 'director_approved' }, 50);
    expect(skip.ok).toBe(false);
    expect(!skip.ok && skip.error.code).toBe('INVALID_STATUS');

    // ai_checked is the correct next stage → accepted
    const ok = await svc.approveStage(1, { stage: 'ai_checked' }, 50);
    expect(ok.ok).toBe(true);
    expect(repo.setApprovalStage).toHaveBeenCalledWith(1, 'ai_checked', 50, 'ai_checked');
  });
});

describe('CashierPodotchetService (advance / debt)', () => {
  it('B1) issueAdvance opens an employee_debt row (cash-out via KAS-1)', async () => {
    const repo = makeRepo();
    const hub = makeHub(jest.fn(async () => Ok({ id: 999, glEntryId: 555 })));
    const svc = new CashierPodotchetService(repo, hub as never);

    const res = await svc.issueAdvance(
      { shiftId: 1, employeeId: 7, amount: 500_000, reference: 'A1', reason: 'material', pin: '1234' },
      7,
    );
    expect(res.ok).toBe(true);
    // cash-out delegated with type=advance + PIN
    const [, payload] = hub.recordMovement.mock.calls[0];
    expect(payload.type).toBe('advance');
    expect(payload.pin).toBe('1234');
    // debt opened, linked to the movement
    expect(repo.createDebt).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 7, amount: 500_000, reference: 'ADV-A1', movementId: 999 }),
    );
  });

  it('B2) approveAdvanceReport clears the matching debt (status=cleared)', async () => {
    const repo = makeRepo({
      approveAdvanceReport: jest.fn(async (id) => Ok({ id, debtId: 11, approved: true } as never)),
      findDebtById: jest.fn(async () => Ok({ id: 11, employeeId: 7, amount: 500_000, status: 'open' } as never)),
      clearDebt: jest.fn(async (id) => Ok({ id, status: 'cleared' } as never)),
    });
    const svc = new CashierPodotchetService(repo, makeHub() as never);

    const res = await svc.approveAdvanceReport(21, 50);
    expect(res.ok).toBe(true);
    expect(repo.approveAdvanceReport).toHaveBeenCalledWith(21, 50);
    expect(repo.clearDebt).toHaveBeenCalledWith(11);
    expect(res.ok && (res.data as { debt: { status: string } }).debt.status).toBe('cleared');
  });

  it('B2b) approveAdvanceReport on an already-cleared debt is idempotent (no re-clear)', async () => {
    const repo = makeRepo({
      approveAdvanceReport: jest.fn(async (id) => Ok({ id, debtId: 11, approved: true } as never)),
      findDebtById: jest.fn(async () => Ok({ id: 11, employeeId: 7, amount: 500_000, status: 'cleared' } as never)),
    });
    const svc = new CashierPodotchetService(repo, makeHub() as never);

    const res = await svc.approveAdvanceReport(21, 50);
    expect(res.ok).toBe(true);
    expect(res.ok && (res.data as { alreadyCleared: boolean }).alreadyCleared).toBe(true);
    expect(repo.clearDebt).not.toHaveBeenCalled();
  });

  it('B3) getEmployeeDebt returns SUM(open debt) + the open rows', async () => {
    const repo = makeRepo({
      getOpenDebtTotal: jest.fn(async () => Ok(750_000)),
      listOpenDebts: jest.fn(async () => Ok([{ id: 11, amount: 500_000 }, { id: 12, amount: 250_000 }] as never)),
    });
    const svc = new CashierPodotchetService(repo, makeHub() as never);

    const res = await svc.getEmployeeDebt(7);
    expect(res.ok).toBe(true);
    expect(res.ok && (res.data as { openDebtTotal: number }).openDebtTotal).toBe(750_000);
    expect(res.ok && (res.data as { openDebts: unknown[] }).openDebts).toHaveLength(2);
  });

  it('B4) issueAdvance is idempotent — re-fired reference returns the existing debt, no second cash-out', async () => {
    const repo = makeRepo({
      findDebtByReference: jest.fn(async () => Ok({ id: 11, employeeId: 7, amount: 500_000, status: 'open', reference: 'ADV-A1' } as never)),
    });
    const hub = makeHub();
    const svc = new CashierPodotchetService(repo, hub as never);

    const res = await svc.issueAdvance(
      { shiftId: 1, employeeId: 7, amount: 500_000, reference: 'A1', pin: '1234' },
      7,
    );
    expect(res.ok).toBe(true);
    expect(res.ok && (res.data as { alreadyIssued: boolean }).alreadyIssued).toBe(true);
    expect(hub.recordMovement).not.toHaveBeenCalled();
    expect(repo.createDebt).not.toHaveBeenCalled();
  });

  it('B5) submitAdvanceReport is rejected when the debt is not open', async () => {
    const repo = makeRepo({
      findDebtById: jest.fn(async () => Ok({ id: 11, employeeId: 7, amount: 500_000, status: 'cleared' } as never)),
    });
    const svc = new CashierPodotchetService(repo, makeHub() as never);

    const res = await svc.submitAdvanceReport({ debtId: 11, amount: 500_000, receiptRef: 'CHK-1', reference: 'AR-1' });
    expect(res.ok).toBe(false);
    expect(!res.ok && res.error.code).toBe('INVALID_STATUS');
    expect(repo.createAdvanceReport).not.toHaveBeenCalled();
  });
});
