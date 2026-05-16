/**
 * test/mm/update-material.handler.spec.ts
 *
 * Unit tests for UpdateMaterialHandler. IMmMaterialRepository mocked.
 * Real Material aggregate; handler builds a replacement instance.
 */

import { Test } from '@nestjs/testing';
import { UpdateMaterialHandler } from '../../src/modules/mm/application/commands/update-material.handler';
import { UpdateMaterialCommand } from '../../src/modules/mm/application/commands/update-material.command';
import { Material } from '../../src/modules/mm/domain/aggregates/material.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IMmMaterialRepository, MM_MATERIAL_REPO } from '../../src/modules/mm/infrastructure/repositories/drizzle-material.repo';
import { materialFactory } from '../_fixtures/factories';

type RepoMock = Partial<Record<keyof IMmMaterialRepository, jest.Mock>> & {
  findById: jest.Mock<Promise<Result<Material | null>>, [string]>;
  update: jest.Mock<Promise<Result<Material>>, [Material]>;
};

function makeRepo(): RepoMock {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn().mockImplementation((m: Material) => Promise.resolve(Ok(m))),
    getStats: jest.fn(),
  };
}

function realMaterial(): Material {
  const f = materialFactory({ name: 'Old', currentStock: 25 });
  return new Material(
    f.id, f.materialCode, f.name, f.category, f.unitOfMeasure,
    f.minStock, f.maxStock, f.unitCost, f.currentStock, true,
    new Date('2026-01-01'), new Date('2026-01-01'),
  );
}

describe('UpdateMaterialHandler', () => {
  let handler: UpdateMaterialHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdateMaterialHandler,
        { provide: MM_MATERIAL_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(UpdateMaterialHandler);
  });

  it('returns NOT_FOUND when no material exists for the given id', async () => {
    repo.findById.mockResolvedValueOnce(Ok(null));

    const r = await handler.execute(new UpdateMaterialCommand('missing'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when findById itself errors', async () => {
    repo.findById.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new UpdateMaterialCommand('any'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('applies the provided field overrides and preserves existing values', async () => {
    const m = realMaterial();
    repo.findById.mockResolvedValueOnce(Ok(m));

    const r = await handler.execute(
      new UpdateMaterialCommand(m.id, 'Brand-new name'),
    );

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe('Brand-new name');
      // currentStock copied from existing, never overwritten
      expect(r.data.currentStock).toBe(m.currentStock);
      expect(r.data.materialCode).toBe(m.materialCode);
    }
  });

  it('keeps original name when command does not supply a new name', async () => {
    const m = realMaterial();
    repo.findById.mockResolvedValueOnce(Ok(m));

    const r = await handler.execute(
      new UpdateMaterialCommand(m.id, undefined, undefined, undefined, undefined, undefined, undefined, false),
    );

    if (r.ok) {
      expect(r.data.name).toBe(m.name);
      expect(r.data.isActive).toBe(false);
    }
  });

  it('forwards err from update repository call', async () => {
    repo.findById.mockResolvedValueOnce(Ok(realMaterial()));
    repo.update.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'no write')));

    const r = await handler.execute(new UpdateMaterialCommand('any', 'New'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
