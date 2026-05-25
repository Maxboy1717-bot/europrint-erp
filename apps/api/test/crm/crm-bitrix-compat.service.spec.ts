/**
 * crm-bitrix-compat.service.spec.ts
 *
 * Unit tests for CrmBitrixCompatService. CrmBitrixCompatRepository is mocked;
 * the 404 guard for getRobot and the deleted-flag envelope run for real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmBitrixCompatService } from '../../src/modules/crm/application/crm-bitrix-compat.service';
import { CRM_BITRIX_COMPAT_REPO } from '../../src/modules/crm/domain/repositories/i-crm-bitrix-compat.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  listProposals: jest.Mock;
  listInvoices: jest.Mock;
  listRobots: jest.Mock;
  getRobot: jest.Mock;
  createRobot: jest.Mock;
  updateRobot: jest.Mock;
  toggleRobot: jest.Mock;
  deleteRobot: jest.Mock;
  updateProposalStage: jest.Mock;
  updateInvoiceStage: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    listProposals: jest.fn(),
    listInvoices: jest.fn(),
    listRobots: jest.fn(),
    getRobot: jest.fn(),
    createRobot: jest.fn(),
    updateRobot: jest.fn(),
    toggleRobot: jest.fn(),
    deleteRobot: jest.fn(),
    updateProposalStage: jest.fn(),
    updateInvoiceStage: jest.fn(),
  };
}

describe('CrmBitrixCompatService', () => {
  let svc: CrmBitrixCompatService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmBitrixCompatService,
        { provide: CRM_BITRIX_COMPAT_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmBitrixCompatService);
  });

  it('forwards pagination to listProposals repo', async () => {
    repo.listProposals.mockResolvedValue(Ok([]));
    await svc.listProposals(25, 50);
    expect(repo.listProposals).toHaveBeenCalledWith(25, 50);
  });

  it('returns NOT_FOUND when getRobot row missing', async () => {
    repo.getRobot.mockResolvedValue(Ok(null));
    const r = await svc.getRobot(99);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err when getRobot repo errors', async () => {
    repo.getRobot.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const r = await svc.getRobot(1);
    expect(r.ok).toBe(false);
  });

  it('returns robot data when getRobot succeeds', async () => {
    repo.getRobot.mockResolvedValue(Ok({ id: 7, active: true }));
    const r = await svc.getRobot(7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { id: number };
      expect(data.id).toBe(7);
    }
  });

  it('returns deleted envelope when deleteRobot succeeds', async () => {
    repo.deleteRobot.mockResolvedValue(undefined);
    const r = await svc.deleteRobot(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { deleted: boolean };
      expect(data.deleted).toBe(true);
    }
  });

  it('returns Err when deleteRobot repository throws', async () => {
    repo.deleteRobot.mockRejectedValue(new Error('FK violation'));
    const r = await svc.deleteRobot(1);
    expect(r.ok).toBe(false);
  });

  it('forwards id and status to updateProposalStage repo', async () => {
    repo.updateProposalStage.mockResolvedValue(Ok({ id: 1 }));
    await svc.updateProposalStage(1, 'sent');
    expect(repo.updateProposalStage).toHaveBeenCalledWith(1, 'sent');
  });
});
