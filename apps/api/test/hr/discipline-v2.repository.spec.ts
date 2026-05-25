/**
 * Unit tests for DisciplineV2Repository.
 * Covers selected catalog + violation methods (within 300-line limit).
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  violation_catalog: {
    code: 'vc.code', name: 'vc.name', category: 'vc.category',
    severity: 'vc.severity', default_fine_amount: 'vc.default_fine_amount',
    description: 'vc.description', is_active: 'vc.is_active',
  },
  discipline_records: {
    id: 'dr.id', employee_id: 'dr.employee_id', catalog_code: 'dr.catalog_code',
    is_expired: 'dr.is_expired', created_at: 'dr.created_at',
  },
  employee_blocks: { id: 'eb.id', employee_id: 'eb.employee_id', is_active: 'eb.is_active' },
  hrEmployees: { id: 'he.id' },
  absence_tracking: { id: 'at.id' },
}));

import { DisciplineV2Repository } from '../../src/modules/hr/discipline-v2/discipline-v2.repository';

describe('DisciplineV2Repository', () => {
  let repo: DisciplineV2Repository;
  beforeEach(() => {
    repo = new DisciplineV2Repository();
    dbStub.__setResolved([]);
  });

  describe('getViolationCatalog', () => {
    it('returns Ok with active entries when present', async () => {
      dbStub.__setResolved([{ code: 'LATE', name: 'Late arrival' }]);
      const r = await repo.getViolationCatalog();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no entries', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getViolationCatalog();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getViolationCatalog();
      expect(r.ok).toBe(false);
    });
  });

  describe('createCatalogEntry', () => {
    const dto = { code: 'LATE', name: 'Late arrival', category: 'time', severity: 'low' };
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ code: 'LATE' }]);
      const r = await repo.createCatalogEntry(dto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ code: 'LATE' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createCatalogEntry(dto);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('unique violation'));
      const r = await repo.createCatalogEntry(dto);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateCatalogEntry', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ code: 'LATE', name: 'Tardiness' }]);
      const r = await repo.updateCatalogEntry('LATE', { name: 'Tardiness' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ code: 'LATE', name: 'Tardiness' });
    });

    it('returns Ok with empty object when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateCatalogEntry('XYZ', { name: 'Y' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateCatalogEntry('LATE', { name: 'X' });
      expect(r.ok).toBe(false);
    });
  });

  describe('softDeleteCatalogEntry', () => {
    it('returns Ok with row when soft delete succeeds', async () => {
      dbStub.__setResolved([{ code: 'LATE', is_active: false }]);
      const r = await repo.softDeleteCatalogEntry('LATE');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ code: 'LATE', is_active: false });
    });

    it('returns Ok with null when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.softDeleteCatalogEntry('XYZ');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.softDeleteCatalogEntry('LATE');
      expect(r.ok).toBe(false);
    });
  });

  describe('getCatalogEntry', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ code: 'LATE' }]);
      const r = await repo.getCatalogEntry('LATE');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ code: 'LATE' });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getCatalogEntry('XYZ');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getCatalogEntry('LATE');
      expect(r.ok).toBe(false);
    });
  });

  describe('getPreviousViolationCount', () => {
    it('returns Ok with parsed count when row present', async () => {
      dbStub.__setResolved([{ cnt: '3' }]);
      const r = await repo.getPreviousViolationCount(1, 'LATE');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(3);
    });

    it('returns Ok with 0 when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getPreviousViolationCount(1, 'LATE');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getPreviousViolationCount(1, 'LATE');
      expect(r.ok).toBe(false);
    });
  });

  describe('getEmployeeViolations', () => {
    it('returns Ok with rows when violations present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.getEmployeeViolations(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no violations', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getEmployeeViolations(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getEmployeeViolations(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('acknowledgeViolation', () => {
    it('returns Ok with row when acknowledged', async () => {
      dbStub.__setResolved([{ id: 1, status: 'acknowledged' }]);
      const r = await repo.acknowledgeViolation(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'acknowledged' });
    });

    it('returns Ok with empty object when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.acknowledgeViolation(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.acknowledgeViolation(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('checkDisciplineStatus', () => {
    it('returns Ok with is_blocked=false when no active block', async () => {
      dbStub.__setResolved([]);
      const r = await repo.checkDisciplineStatus(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.is_blocked).toBe(false);
    });

    it('returns Ok with is_blocked=true and reason when block exists', async () => {
      dbStub.__setResolved([{ reason: 'absenteeism' }]);
      const r = await repo.checkDisciplineStatus(1);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.is_blocked).toBe(true);
        expect(r.data.blocked_reason).toBe('absenteeism');
      }
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.checkDisciplineStatus(1);
      expect(r.ok).toBe(false);
    });
  });
});
