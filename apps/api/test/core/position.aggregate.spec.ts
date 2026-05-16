/**
 * test/core/position.aggregate.spec.ts
 * Unit tests for Position aggregate — readonly identity + salary band.
 */
import { Position } from '../../src/modules/core/domain/aggregates/position.aggregate';
import { orgNodeFactory } from '../_fixtures/factories';

function makePosition(overrides: Partial<{
  id: string;
  title: string;
  code: string;
  departmentId: string;
  level: number;
  minSalary: number;
  maxSalary: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = {}): Position {
  const o = orgNodeFactory({ type: 'position' });
  return new Position(
    overrides.id ?? String(o.id),
    overrides.title ?? 'Operator',
    overrides.code ?? o.code,
    overrides.departmentId ?? 'dep-1',
    overrides.level ?? 3,
    overrides.minSalary ?? 5_000_000,
    overrides.maxSalary ?? 9_000_000,
    overrides.isActive ?? true,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
  );
}

describe('Position aggregate', () => {
  describe('constructor()', () => {
    it('assigns title, code, and departmentId as provided', () => {
      const p = makePosition({ title: 'Sex boshlig\'i', code: 'POS-100', departmentId: 'd-7' });
      expect(p.title).toBe('Sex boshlig\'i');
      expect(p.code).toBe('POS-100');
      expect(p.departmentId).toBe('d-7');
    });

    it('stores hierarchy level as a number', () => {
      const p = makePosition({ level: 5 });
      expect(p.level).toBe(5);
    });

    it('stores minSalary lower than maxSalary in a valid band', () => {
      const p = makePosition({ minSalary: 3_000_000, maxSalary: 7_000_000 });
      expect(p.minSalary).toBeLessThan(p.maxSalary);
    });

    it('allows equal min and max for fixed-salary positions', () => {
      const p = makePosition({ minSalary: 6_000_000, maxSalary: 6_000_000 });
      expect(p.minSalary).toBe(p.maxSalary);
    });
  });

  describe('isActive flag', () => {
    it('exposes isActive=true for active position', () => {
      const p = makePosition({ isActive: true });
      expect(p.isActive).toBe(true);
    });

    it('exposes isActive=false for archived position', () => {
      const p = makePosition({ isActive: false });
      expect(p.isActive).toBe(false);
    });
  });

  describe('salary band semantics', () => {
    it('represents zero-salary band when both min and max are 0', () => {
      const p = makePosition({ minSalary: 0, maxSalary: 0 });
      expect(p.minSalary).toBe(0);
      expect(p.maxSalary).toBe(0);
    });

    it('computes a sensible midpoint for a typical band', () => {
      const p = makePosition({ minSalary: 4_000_000, maxSalary: 8_000_000 });
      const midpoint = (p.minSalary + p.maxSalary) / 2;
      expect(midpoint).toBe(6_000_000);
    });
  });

  describe('readonly identity', () => {
    it('exposes id as the value passed in', () => {
      const p = makePosition({ id: 'pos-42' });
      expect(p.id).toBe('pos-42');
    });

    it('keeps createdAt unchanged after instantiation', () => {
      const ts = new Date('2025-11-15T10:00:00Z');
      const p = makePosition({ createdAt: ts });
      expect(p.createdAt.getTime()).toBe(ts.getTime());
    });
  });

  describe('mutable updatedAt', () => {
    it('allows reassignment to a newer timestamp', () => {
      const p = makePosition({ updatedAt: new Date('2026-01-01') });
      const next = new Date('2026-06-01');
      p.updatedAt = next;
      expect(p.updatedAt.getTime()).toBe(next.getTime());
    });

    it('preserves level and salaries after updatedAt mutation', () => {
      const p = makePosition({ level: 4, minSalary: 5_500_000, maxSalary: 7_500_000 });
      p.updatedAt = new Date('2026-05-01');
      expect(p.level).toBe(4);
      expect(p.minSalary).toBe(5_500_000);
      expect(p.maxSalary).toBe(7_500_000);
    });
  });

  describe('hierarchy', () => {
    it('treats lower level numbers as higher in hierarchy by convention', () => {
      const director = makePosition({ level: 1 });
      const operator = makePosition({ level: 5 });
      expect(director.level).toBeLessThan(operator.level);
    });

    it('allows level 0 for root-of-tree position', () => {
      const p = makePosition({ level: 0 });
      expect(p.level).toBe(0);
    });
  });
});
