/**
 * crm-leads-ops.service.spec.ts
 *
 * Unit tests for CrmLeadsOpsService. The repository is mocked; the convert
 * flow's deal-name fallback (`{first} {last} deal`) executes for real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmLeadsOpsService } from '../../src/modules/crm/application/crm-leads-ops.service';
import { CrmLeadsOpsRepository } from '../../src/modules/crm/application/crm-leads-ops.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  updateLead: jest.Mock;
  findStage: jest.Mock;
  updateLeadStage: jest.Mock;
  insertActivityNote: jest.Mock;
  findLead: jest.Mock;
  insertDeal: jest.Mock;
  convertLead: jest.Mock;
  leadExists: jest.Mock;
  deleteLead: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    updateLead: jest.fn(),
    findStage: jest.fn(),
    updateLeadStage: jest.fn(),
    insertActivityNote: jest.fn(),
    findLead: jest.fn(),
    insertDeal: jest.fn(),
    convertLead: jest.fn(),
    leadExists: jest.fn(),
    deleteLead: jest.fn(),
  };
}

describe('CrmLeadsOpsService', () => {
  let svc: CrmLeadsOpsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmLeadsOpsService,
        { provide: CrmLeadsOpsRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmLeadsOpsService);
  });

  it('returns NOT_FOUND when updateStage stage missing', async () => {
    repo.findStage.mockResolvedValue(Ok(null));
    const r = await svc.updateStage(1, 99);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('inserts activity note when updateStage called with notes', async () => {
    repo.findStage.mockResolvedValue(Ok({ id: 99 }));
    repo.updateLeadStage.mockResolvedValue(Ok({ id: 1, stage_id: 99 }));
    repo.insertActivityNote.mockResolvedValue(undefined);
    await svc.updateStage(1, 99, 'note');
    expect(repo.insertActivityNote).toHaveBeenCalledWith(1, 'note');
  });

  it('returns NOT_FOUND when convert lead missing', async () => {
    repo.findLead.mockResolvedValue(Ok(null));
    const r = await svc.convert(404);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('uses default deal name from lead names when convert called without name', async () => {
    repo.findLead.mockResolvedValue(
      Ok({ first_name: 'Ali', last_name: 'Valiyev', company_id: 7 }),
    );
    repo.insertDeal.mockResolvedValue(Ok({ id: 1 }));
    repo.convertLead.mockResolvedValue(undefined);
    await svc.convert(123);
    expect(repo.insertDeal).toHaveBeenCalledWith(123, 'Ali Valiyev deal', 7, 0);
  });

  it('uses explicit deal name and amount when provided', async () => {
    repo.findLead.mockResolvedValue(
      Ok({ first_name: 'Ali', last_name: 'V', company_id: 7 }),
    );
    repo.insertDeal.mockResolvedValue(Ok({ id: 1 }));
    repo.convertLead.mockResolvedValue(undefined);
    await svc.convert(123, 'Custom Deal', 99999);
    expect(repo.insertDeal).toHaveBeenCalledWith(123, 'Custom Deal', 7, 99999);
  });

  it('returns NOT_FOUND when delete lead does not exist', async () => {
    repo.leadExists.mockResolvedValue(Ok(false));
    const r = await svc.delete(404);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns deleted envelope when delete succeeds', async () => {
    repo.leadExists.mockResolvedValue(Ok(true));
    repo.deleteLead.mockResolvedValue(undefined);
    const r = await svc.delete(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { deleted: number };
      expect(data.deleted).toBe(1);
    }
  });
});
