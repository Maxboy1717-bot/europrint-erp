/**
 * contacts.service.spec.ts
 *
 * Unit tests for CRM ContactsService. ICrmContactsRepository is mocked; the
 * page/limit clamping (1..100, min 1) runs as real business logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ICrmContactsRepository,
  CRM_CONTACTS_REPO,
} from '../../src/modules/crm/contacts/i-crm-contacts.repo';
import { ContactsService } from '../../src/modules/crm/contacts/contacts.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(): jest.Mocked<ICrmContactsRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  } as jest.Mocked<ICrmContactsRepository>;
}

describe('ContactsService', () => {
  let svc: ContactsService;
  let repo: jest.Mocked<ICrmContactsRepository>;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: CRM_CONTACTS_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(ContactsService);
  });

  it('clamps limit at MAX_PAGE_LIMIT (100) when over-large limit requested', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    await svc.findAll({ page: 1, limit: 500 });
    expect(repo.findAll).toHaveBeenCalledWith(100, 0);
  });

  it('clamps limit to 1 when zero or negative limit passed', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    await svc.findAll({ page: 1, limit: -5 });
    expect(repo.findAll).toHaveBeenCalledWith(1, 0);
  });

  it('computes offset from page and limit', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    await svc.findAll({ page: 4, limit: 10 });
    expect(repo.findAll).toHaveBeenCalledWith(10, 30);
  });

  it('returns NOT_FOUND when findOne id missing', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    await expect(svc.findOne(999)).rejects.toThrow();
  });

  it('returns contact data when findOne succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 5, name: 'Ali' }));
    const r = await svc.findOne(5);
    expect((r as { id: number }).id).toBe(5);
  });

  it('returns Err when create repository fails', async () => {
    repo.create.mockResolvedValue(Err(AppErr('DB_ERROR', 'insert failed')));
    const r = await svc.create({ first_name: 'A' }, 1);
    expect(r.ok).toBe(false);
  });

  it('returns Err when update target not found', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    const r = await svc.update(404, { first_name: 'X' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns success message when remove succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 10 }));
    repo.softDelete.mockResolvedValue(Ok(undefined));
    const r = await svc.remove(10);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { message: string };
      expect(data.message).toBe("O'chirildi");
    }
  });
});
