/**
 * test/mm/drizzle-material-duplicate.repo.spec.ts
 *
 * G4 (Residual Fix Loop, B11): DrizzleMaterialRepository.save() used to have
 * no duplicate-prevention — a same-name material could be created twice
 * because a missing `kod` was silently backfilled with a fresh
 * `MAT-<epoch>` value, sidestepping the DB's UNIQUE constraint on `kod`.
 * Proves the new findDuplicateByName() pre-check now rejects a same-name
 * create with a CONFLICT Result, while a distinct name still succeeds.
 *
 * Strategy: mock @workspace/db so no real DB call is made, mirroring
 * test/hr/save-360-feedback.repo.spec.ts (same Residual Fix Loop G2 task).
 */

const mockSelectLimit = jest.fn();
const mockSelectWhere = jest.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }));
const mockSelect = jest.fn(() => ({ from: mockSelectFrom }));

const mockInsertReturning = jest.fn();
const mockInsertValues = jest.fn(() => ({ returning: mockInsertReturning }));
const mockInsert = jest.fn(() => ({ values: mockInsertValues }));

jest.mock('@workspace/db', () => ({
  db: { select: mockSelect, insert: mockInsert, update: jest.fn(), delete: jest.fn() },
  materialCards: {
    id: 'id', kod: 'kod', xomAshyo: 'xomAshyo', category: 'category',
    unitOfMeasure: 'unitOfMeasure', isActive: 'isActive',
  },
  eq: jest.fn((col: unknown, val: unknown) => ({ col, val, op: 'eq' })),
  and: jest.fn((...conds: unknown[]) => ({ conds, op: 'and' })),
  sql: jest.fn().mockReturnValue({}),
}));

import { DrizzleMaterialRepository } from '../../src/modules/mm/infrastructure/repositories/drizzle-material.repo';
import { Material } from '../../src/modules/mm/domain/aggregates/material.aggregate';

function makeMaterial(name: string, code = ''): Material {
  return new Material('', code, name, 'paper', 'kg', 0, 100, 10, 0, true, new Date(), new Date());
}

describe('DrizzleMaterialRepository.save (G4 duplicate-prevention, B11)', () => {
  let repo: DrizzleMaterialRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new DrizzleMaterialRepository();
  });

  it('returns a CONFLICT Err when a material with the same name already exists', async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, kod: 'MAT-OLD', xomAshyo: 'Gofra karton 3mm' }]);

    const r = await repo.save(makeMaterial('Gofra karton 3mm'));

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('CONFLICT');
      expect(r.error.message).toContain('Gofra karton 3mm');
      expect(r.error.message).toContain('MAT-OLD');
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('creates successfully when no material with that name exists', async () => {
    mockSelectLimit.mockResolvedValue([]);
    mockInsertReturning.mockResolvedValue([
      { id: 9, kod: 'MAT-NEW-1', xomAshyo: 'Yangi material', isActive: true },
    ]);

    const r = await repo.save(makeMaterial('Yangi material', 'MAT-NEW-1'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name).toBe('Yangi material');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('skips the duplicate lookup entirely when name is empty', async () => {
    mockInsertReturning.mockResolvedValue([{ id: 10, kod: 'MAT-X', xomAshyo: '' }]);

    await repo.save(makeMaterial(''));

    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});
