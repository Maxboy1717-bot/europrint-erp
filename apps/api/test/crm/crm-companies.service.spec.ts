/**
 * crm-companies.service.spec.ts
 *
 * Unit tests for CrmCompaniesService. CrmCompaniesRepository is mocked; the
 * SQL LIKE wrapping (`%search%`) and 404 guards execute as real logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmCompaniesService } from '../../src/modules/crm/application/crm-companies.service';
import { CrmCompaniesRepository } from '../../src/modules/crm/application/crm-companies.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  listCompanies: jest.Mock;
  getCompany: jest.Mock;
  getCompanyContacts: jest.Mock;
  getCompanyDeals: jest.Mock;
  getCompanyCredit: jest.Mock;
  checkDuplicates: jest.Mock;
  createCompany: jest.Mock;
  updateCompany: jest.Mock;
  updateCreditLimit: jest.Mock;
  listLeadStages: jest.Mock;
  getLeadStage: jest.Mock;
  createLeadStage: jest.Mock;
  updateLeadStage: jest.Mock;
  deleteCompany: jest.Mock;
  createCompanyContact: jest.Mock;
  deleteCompanyContact: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    listCompanies: jest.fn(),
    getCompany: jest.fn(),
    getCompanyContacts: jest.fn(),
    getCompanyDeals: jest.fn(),
    getCompanyCredit: jest.fn(),
    checkDuplicates: jest.fn(),
    createCompany: jest.fn(),
    updateCompany: jest.fn(),
    updateCreditLimit: jest.fn(),
    listLeadStages: jest.fn(),
    getLeadStage: jest.fn(),
    createLeadStage: jest.fn(),
    updateLeadStage: jest.fn(),
    deleteCompany: jest.fn(),
    createCompanyContact: jest.fn(),
    deleteCompanyContact: jest.fn(),
  };
}

describe('CrmCompaniesService', () => {
  let svc: CrmCompaniesService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmCompaniesService,
        { provide: CrmCompaniesRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmCompaniesService);
  });

  it('wraps search in LIKE wildcards when listCompanies called with text', async () => {
    repo.listCompanies.mockResolvedValue(Ok([]));
    await svc.listCompanies('Acme', 10, 0);
    expect(repo.listCompanies).toHaveBeenCalledWith('%Acme%', 10, 0);
  });

  it('passes null pattern when search undefined', async () => {
    repo.listCompanies.mockResolvedValue(Ok([]));
    await svc.listCompanies(undefined, 10, 0);
    expect(repo.listCompanies).toHaveBeenCalledWith(null, 10, 0);
  });

  it('returns NOT_FOUND when getCompany row missing', async () => {
    repo.getCompany.mockResolvedValue(Ok(null));
    const r = await svc.getCompany(404);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns company when getCompany succeeds', async () => {
    repo.getCompany.mockResolvedValue(Ok({ id: 1, name: 'Co' }));
    const r = await svc.getCompany(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { name: string };
      expect(data.name).toBe('Co');
    }
  });

  it('returns Err when updateCreditLimit row missing', async () => {
    repo.updateCreditLimit.mockResolvedValue(Ok(null));
    const r = await svc.updateCreditLimit(404, 100000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns updated company when updateCompany succeeds', async () => {
    repo.updateCompany.mockResolvedValue(Ok({ id: 1, name: 'NewName' }));
    const r = await svc.updateCompany(1, { name: 'NewName' });
    expect(r.ok).toBe(true);
  });

  it('returns Err when getLeadStage row missing', async () => {
    repo.getLeadStage.mockResolvedValue(Ok(null));
    const r = await svc.getLeadStage(99);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });
});
