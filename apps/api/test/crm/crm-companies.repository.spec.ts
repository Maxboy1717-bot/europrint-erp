/**
 * Unit tests for CrmCompaniesRepository.
 * Covers selected CRUD methods.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  crmCompanies: {
    id: 'cc.id', title: 'cc.title', inn: 'cc.inn', industry: 'cc.industry',
    address: 'cc.address', website: 'cc.website', credit_limit: 'cc.credit_limit',
    used_credit: 'cc.used_credit', status: 'cc.status', created_at: 'cc.created_at',
  },
  crmContacts: { id: 'ct.id', company_id: 'ct.company_id', first_name: 'ct.first_name' },
  crmDeals: { id: 'cd.id', company_id: 'cd.company_id', created_at: 'cd.created_at' },
  crm_lead_stages: { id: 'cls.id', name: 'cls.name', color: 'cls.color', order_index: 'cls.order_index' },
}));

import { CrmCompaniesRepository } from '../../src/modules/crm/application/crm-companies.repository';

describe('CrmCompaniesRepository', () => {
  let repo: CrmCompaniesRepository;
  beforeEach(() => {
    repo = new CrmCompaniesRepository();
    dbStub.__setResolved([]);
  });

  describe('listCompanies', () => {
    it('returns Ok with companies when present', async () => {
      dbStub.__setResolved([{ id: 1, title: 'Acme' }]);
      const r = await repo.listCompanies(null, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.listCompanies('%search%', 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.listCompanies(null, 10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('getCompany', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ id: 1, title: 'Acme' }]);
      const r = await repo.getCompany(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, title: 'Acme' });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getCompany(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getCompany(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getCompanyContacts', () => {
    it('returns Ok with contacts when present', async () => {
      dbStub.__setResolved([{ id: 1, first_name: 'Alice' }]);
      const r = await repo.getCompanyContacts(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getCompanyContacts(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getCompanyContacts(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getCompanyDeals', () => {
    it('returns Ok with deals when present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.getCompanyDeals(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no deals', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getCompanyDeals(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getCompanyDeals(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getCompanyCredit', () => {
    it('returns Ok with credit row when found', async () => {
      dbStub.__setResolved([{ credit_limit: '1000', used_credit: '200' }]);
      const r = await repo.getCompanyCredit(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ credit_limit: '1000', used_credit: '200' });
    });

    it('returns Ok with null when not found', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getCompanyCredit(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getCompanyCredit(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('createCompany', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, title: 'Acme' }]);
      const r = await repo.createCompany({ name: 'Acme' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, title: 'Acme' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createCompany({ title: 'X' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createCompany({ title: 'X' });
      expect(r.ok).toBe(false);
    });
  });

  describe('updateCompany', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, title: 'Acme2' }]);
      const r = await repo.updateCompany(1, { title: 'Acme2' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, title: 'Acme2' });
    });

    it('returns Ok with null when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateCompany(99, { title: 'X' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateCompany(1, {});
      expect(r.ok).toBe(false);
    });
  });

  describe('updateCreditLimit', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, credit_limit: '5000' }]);
      const r = await repo.updateCreditLimit(1, 5000);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, credit_limit: '5000' });
    });

    it('returns Ok with null when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateCreditLimit(99, 1000);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateCreditLimit(1, 1000);
      expect(r.ok).toBe(false);
    });
  });

  describe('listLeadStages', () => {
    it('returns Ok with stages when present', async () => {
      dbStub.__setResolved([{ id: 1, name: 'New' }]);
      const r = await repo.listLeadStages();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.listLeadStages();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.listLeadStages();
      expect(r.ok).toBe(false);
    });
  });

  describe('createCompanyContact', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, company_id: 5 }]);
      const r = await repo.createCompanyContact(5, { firstName: 'Alice' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, company_id: 5 });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createCompanyContact(5, { firstName: 'A' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createCompanyContact(5, { firstName: 'A' });
      expect(r.ok).toBe(false);
    });
  });
});
