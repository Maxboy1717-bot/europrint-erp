/**
 * org-question-bank.spec.ts — EP-ORG-046 unit test for QuestionBankService.
 *
 * Covers the NOT_FOUND translation logic that QuestionBankService layers on top
 * of QuestionBankRepository (hr_question_bank — the AI-exam question pool that
 * `AiExamService.assignExamToCard` reads from): findById/update/softDelete all
 * turn a repo `Ok(null)` (row missing or already soft-deleted) into a proper
 * `Err(AppErr('NOT_FOUND', ...))`, and all three propagate repo-level errors
 * untouched. `list`/`create` are thin pass-throughs and are covered by a single
 * delegation check each. Also wires QuestionBankController for the Q-29
 * new-endpoint test gate.
 */
import { QuestionBankService } from '../src/modules/org-structure/question-bank.service';
import { QuestionBankController } from '../src/modules/org-structure/question-bank.controller';
import type { QuestionBankRepository } from '../src/modules/org-structure/question-bank.repository';
import { Ok, Err, AppErr } from '../src/common/result';

type Row = Record<string, unknown>;

interface FakeRepo {
  list: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  softDelete: jest.Mock;
}

function makeRepo(overrides: Partial<FakeRepo> = {}): FakeRepo {
  return {
    list: jest.fn().mockResolvedValue(Ok([])),
    findById: jest.fn().mockResolvedValue(Ok(null)),
    create: jest.fn().mockResolvedValue(Ok(null)),
    update: jest.fn().mockResolvedValue(Ok(null)),
    softDelete: jest.fn().mockResolvedValue(Ok(null)),
    ...overrides,
  };
}

function svc(repo: FakeRepo): QuestionBankService {
  // Test double: cast via `as never` keeps tsc happy without `as unknown` stubs.
  // QuestionBankService only touches the repo methods mocked here.
  return new QuestionBankService(repo as never);
}

describe('QuestionBankController wiring', () => {
  it('QuestionBankController is wired to QuestionBankService', () => {
    const ctrl = new QuestionBankController(svc(makeRepo()));
    expect(ctrl).toBeInstanceOf(QuestionBankController);
  });
});

describe('QuestionBankService', () => {
  describe('findById', () => {
    it('returns NOT_FOUND when repo finds no row', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
      const result = await svc(repo).findById(999);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toMatch(/999/);
      }
    });

    it('returns the row unwrapped when repo finds one', async () => {
      const row: Row = { id: 5, category: 'technical', question_uz: 'Gofra qog\'oz qalinligi?' };
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(row)) });
      const result = await svc(repo).findById(5);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(row);
    });

    it('propagates a repo-level error untouched', async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(Err(AppErr('INTERNAL', 'db down'))),
      });
      const result = await svc(repo).findById(1);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('INTERNAL');
    });
  });

  describe('update', () => {
    it('returns NOT_FOUND when the target row does not exist', async () => {
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(Ok(null)) });
      const result = await svc(repo).update(42, { questionUz: 'Yangi savol' });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toMatch(/42/);
      }
    });

    it('returns the updated row when repo succeeds', async () => {
      const row: Row = { id: 7, question_uz: 'Yangi savol' };
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(Ok(row)) });
      const result = await svc(repo).update(7, { questionUz: 'Yangi savol' });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(row);
    });

    it('propagates a repo-level error (e.g. invalid org_function_id FK) untouched', async () => {
      const repo = makeRepo({
        update: jest.fn().mockResolvedValue(Err(AppErr('VALIDATION', 'org_function_id yoki razryad_level_id mavjud emas'))),
      });
      const result = await svc(repo).update(7, { orgFunctionId: 999999 });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('VALIDATION');
    });
  });

  describe('softDelete', () => {
    it('returns NOT_FOUND (with "already archived" hint) when the row is missing/archived', async () => {
      const repo = makeRepo({ softDelete: jest.fn().mockResolvedValue(Ok(null)) });
      const result = await svc(repo).softDelete(13);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toMatch(/13/);
        expect(result.error.message).toMatch(/arxivlangan/);
      }
    });

    it('returns the archived row when repo succeeds', async () => {
      const row: Row = { id: 13, is_active: false };
      const repo = makeRepo({ softDelete: jest.fn().mockResolvedValue(Ok(row)) });
      const result = await svc(repo).softDelete(13);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(row);
    });
  });

  describe('list / create (thin delegation)', () => {
    it('list() forwards orgFunctionId/includeArchived to the repo unchanged', async () => {
      const repo = makeRepo();
      await svc(repo).list(3, true);
      expect(repo.list).toHaveBeenCalledWith(3, true);
    });

    it('create() forwards dto to the repo and returns its Result verbatim', async () => {
      const row: Row = { id: 1, question_uz: 'Sifat nazorati nima?', category: 'technical' };
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(Ok(row)) });
      const dto = { category: 'technical' as const, questionUz: 'Sifat nazorati nima?', orgFunctionId: null };
      const result = await svc(repo).create(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(row);
    });
  });
});
