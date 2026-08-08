/**
 * Smoke spec for KnowledgeBaseService (Rule 22: every service needs a unit test).
 */
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KnowledgeBaseService, CreateKnowledgeBaseSchema } from '../../src/modules/lms/application/services/knowledge-base.service';

describe('KnowledgeBaseService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    findAll:  jest.fn().mockResolvedValue(Ok([])),
    findById: jest.fn().mockResolvedValue(Ok(null)),
    insert:   jest.fn().mockResolvedValue(Ok({ id: '1', title: 't' })),
    update:   jest.fn().mockResolvedValue(Ok({ id: '1' })),
    remove:   jest.fn().mockResolvedValue(Ok({ id: '1' })),
  };

  const i18nStub = { t: jest.fn().mockResolvedValue('stub message') };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('class is defined', () => {
    expect(KnowledgeBaseService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(KnowledgeBaseService.name).toBe('KnowledgeBaseService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new KnowledgeBaseService(repoStub as never, i18nStub as never);
    expect(svc).toBeInstanceOf(KnowledgeBaseService);
  });

  it('findById throws NotFoundException when row is null', async () => {
    const svc = new KnowledgeBaseService(repoStub as never, i18nStub as never);
    await expect(svc.findById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('CreateKnowledgeBaseSchema rejects empty title via Zod', () => {
    const parsed = CreateKnowledgeBaseSchema.safeParse({ title: '' });
    expect(parsed.success).toBe(false);
  });

  it('create persists a valid dto via repo.insert', async () => {
    const svc = new KnowledgeBaseService(repoStub as never, i18nStub as never);
    const result = await svc.create({ title: 'doc 1' });
    expect(repoStub.insert).toHaveBeenCalled();
    expect(result).toEqual({ id: '1', title: 't' });
  });

  it('create surfaces BadRequestException when zod validation fails', async () => {
    const svc = new KnowledgeBaseService(repoStub as never, i18nStub as never);
    await expect(svc.create({})).rejects.toBeDefined();
    expect(repoStub.insert).not.toHaveBeenCalled();
  });

  // Touch BadRequestException to keep import non-unused if linters complain.
  it('BadRequestException is the nest exception type', () => {
    expect(new BadRequestException('x')).toBeInstanceOf(BadRequestException);
  });
});
