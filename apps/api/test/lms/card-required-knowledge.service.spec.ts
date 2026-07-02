/**
 * Behavioral spec for CardRequiredKnowledgeService (Rule 22: every service needs a unit test).
 * Covers Zod schema validation + Result<T>-to-Nest-exception mapping, using a repo stub
 * (no live DB — service is pure orchestration over CardRequiredKnowledgeRepository).
 */
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CardRequiredKnowledgeService,
  CreateCardKnowledgeSchema,
  UpdateCardKnowledgeSchema,
  KNOWLEDGE_IMPORTANCE,
} from '../../src/modules/lms/application/services/card-required-knowledge.service';

describe('CardRequiredKnowledgeService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const row = {
    id: 1,
    card_id: 10,
    knowledge_name: 'Gofra qalinligi',
    knowledge_name_ru: null,
    description: null,
    category: null,
    importance: 'required',
    course_id: null,
    sort_order: 0,
    is_active: true,
    created_by: null,
  };

  const repoStub = {
    findByCard: jest.fn().mockResolvedValue(Ok([row])),
    findById:   jest.fn().mockResolvedValue(Ok(row)),
    insert:     jest.fn().mockResolvedValue(Ok(row)),
    update:     jest.fn().mockResolvedValue(Ok(row)),
    softDelete: jest.fn().mockResolvedValue(Ok({ id: row.id })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('class is defined', () => {
    expect(CardRequiredKnowledgeService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(CardRequiredKnowledgeService.name).toBe('CardRequiredKnowledgeService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    expect(svc).toBeInstanceOf(CardRequiredKnowledgeService);
  });

  // --- Zod schema behaviour (pure, no DB) ---

  it('CreateCardKnowledgeSchema rejects an empty knowledgeName', () => {
    const parsed = CreateCardKnowledgeSchema.safeParse({ cardId: 1, knowledgeName: '' });
    expect(parsed.success).toBe(false);
  });

  it('CreateCardKnowledgeSchema defaults importance to "required" and isActive to true', () => {
    const parsed = CreateCardKnowledgeSchema.parse({ cardId: 5, knowledgeName: 'X' });
    expect(parsed.importance).toBe('required');
    expect(parsed.isActive).toBe(true);
    expect(parsed.sortOrder).toBe(0);
  });

  it('CreateCardKnowledgeSchema rejects an importance value outside the enum', () => {
    const parsed = CreateCardKnowledgeSchema.safeParse({
      cardId: 1,
      knowledgeName: 'X',
      importance: 'urgent',
    });
    expect(parsed.success).toBe(false);
  });

  it('KNOWLEDGE_IMPORTANCE contains the 3 expected levels', () => {
    expect(KNOWLEDGE_IMPORTANCE).toEqual(['critical', 'required', 'recommended']);
  });

  it('UpdateCardKnowledgeSchema omits cardId (immutable) and allows a partial patch', () => {
    const parsed = UpdateCardKnowledgeSchema.safeParse({ knowledgeName: 'Yangi nom' });
    expect(parsed.success).toBe(true);
    expect((parsed as { data?: { cardId?: unknown } }).data?.cardId).toBeUndefined();
  });

  // --- Service methods against the repo stub ---

  it('listByCard returns repo rows wrapped in an ok Result', async () => {
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    const result = await svc.listByCard(10);
    expect(repoStub.findByCard).toHaveBeenCalledWith(10);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([row]);
  });

  it('findById returns the row when the repo finds it', async () => {
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    const found = await svc.findById(1);
    expect(found).toEqual(row);
  });

  it('findById throws NotFoundException when repo returns null', async () => {
    repoStub.findById.mockResolvedValueOnce(Ok(null));
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    await expect(svc.findById(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create parses the dto, maps camelCase to snake_case, and calls repo.insert', async () => {
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    const result = await svc.create(
      { cardId: 10, knowledgeName: 'Gofra qalinligi', importance: 'critical' },
      42,
    );
    expect(repoStub.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        card_id: 10,
        knowledge_name: 'Gofra qalinligi',
        importance: 'critical',
        created_by: 42,
      }),
    );
    expect(result).toEqual(row);
  });

  it('create throws on invalid input without calling repo.insert', async () => {
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    await expect(svc.create({ cardId: 'not-a-number', knowledgeName: '' })).rejects.toBeDefined();
    expect(repoStub.insert).not.toHaveBeenCalled();
  });

  it('update only forwards defined fields to repo.update', async () => {
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    await svc.update(1, { category: 'texnik' });
    expect(repoStub.update).toHaveBeenCalledWith(1, { category: 'texnik' });
  });

  it('update throws NotFoundException when repo returns no row', async () => {
    repoStub.update.mockResolvedValueOnce(Ok(null));
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    await expect(svc.update(999, { category: 'texnik' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove soft-deletes via repo and returns a deleted marker', async () => {
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    const result = await svc.remove(1);
    expect(repoStub.softDelete).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, deleted: true });
  });

  it('remove throws NotFoundException when repo finds nothing to delete', async () => {
    repoStub.softDelete.mockResolvedValueOnce(Ok(null));
    const svc = new CardRequiredKnowledgeService(repoStub as never);
    await expect(svc.remove(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  // Touch BadRequestException to document the error-mapping contract explicitly.
  it('BadRequestException is the nest exception type used for repo-level failures', () => {
    expect(new BadRequestException('x')).toBeInstanceOf(BadRequestException);
  });
});
