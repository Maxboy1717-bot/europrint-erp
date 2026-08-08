/**
 * org-position-folder.spec.ts — org-structure PositionFolderService.
 *
 * Covers the self-healing "ensureTable" fallback: when the repo call
 * *rejects* (e.g. `position_folders` table missing on a fresh/legacy DB),
 * the service must call `repo.ensureTable()` so the table exists for the
 * next request.
 *
 * IMPORTANT — verified quirk of the real implementation (not a test bug):
 * `getFolderItems`/`getEmployeeFolderItems` wrap the repo call in
 * `safeCall(() => this.repo.getFolderItems(...))`. Since the repo method
 * itself already resolves to a `Result<T>` (it never rejects on a normal
 * DB error — its own internal `safeCall` already caught it), `safeCall`
 * here only sees a *resolved* promise and reports `Ok(<inner Result>)`.
 * So on the happy path `r.data` is the inner `Result` object, not the
 * bare rows — and the `ensureTable` fallback only fires when the repo
 * call *throws/rejects* outright, not when it resolves with `{ ok: false }`.
 * These tests assert the actual behaviour so a future refactor that
 * "fixes" the double-wrap is a deliberate, visible change.
 */

import { PositionFolderService } from '../src/modules/org-structure/position-folder.service';
import type { PositionFolderRepository } from '../src/modules/org-structure/position-folder.repository';
import { Ok, Err, isOk, isErr } from '../src/common/result';

type Row = Record<string, unknown>;

function makeRepo(over: Partial<Record<keyof PositionFolderRepository, jest.Mock>> = {}): PositionFolderRepository {
  return {
    ensureTable:           jest.fn().mockResolvedValue(undefined),
    getFolderItems:        jest.fn().mockResolvedValue(Ok([])),
    addFolderItem:         jest.fn().mockResolvedValue(Ok({})),
    removeFolderItem:      jest.fn().mockResolvedValue(undefined),
    getEmployeeFolderItems: jest.fn().mockResolvedValue(Ok([])),
    ...over,
  } as unknown as PositionFolderRepository;
}

describe('PositionFolderService', () => {
  describe('getFolderItems', () => {
    it('resolves to Ok wrapping the repo Result verbatim, and does NOT call ensureTable', async () => {
      const rows: Row[] = [{ id: 1, itemType: 'document', title: 'Ish yo\'riqnomasi' }];
      const repo = makeRepo({ getFolderItems: jest.fn().mockResolvedValue(Ok(rows)) });
      const svc = new PositionFolderService(repo);

      const r = await svc.getFolderItems(7);

      // outer safeCall never throws here → always Ok(...); the *inner* repo
      // Result is carried as the payload (see file-header note on double-wrap).
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.data).toEqual(Ok(rows));
      expect(repo.ensureTable).not.toHaveBeenCalled();
    });

    it('a repo Result with ok:false does NOT trigger ensureTable (repo did not throw)', async () => {
      const repo = makeRepo({
        getFolderItems: jest.fn().mockResolvedValue(Err({ code: 'DB_ERROR', message: 'relation does not exist' })),
      });
      const svc = new PositionFolderService(repo);

      const r = await svc.getFolderItems(7);

      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.data).toEqual(Err({ code: 'DB_ERROR', message: 'relation does not exist' }));
      expect(repo.ensureTable).not.toHaveBeenCalled();
    });

    it('self-heals by calling ensureTable when the repo call rejects, and surfaces the error', async () => {
      const repo = makeRepo({
        getFolderItems: jest.fn().mockRejectedValue(new Error('relation "position_folders" does not exist')),
      });
      const svc = new PositionFolderService(repo);

      const r = await svc.getFolderItems(7);

      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.message).toBe('relation "position_folders" does not exist');
      expect(repo.ensureTable).toHaveBeenCalledTimes(1);
    });
  });

  describe('addFolderItem', () => {
    const dto = { itemType: 'document' as const, title: 'Xavfsizlik texnikasi' };

    it('returns Ok with the inserted row on the happy path (no ensureTable call)', async () => {
      const row: Row = { id: 5, itemType: 'document', title: dto.title };
      const repo = makeRepo({ addFolderItem: jest.fn().mockResolvedValue(row) });
      const svc = new PositionFolderService(repo);

      const r = await svc.addFolderItem(3, dto);

      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.data).toEqual(row);
      expect(repo.ensureTable).not.toHaveBeenCalled();
    });

    it('ensures the table and retries once when the first insert throws (retry result is NOT re-wrapped in Ok)', async () => {
      const row: Row = { id: 9, itemType: 'document', title: dto.title };
      const addFolderItem = jest.fn()
        .mockRejectedValueOnce(new Error('relation "position_folders" does not exist'))
        .mockResolvedValueOnce(row);
      const repo = makeRepo({ addFolderItem });
      const svc = new PositionFolderService(repo);

      const r = await svc.addFolderItem(3, dto);

      expect(repo.ensureTable).toHaveBeenCalledTimes(1);
      expect(addFolderItem).toHaveBeenCalledTimes(2);
      expect(addFolderItem).toHaveBeenNthCalledWith(1, 3, dto);
      expect(addFolderItem).toHaveBeenNthCalledWith(2, 3, dto);
      // Unlike the happy path (`return Ok(row)`), the catch-branch retry
      // returns `this.repo.addFolderItem(...)` directly — whatever the
      // repo resolves to is passed straight through, unwrapped.
      expect(r).toEqual(row);
    });

    it('propagates a second failure if the retry after ensureTable also throws', async () => {
      const addFolderItem = jest.fn()
        .mockRejectedValueOnce(new Error('first failure'))
        .mockRejectedValueOnce(new Error('still broken'));
      const repo = makeRepo({ addFolderItem });
      const svc = new PositionFolderService(repo);

      await expect(svc.addFolderItem(3, dto)).rejects.toThrow('still broken');
      expect(repo.ensureTable).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeFolderItem', () => {
    it('delegates to the repo and returns a localized success message', async () => {
      const removeFolderItem = jest.fn().mockResolvedValue(undefined);
      const repo = makeRepo({ removeFolderItem });
      const svc = new PositionFolderService(repo);

      const r = await svc.removeFolderItem(42);

      expect(removeFolderItem).toHaveBeenCalledWith(42);
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.data).toEqual({ message: 'O\'chirildi' });
    });
  });

  describe('getEmployeeFolderItems', () => {
    it('resolves to Ok wrapping the repo Result verbatim, and does NOT call ensureTable', async () => {
      const rows: Row[] = [{ id: 2, nodeName: 'Ombor', itemType: 'video' }];
      const repo = makeRepo({ getEmployeeFolderItems: jest.fn().mockResolvedValue(Ok(rows)) });
      const svc = new PositionFolderService(repo);

      const r = await svc.getEmployeeFolderItems(11);

      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.data).toEqual(Ok(rows));
      expect(repo.ensureTable).not.toHaveBeenCalled();
    });

    it('self-heals by calling ensureTable when the repo call rejects', async () => {
      const repo = makeRepo({
        getEmployeeFolderItems: jest.fn().mockRejectedValue(new Error('relation "position_folders" does not exist')),
      });
      const svc = new PositionFolderService(repo);

      const r = await svc.getEmployeeFolderItems(11);

      expect(isErr(r)).toBe(true);
      expect(repo.ensureTable).toHaveBeenCalledTimes(1);
    });
  });
});
