/**
 * test/core/department.aggregate.spec.ts
 * Unit tests for Department aggregate — data-bag aggregate
 * exposing readonly identity fields and a mutable updatedAt timestamp.
 */
import { Department } from '../../src/modules/core/domain/aggregates/department.aggregate';
import { orgNodeFactory } from '../_fixtures/factories';

type DeptOverrides = Partial<{
  id: string;
  name: string;
  code: string;
  headId: string | null;
  parentId: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

function makeDept(overrides: DeptOverrides = {}): Department {
  const o = orgNodeFactory({ type: 'department' });
  const defaults = {
    id: String(o.id),
    name: o.name,
    code: o.code,
    headId: o.headUserId !== null ? String(o.headUserId) : null,
    parentId: o.parentId !== null ? String(o.parentId) : null,
    description: null as string | null,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  const merged = { ...defaults, ...overrides };
  return new Department(
    merged.id, merged.name, merged.code, merged.headId, merged.parentId,
    merged.description, merged.isActive, merged.createdAt, merged.updatedAt,
  );
}

describe('Department aggregate', () => {
  describe('constructor()', () => {
    it('assigns id, name, and code as provided', () => {
      const d = makeDept({ id: 'd-1', name: 'Production', code: 'PROD' });
      expect(d.id).toBe('d-1');
      expect(d.name).toBe('Production');
      expect(d.code).toBe('PROD');
    });

    it('accepts null headId and parentId for a root department', () => {
      const d = makeDept({ headId: null, parentId: null });
      expect(d.headId).toBeNull();
      expect(d.parentId).toBeNull();
    });

    it('stores non-null parentId when given a sub-department', () => {
      const d = makeDept({ parentId: 'parent-7' });
      expect(d.parentId).toBe('parent-7');
    });

    it('defaults isActive=true when provided as true', () => {
      const d = makeDept({ isActive: true });
      expect(d.isActive).toBe(true);
    });

    it('accepts isActive=false for archived department', () => {
      const d = makeDept({ isActive: false });
      expect(d.isActive).toBe(false);
    });

    it('preserves description string when provided', () => {
      const d = makeDept({ description: 'Asosiy ishlab chiqarish bo\'limi' });
      expect(d.description).toBe('Asosiy ishlab chiqarish bo\'limi');
    });

    it('accepts null description', () => {
      const d = makeDept({ description: null });
      expect(d.description).toBeNull();
    });
  });

  describe('readonly fields', () => {
    it('exposes createdAt as the timestamp passed in', () => {
      const ts = new Date('2025-12-25T08:00:00Z');
      const d = makeDept({ createdAt: ts });
      expect(d.createdAt.getTime()).toBe(ts.getTime());
    });

    it('exposes initial updatedAt distinct from createdAt when given', () => {
      const created = new Date('2026-01-01');
      const updated = new Date('2026-02-10');
      const d = makeDept({ createdAt: created, updatedAt: updated });
      expect(d.updatedAt.getTime()).toBe(updated.getTime());
      expect(d.updatedAt.getTime()).not.toBe(d.createdAt.getTime());
    });
  });

  describe('mutable updatedAt', () => {
    it('allows reassignment of updatedAt to a newer timestamp', () => {
      const d = makeDept({ updatedAt: new Date('2026-01-01') });
      const next = new Date('2026-03-15');
      d.updatedAt = next;
      expect(d.updatedAt.getTime()).toBe(next.getTime());
    });

    it('keeps id stable after updatedAt mutation', () => {
      const d = makeDept({ id: 'stable-id' });
      d.updatedAt = new Date('2026-04-01');
      expect(d.id).toBe('stable-id');
    });
  });

  describe('identity equivalence by id', () => {
    it('treats two instances with same id as identity-equal by field', () => {
      const a = makeDept({ id: 'same' });
      const b = makeDept({ id: 'same' });
      expect(a.id).toBe(b.id);
    });

    it('treats different ids as different identities', () => {
      const a = makeDept({ id: 'a' });
      const b = makeDept({ id: 'b' });
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('integration with org-node factory', () => {
    it('builds a valid Department from orgNodeFactory output', () => {
      const node = orgNodeFactory({ type: 'department', name: 'Sales', code: 'SAL-001' });
      const d = new Department(
        String(node.id), node.name, node.code, null, null, null, true,
        new Date('2026-01-01'), new Date('2026-01-01'),
      );
      expect(d.name).toBe('Sales');
      expect(d.code).toBe('SAL-001');
    });
  });
});
