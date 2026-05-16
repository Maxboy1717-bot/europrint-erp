/**
 * test/mm/create-material.handler.spec.ts
 *
 * Unit tests for CreateMaterialHandler. IMmMaterialRepository mocked.
 * Real Material aggregate is built by the handler.
 */

import { Test } from '@nestjs/testing';
import { CreateMaterialHandler } from '../../src/modules/mm/application/commands/create-material.handler';
import { CreateMaterialCommand } from '../../src/modules/mm/application/commands/create-material.command';
import { Material } from '../../src/modules/mm/domain/aggregates/material.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IMmMaterialRepository, MM_MATERIAL_REPO } from '../../src/modules/mm/infrastructure/repositories/drizzle-material.repo';
import { materialFactory } from '../_fixtures/factories';

type RepoMock = Partial<Record<keyof IMmMaterialRepository, jest.Mock>> & {
  save: jest.Mock<Promise<Result<Material>>, [Material]>;
};

function makeRepo(): RepoMock {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn().mockImplementation((m: Material) => Promise.resolve(Ok(m))),
    update: jest.fn(),
    getStats: jest.fn(),
  };
}

function fromFactory(): CreateMaterialCommand {
  const f = materialFactory();
  return new CreateMaterialCommand(
    f.materialCode, f.name, f.category, f.unitOfMeasure,
    f.minStock, f.maxStock, f.unitCost,
  );
}

describe('CreateMaterialHandler', () => {
  let handler: CreateMaterialHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateMaterialHandler,
        { provide: MM_MATERIAL_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(CreateMaterialHandler);
  });

  it('returns ok with a Material instance when save succeeds', async () => {
    const r = await handler.execute(fromFactory());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBeInstanceOf(Material);
  });

  it('initializes currentStock to 0 on creation', async () => {
    await handler.execute(fromFactory());

    const saved = repo.save.mock.calls[0][0];
    expect(saved.currentStock).toBe(0);
  });

  it('initializes isActive to true on creation', async () => {
    await handler.execute(fromFactory());

    const saved = repo.save.mock.calls[0][0];
    expect(saved.isActive).toBe(true);
  });

  it('forwards repo failure when save returns err', async () => {
    repo.save.mockResolvedValueOnce(Err(AppErr('CONFLICT', 'duplicate code')));

    const r = await handler.execute(fromFactory());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('CONFLICT');
  });

  it('produces unique ids across separate executions', async () => {
    await handler.execute(fromFactory());
    await handler.execute(fromFactory());

    const idA = repo.save.mock.calls[0][0].id;
    const idB = repo.save.mock.calls[1][0].id;
    expect(idA).not.toEqual(idB);
  });
});
