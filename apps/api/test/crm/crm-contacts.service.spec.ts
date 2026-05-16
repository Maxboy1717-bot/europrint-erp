/**
 * crm-contacts.service.spec.ts
 *
 * Unit tests for CrmContactsService (application layer). CrmContactsRepository
 * is mocked; the field-destructuring logic for createContact/updateContact runs
 * for real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmContactsService } from '../../src/modules/crm/application/crm-contacts.service';
import { CrmContactsRepository } from '../../src/modules/crm/application/crm-contacts.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  listContacts: jest.Mock;
  findById: jest.Mock;
  checkDuplicates: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    listContacts: jest.fn(),
    findById: jest.fn(),
    checkDuplicates: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

describe('CrmContactsService (application)', () => {
  let svc: CrmContactsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmContactsService,
        { provide: CrmContactsRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmContactsService);
  });

  it('forwards filter params to listContacts repository', async () => {
    repo.listContacts.mockResolvedValue(Ok([]));
    await svc.listContacts('search', 5, 10, 0);
    expect(repo.listContacts).toHaveBeenCalledWith('search', 5, 10, 0);
  });

  it('returns NOT_FOUND when getContact id missing', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    const r = await svc.getContact(99);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns contact when getContact succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 1, first_name: 'Ali' }));
    const r = await svc.getContact(1);
    expect(r.ok).toBe(true);
  });

  it('destructures body fields when createContact called', async () => {
    repo.create.mockResolvedValue(Ok({ id: 1 }));
    await svc.createContact({
      first_name: 'Ali',
      last_name: 'Valiyev',
      email: 'a@x.com',
      phone: '+998',
      company_id: 7,
      position: 'CEO',
      notes: 'VIP',
    });
    expect(repo.create).toHaveBeenCalledWith(
      'Ali', 'Valiyev', 'a@x.com', '+998', 7, 'CEO', 'VIP',
    );
  });

  it('returns NOT_FOUND when updateContact target row missing', async () => {
    repo.update.mockResolvedValue(Ok(null));
    const r = await svc.updateContact(404, { first_name: 'X' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns updated row when updateContact succeeds', async () => {
    repo.update.mockResolvedValue(Ok({ id: 1, first_name: 'New' }));
    const r = await svc.updateContact(1, { first_name: 'New' });
    expect(r.ok).toBe(true);
  });

  it('forwards email and phone to duplicates check', async () => {
    repo.checkDuplicates.mockResolvedValue(Ok({ matches: [] }));
    await svc.checkDuplicates('a@x.com', '+998');
    expect(repo.checkDuplicates).toHaveBeenCalledWith('a@x.com', '+998');
  });
});
