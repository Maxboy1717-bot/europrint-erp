/**
 * test/mm/materials.service.spec.ts
 *
 * MaterialsService pages an in-memory list returned by the repository,
 * coerces costPerUnit and quantityOnHand to numbers, and emits the standard
 * pagination envelope.
 */

import { MaterialsService } from '../../src/modules/mm/materials/materials.service';
import type { IMaterialsSvcRepository } from '../../src/modules/mm/materials/i-materials-svc.repo';

function buildRepo(rows: Record<string, unknown>[]): jest.Mocked<IMaterialsSvcRepository> {
  return {
    findAll: jest.fn().mockResolvedValue({ ok: true, data: rows }),
  };
}

describe('MaterialsService', () => {
  it('uses default page=1 limit=20 when none supplied', async () => {
    const repo = buildRepo([{ id: 1, costPerUnit: '5', quantityOnHand: '10' }]);
    const svc = new MaterialsService(repo);

    const r = await svc.findAll({});

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const env = r.data as { data: unknown[]; pagination: { total: number; page: number; limit: number } };
    expect(env.pagination).toEqual({ total: 1, page: 1, limit: 20 });
    expect(env.data).toHaveLength(1);
  });

  it('coerces costPerUnit and quantityOnHand to numbers', async () => {
    const repo = buildRepo([
      { id: 1, costPerUnit: '12.5', quantityOnHand: '300' },
    ]);
    const svc = new MaterialsService(repo);

    const r = await svc.findAll({});

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const item = (r.data as { data: Array<{ costPerUnit: number; quantityOnHand: number }> }).data[0];
    expect(item.costPerUnit).toBe(12.5);
    expect(item.quantityOnHand).toBe(300);
  });

  it('treats missing numeric fields as zero', async () => {
    const repo = buildRepo([{ id: 2 }]);
    const svc = new MaterialsService(repo);

    const r = await svc.findAll({});

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const item = (r.data as { data: Array<{ costPerUnit: number; quantityOnHand: number }> }).data[0];
    expect(item.costPerUnit).toBe(0);
    expect(item.quantityOnHand).toBe(0);
  });

  it('returns only the requested page slice', async () => {
    const rows: Record<string, unknown>[] = [];
    for (let i = 1; i <= 5; i++) rows.push({ id: i });
    const repo = buildRepo(rows);
    const svc = new MaterialsService(repo);

    const r = await svc.findAll({ page: 2, limit: 2 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const env = r.data as { data: Array<{ id: number }>; pagination: { total: number } };
    expect(env.data.map(x => x.id)).toEqual([3, 4]);
    expect(env.pagination.total).toBe(5);
  });

  it('returns empty data when the repository yields no rows', async () => {
    const repo = buildRepo([]);
    const svc = new MaterialsService(repo);

    const r = await svc.findAll({ page: 1, limit: 10 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const env = r.data as { data: unknown[]; pagination: { total: number } };
    expect(env.data).toEqual([]);
    expect(env.pagination.total).toBe(0);
  });
});
