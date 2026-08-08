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
 * B9 (2026-07-05): `MAT-<epoch>` also FAILED the project's own canonical
 * material-code regex (MATERIAL_CODE_REGEX, final segment `\d{1,6}` — max 6
 * digits; `Date.now()` is 13 digits). Fallback codes are now generated via
 * `generateFallbackCode()` (`GEN-<seq>`, regex-compliant). These tests mock
 * two independent `db.select(...).from(...).where(...)` call shapes:
 *   - findDuplicateByName: `.where(...).limit(1)` → array
 *   - generateFallbackCode: `.where(...)` → array directly (no `.limit()`)
 *
 * Strategy: mock @workspace/db so no real DB call is made, mirroring
 * test/hr/save-360-feedback.repo.spec.ts (same Residual Fix Loop G2 task).
 */

const mockSelectLimit = jest.fn();
// `.where()` return value must serve both call shapes:
//   findDuplicateByName does `.where(...).limit(1)`
//   generateFallbackCode does `.where(...)` and awaits it directly (array-like)
// A thenable array-like object supports both: `await x` resolves it, and
// `x.limit(...)` still works if chained.
let fallbackCodeRows: unknown[] = [];
const mockSelectWhere = jest.fn(() => {
  const result: Record<string, unknown> = [...fallbackCodeRows];
  (result as unknown as { limit: jest.Mock }).limit = mockSelectLimit;
  return result;
});
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
  like: jest.fn((col: unknown, val: unknown) => ({ col, val, op: 'like' })),
  sql: jest.fn().mockReturnValue({}),
}));

import { DrizzleMaterialRepository } from '../../src/modules/mm/infrastructure/repositories/drizzle-material.repo';
import { Material } from '../../src/modules/mm/domain/aggregates/material.aggregate';
import { MATERIAL_CODE_REGEX } from '../../src/modules/mm/domain/constants/material-code.constants';

function makeMaterial(name: string, code = ''): Material {
  return new Material('', code, name, 'paper', 'kg', 0, 100, 10, 0, true, new Date(), new Date());
}

describe('DrizzleMaterialRepository.save (G4 duplicate-prevention, B11)', () => {
  let repo: DrizzleMaterialRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    fallbackCodeRows = [];
    mockSelectLimit.mockResolvedValue([]);
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
});

describe('DrizzleMaterialRepository.save — fallback code generation (B9)', () => {
  let repo: DrizzleMaterialRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    fallbackCodeRows = [];
    mockSelectLimit.mockResolvedValue([]); // no duplicate-by-name match by default
    repo = new DrizzleMaterialRepository();
  });

  it('uses a supplied valid code unchanged', async () => {
    mockInsertReturning.mockResolvedValue([
      { id: 1, kod: 'GF-CARTO-B-001', xomAshyo: 'Karton A' },
    ]);

    const r = await repo.save(makeMaterial('Karton A', 'GF-CARTO-B-001'));

    expect(r.ok).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ kod: 'GF-CARTO-B-001' }),
    );
  });

  it('generates a fallback code that PASSES validateMaterialCode()\'s regex when code is omitted', async () => {
    fallbackCodeRows = []; // no existing GEN-% codes
    mockInsertReturning.mockImplementation(() =>
      Promise.resolve([{ id: 2, kod: mockInsertValues.mock.calls[0][0].kod, xomAshyo: 'Bo\'sh kodli material' }]),
    );

    const r = await repo.save(makeMaterial("Bo'sh kodli material", ''));

    expect(r.ok).toBe(true);
    const insertedKod = mockInsertValues.mock.calls[0][0].kod as string;
    expect(MATERIAL_CODE_REGEX.test(insertedKod)).toBe(true);
    expect(insertedKod.startsWith('GEN-')).toBe(true);
    // Numeric segment must be 1-6 digits, never a 13-digit epoch timestamp.
    const numericSegment = insertedKod.split('-')[1];
    expect(numericSegment.length).toBeLessThanOrEqual(6);
  });

  it('derives the next sequence number from existing GEN-% codes (no collision)', async () => {
    fallbackCodeRows = [{ kod: 'GEN-001' }, { kod: 'GEN-002' }, { kod: 'GEN-007' }];
    mockInsertReturning.mockResolvedValue([{ id: 3, kod: 'GEN-008', xomAshyo: 'X' }]);

    await repo.save(makeMaterial('X', ''));

    const insertedKod = mockInsertValues.mock.calls[0][0].kod as string;
    expect(insertedKod).toBe('GEN-008');
  });

  it('two consecutive omitted-code saves do not collide', async () => {
    // First save: no existing GEN-% rows yet.
    fallbackCodeRows = [];
    mockInsertReturning.mockResolvedValueOnce([{ id: 4, kod: 'GEN-001', xomAshyo: 'A' }]);
    const r1 = await repo.save(makeMaterial('Material A', ''));
    expect(r1.ok).toBe(true);
    const kod1 = mockInsertValues.mock.calls[0][0].kod as string;

    // Second save: simulate the first row now existing in the table, so the
    // MAX-based lookup advances past it.
    fallbackCodeRows = [{ kod: kod1 }];
    mockInsertReturning.mockResolvedValueOnce([{ id: 5, kod: 'GEN-002', xomAshyo: 'B' }]);
    const r2 = await repo.save(makeMaterial('Material B', ''));
    expect(r2.ok).toBe(true);
    const kod2 = mockInsertValues.mock.calls[1][0].kod as string;

    expect(kod1).not.toBe(kod2);
    expect(MATERIAL_CODE_REGEX.test(kod1)).toBe(true);
    expect(MATERIAL_CODE_REGEX.test(kod2)).toBe(true);
  });

  it('retries with a fresh sequence number on a unique-violation race, and still succeeds', async () => {
    fallbackCodeRows = []; // generator will propose GEN-001 both attempts (MAX read is stale)
    const uniqueViolation = Object.assign(new Error('duplicate key value'), { code: '23505' });
    mockInsertReturning
      .mockRejectedValueOnce(uniqueViolation)
      .mockResolvedValueOnce([{ id: 6, kod: 'GEN-001', xomAshyo: 'Race material' }]);

    const r = await repo.save(makeMaterial('Race material', ''));

    expect(r.ok).toBe(true);
    expect(mockInsertReturning).toHaveBeenCalledTimes(2);
  });

  it('surfaces a real conflict (does not retry) when a caller-supplied code collides', async () => {
    const uniqueViolation = Object.assign(new Error('duplicate key value'), { code: '23505' });
    mockInsertReturning.mockRejectedValue(uniqueViolation);

    const r = await repo.save(makeMaterial('Supplied-code material', 'GF-CARTO-B-999'));

    expect(r.ok).toBe(false);
    expect(mockInsertReturning).toHaveBeenCalledTimes(1);
  });
});
