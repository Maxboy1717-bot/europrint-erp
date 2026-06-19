/**
 * test/director/p30-stat-regulation.service.spec.ts
 * Unit tests for StatRegulationService — IStatRegulationRepo is mocked.
 * Verifies versioning intent (update creates a new version; old preserved).
 */

import { StatRegulationService } from '../../src/modules/director/application/stat-regulation.service';
import type {
  IStatRegulationRepo,
  IStatRegRow,
} from '../../src/modules/director/domain/repositories/i-stat-regulation.repo';
import { Ok } from '../../src/common/result';

function row(over: Partial<IStatRegRow> = {}): IStatRegRow {
  return {
    id: 1,
    name_uz: 'Sotuv hajmi',
    name_ru: null,
    definition: null,
    formula: null,
    unit: 'dona',
    frequency: 'daily',
    source_module: null,
    owner_card_id: null,
    target_value: '100',
    version: 1,
    valid_from: '2026-06-19',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...over,
  };
}

/**
 * Mock repo that simulates the versioning store: update() deactivates the old
 * row (kept) and appends a new version row. We assert the OLD row is preserved.
 */
function makeVersioningRepo(): { repo: IStatRegulationRepo; store: IStatRegRow[] } {
  const store: IStatRegRow[] = [row()];
  const repo: IStatRegulationRepo = {
    list: jest.fn(async (activeOnly: boolean) =>
      Ok(activeOnly ? store.filter((r) => r.is_active) : store.slice()),
    ),
    getById: jest.fn(async (id: number) => Ok(store.find((r) => r.id === id) ?? null)),
    getHistory: jest.fn(async (nameUz: string) =>
      Ok(store.filter((r) => r.name_uz === nameUz).sort((a, b) => b.version - a.version)),
    ),
    create: jest.fn(async () => Ok(row())),
    update: jest.fn(async (id: number, dto) => {
      const old = store.find((r) => r.id === id && r.is_active);
      if (!old) throw new Error('NOT_FOUND');
      // old preserved, marked inactive
      old.is_active = false;
      const next = row({
        id: store.length + 1,
        version: old.version + 1,
        is_active: true,
        target_value: dto.target_value ?? old.target_value,
        name_uz: dto.name_uz ?? old.name_uz,
      });
      store.push(next);
      return Ok(next);
    }),
    deactivate: jest.fn(async () => Ok(undefined)),
  };
  return { repo, store };
}

describe('P30 StatRegulationService — versioning', () => {
  it('update creates a NEW version and PRESERVES the old row', async () => {
    const { repo, store } = makeVersioningRepo();
    const svc = new StatRegulationService(repo);

    const r = await svc.update(1, { target_value: '250' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // new version row
    expect(r.data.version).toBe(2);
    expect(r.data.is_active).toBe(true);
    expect(r.data.target_value).toBe('250');

    // OLD row still in store, but deactivated — never deleted/mutated away
    const old = store.find((x) => x.id === 1);
    expect(old).toBeDefined();
    expect(old?.version).toBe(1);
    expect(old?.is_active).toBe(false);
    expect(old?.target_value).toBe('100');

    // history returns both versions, newest first
    const hist = await svc.getHistory('Sotuv hajmi');
    expect(hist.ok).toBe(true);
    if (hist.ok) {
      expect(hist.data.length).toBe(2);
      expect(hist.data[0].version).toBe(2);
      expect(hist.data[1].version).toBe(1);
    }
  });

  it('list(activeOnly=true) returns only the active (latest) version', async () => {
    const { repo } = makeVersioningRepo();
    const svc = new StatRegulationService(repo);
    await svc.update(1, { target_value: '999' });

    const active = await svc.list(true);
    expect(active.ok).toBe(true);
    if (active.ok) {
      expect(active.data.length).toBe(1);
      expect(active.data[0].version).toBe(2);
    }
  });

  it('create delegates to repo', async () => {
    const { repo } = makeVersioningRepo();
    const svc = new StatRegulationService(repo);
    const r = await svc.create({ name_uz: 'Yangi', frequency: 'daily' });
    expect(r.ok).toBe(true);
    expect(repo.create).toHaveBeenCalled();
  });
});
