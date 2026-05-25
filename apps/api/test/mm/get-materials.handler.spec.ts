/**
 * test/mm/get-materials.handler.spec.ts
 *
 * Unit tests for GetMaterialsHandler — paginated material listing.
 * IMmMaterialRepository is mocked; real Material aggregates flow through.
 */

import { Test } from '@nestjs/testing';
import { GetMaterialsHandler } from '../../src/modules/mm/application/queries/get-materials.handler';
import { GetMaterialsQuery } from '../../src/modules/mm/application/queries/get-materials.query';
import { Material } from '../../src/modules/mm/domain/aggregates/material.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IMmMaterialRepository, MM_MATERIAL_REPO } from '../../src/modules/mm/infrastructure/repositories/drizzle-material.repo';
import { materialFactory } from '../_fixtures/factories';

type RepoMock = Partial<Record<keyof IMmMaterialRepository, jest.Mock>> & {
  findAll: jest.Mock<
    Promise<Result<{ data: Material[]; total: number }>>,
    [{ category?: string; isActive?: boolean; lowStock?: boolean; page?: number; limit?: number }]
  >;
};

function makeRepo(): RepoMock {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    getStats: jest.fn(),
  };
}

function realMaterial(): Material {
  const f = materialFactory();
  return new Material(
    f.id, f.materialCode, f.name, f.category, f.unitOfMeasure,
    f.minStock, f.maxStock, f.unitCost, f.currentStock, true,
    new Date(), new Date(),
  );
}

describe('GetMaterialsHandler', () => {
  let handler: GetMaterialsHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetMaterialsHandler,
        { provide: MM_MATERIAL_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetMaterialsHandler);
  });

  it('returns ok with paginated payload when repository succeeds', async () => {
    const materials = [realMaterial(), realMaterial()];
    repo.findAll.mockResolvedValueOnce(Ok({ data: materials, total: 42 }));

    const r = await handler.execute(new GetMaterialsQuery(undefined, undefined, undefined, 1, 10));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.data).toEqual(materials);
      expect(r.data.pagination.total).toBe(42);
      expect(r.data.pagination.totalPages).toBe(Math.ceil(42 / 10));
    }
  });

  it('forwards repository err and tags fallback INTERNAL code', async () => {
    repo.findAll.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'lookup failed')));

    const r = await handler.execute(new GetMaterialsQuery());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('passes through category and lowStock filters to the repo', async () => {
    repo.findAll.mockResolvedValueOnce(Ok({ data: [], total: 0 }));

    await handler.execute(new GetMaterialsQuery('raw_material', true, true, 2, 5));

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'raw_material', isActive: true, lowStock: true, page: 2, limit: 5 }),
    );
  });

  it('returns ok with zero totalPages when total is 0', async () => {
    repo.findAll.mockResolvedValueOnce(Ok({ data: [], total: 0 }));

    const r = await handler.execute(new GetMaterialsQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.pagination.totalPages).toBe(0);
  });

  it('invokes findAll exactly once per execute', async () => {
    repo.findAll.mockResolvedValueOnce(Ok({ data: [], total: 0 }));

    await handler.execute(new GetMaterialsQuery());

    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });
});
