/**
 * test/notifications/alerts.service.spec.ts
 * Unit tests for AlertsService. AlertsRepository is mocked (no DB).
 * Covers: findAll pagination defaults/parsing + repo-Err fallback, findOne
 * 404 behavior, create's body/message/title fallback (NOT NULL guarantee),
 * createdBy conditional inclusion, and the find-then-mutate flow in
 * update/remove (including NOT_FOUND propagation through safeCall).
 */

import { NotFoundException } from '@nestjs/common';
import { AlertsService } from '../../src/modules/notifications/alerts/alerts.service';
import { AlertsRepository } from '../../src/modules/notifications/alerts/alerts.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findAll: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

function makeI18n() {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  };
}

describe('AlertsService', () => {
  let service: AlertsService;
  let repo: RepoMock;

  beforeEach(() => {
    repo = makeRepo();
    service = new AlertsService(repo as unknown as AlertsRepository, makeI18n() as never);
  });

  describe('findAll', () => {
    it('defaults to page=1, limit=10 when query is empty', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], total: 0 }));

      const r = await service.findAll({});

      expect(repo.findAll).toHaveBeenCalledWith(1, 10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.pagination).toEqual({ total: 0, page: 1, limit: 10 });
    });

    it('parses page/limit from the query object', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [{ id: 1 }], total: 1 }));

      const r = await service.findAll({ page: '3', limit: '25' });

      expect(repo.findAll).toHaveBeenCalledWith(3, 25);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.data).toEqual([{ id: 1 }]);
        expect(r.data.pagination).toEqual({ total: 1, page: 3, limit: 25 });
      }
    });

    it('falls back to empty data + total=0 when the repo call fails', async () => {
      repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

      const r = await service.findAll({});

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.data).toEqual([]);
        expect(r.data.pagination.total).toBe(0);
      }
    });
  });

  describe('findOne', () => {
    it('returns the row when the repo finds it', async () => {
      repo.findOne.mockResolvedValue(Ok({ id: 5, title: 'Alert' }));

      const row = await service.findOne(5);

      expect(row).toEqual({ id: 5, title: 'Alert' });
    });

    it('throws NotFoundException when the repo returns null', async () => {
      repo.findOne.mockResolvedValue(Ok(null));

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the repo call itself fails', async () => {
      repo.findOne.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('uses dto.body when present', async () => {
      repo.create.mockResolvedValue(Ok({ id: 1 }));

      await service.create({ body: 'explicit body', message: 'msg', title: 'title' });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'explicit body' }),
      );
    });

    it('falls back to dto.message when body is missing', async () => {
      repo.create.mockResolvedValue(Ok({ id: 1 }));

      await service.create({ message: 'msg only', title: 'title' });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'msg only' }),
      );
    });

    it('falls back to dto.title when body and message are missing', async () => {
      repo.create.mockResolvedValue(Ok({ id: 1 }));

      await service.create({ title: 'title only' });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'title only' }),
      );
    });

    it("falls back to '' when body, message, and title are all missing (NOT NULL guarantee)", async () => {
      repo.create.mockResolvedValue(Ok({ id: 1 }));

      await service.create({ userId: 3 });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: '' }),
      );
    });

    it('includes createdBy in the insert values when provided', async () => {
      repo.create.mockResolvedValue(Ok({ id: 1 }));

      await service.create({ title: 'x' }, 42);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 42 }),
      );
    });

    it('omits createdBy from the insert values when not provided', async () => {
      repo.create.mockResolvedValue(Ok({ id: 1 }));

      await service.create({ title: 'x' });

      const values = repo.create.mock.calls[0][0];
      expect(values).not.toHaveProperty('createdBy');
    });

    it('surfaces a repo error inside the (double-wrapped) result data', async () => {
      // NOTE: create() does `return safeCall(() => this.repo.create(values))`.
      // Since repo.create already returns a Result and safeCall wraps its
      // resolved value in another Ok(...), the outer Result is always
      // ok:true (safeCall only sees a throw, never a repo-level Err) — the
      // repo's Err is nested inside r.data instead of surfacing as r.ok===false.
      repo.create.mockResolvedValue(Err(AppErr('DB_ERROR', 'insert failed')));

      const r = await service.create({ title: 'x' });

      expect(r.ok).toBe(true);
      if (r.ok) {
        const inner = r.data as unknown as { ok: boolean };
        expect(inner.ok).toBe(false);
      }
    });
  });

  describe('update', () => {
    it('looks the row up before updating, then returns the (double-wrapped) repo result', async () => {
      // Same double-wrap quirk as create(): the outer Result is always
      // ok:true here; the repo's own Result ends up nested in r.data.
      repo.findOne.mockResolvedValue(Ok({ id: 1, title: 'old' }));
      repo.update.mockResolvedValue(Ok({ id: 1, title: 'new' }));

      const r = await service.update(1, { title: 'new' });

      expect(repo.findOne).toHaveBeenCalledWith(1);
      expect(repo.update).toHaveBeenCalledWith(1, { title: 'new' });
      expect(r.ok).toBe(true);
      if (r.ok) {
        const inner = r.data as unknown as { ok: boolean; data: unknown };
        expect(inner.ok).toBe(true);
        expect(inner.data).toEqual({ id: 1, title: 'new' });
      }
    });

    it('returns a NOT_FOUND Err (not a throw) when the target does not exist', async () => {
      repo.findOne.mockResolvedValue(Ok(null));

      const r = await service.update(99, { title: 'new' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('looks the row up, deletes it, and returns a success message', async () => {
      repo.findOne.mockResolvedValue(Ok({ id: 1 }));
      repo.remove.mockResolvedValue(Ok(undefined));

      const r = await service.remove(1);

      expect(repo.findOne).toHaveBeenCalledWith(1);
      expect(repo.remove).toHaveBeenCalledWith(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ message: "O'chirildi" });
    });

    it('returns a NOT_FOUND Err (not a throw) when the target does not exist', async () => {
      repo.findOne.mockResolvedValue(Ok(null));

      const r = await service.remove(99);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
