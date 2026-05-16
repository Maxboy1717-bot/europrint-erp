/**
 * Unit tests for DisciplineRecordRepository.
 * Single public method: insert. Covers happy + DB error path.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  discipline_records: { id: 'dr.id' },
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { DisciplineRecordRepository, InsertDisciplineRecord } from '../../src/modules/hr/attendance/discipline-record.repository';

const baseRecord: InsertDisciplineRecord = {
  employee_id: 1,
  violation_type: 'lateness',
  discipline_type: 'warning',
  violation_name: 'Late arrival',
  description: 'Arrived 30 min late',
  violation_date: '2025-01-10',
  issued_date: '2025-01-11',
  severity: 'low',
  issued_by: 2,
  status: 'active',
};

describe('DisciplineRecordRepository', () => {
  let repo: DisciplineRecordRepository;
  beforeEach(() => {
    repo = new DisciplineRecordRepository();
    dbStub.__setResolved(undefined);
  });

  describe('insert', () => {
    it('returns Ok when insert succeeds', async () => {
      const r = await repo.insert(baseRecord);
      expect(r.ok).toBe(true);
    });

    it('returns Ok regardless of severity value when insert succeeds', async () => {
      const r = await repo.insert({ ...baseRecord, severity: 'high' });
      expect(r.ok).toBe(true);
    });

    it('returns Err with DB_ERROR code when insert throws', async () => {
      dbStub.__setRejected(new Error('FK violation'));
      const r = await repo.insert(baseRecord);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.code).toBe('DB_ERROR');
        expect(r.error.message).toContain('FK violation');
      }
    });

    it('returns Err when DB rejects with non-Error value', async () => {
      dbStub.__setRejected('connection lost');
      const r = await repo.insert(baseRecord);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    });
  });
});
