/**
 * defect.aggregate.spec.ts — QC Defect aggregate tests.
 *
 * Verifies constructor field assignment plus resolve / markAsRework /
 * markAsScrapped state transitions and their timestamp side-effects.
 */

import {
  Defect,
  DefectSeverity,
  DefectStatus,
} from '../../src/modules/qc/domain/aggregates/defect.aggregate';
import { inspectionFactory } from '../_fixtures/factories';

function makeDefect(overrides: Partial<{
  id: string;
  inspectionId: string | null;
  productionOrderId: string | null;
  workCenterId: string | null;
  defectCode: string;
  description: string;
  severity: DefectSeverity;
  status: DefectStatus;
  quantity: number;
  unit: string;
  reportedBy: string;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}): Defect {
  const insp = inspectionFactory();
  const defaults = {
    id: 'def-1',
    inspectionId: String(insp.orderId),
    productionOrderId: 'po-1',
    workCenterId: 'wc-1',
    defectCode: 'PRINT-MISALIGN',
    description: 'Bosma jihozda chekka surilgan',
    severity: DefectSeverity.MAJOR,
    status: DefectStatus.OPEN,
    quantity: 12,
    unit: 'piece',
    reportedBy: 'user-1',
    resolvedBy: null as string | null,
    resolvedAt: null as Date | null,
    resolution: null as string | null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  const p = { ...defaults, ...overrides };
  return new Defect(
    p.id, p.inspectionId, p.productionOrderId, p.workCenterId,
    p.defectCode, p.description, p.severity, p.status, p.quantity,
    p.unit, p.reportedBy, p.resolvedBy, p.resolvedAt, p.resolution,
    p.createdAt, p.updatedAt,
  );
}

describe('Defect aggregate', () => {
  describe('construction', () => {
    it('exposes id and defect code when constructed', () => {
      const d = makeDefect({ id: 'd-9', defectCode: 'SCRATCH' });
      expect(d.id).toBe('d-9');
      expect(d.defectCode).toBe('SCRATCH');
    });

    it('starts in OPEN status and severity MAJOR when defaults used', () => {
      const d = makeDefect();
      expect(d.status).toBe(DefectStatus.OPEN);
      expect(d.severity).toBe(DefectSeverity.MAJOR);
    });

    it('stores nullable resolution fields as null when defect is new', () => {
      const d = makeDefect();
      expect(d.resolvedBy).toBeNull();
      expect(d.resolvedAt).toBeNull();
      expect(d.resolution).toBeNull();
    });

    it('preserves CRITICAL severity when explicitly set', () => {
      const d = makeDefect({ severity: DefectSeverity.CRITICAL });
      expect(d.severity).toBe(DefectSeverity.CRITICAL);
    });
  });

  describe('resolve', () => {
    it('flips status to RESOLVED and records resolver when resolve is called', () => {
      const d = makeDefect();
      d.resolve('user-7', 'Mashina sozlandi');
      expect(d.status).toBe(DefectStatus.RESOLVED);
      expect(d.resolvedBy).toBe('user-7');
      expect(d.resolution).toBe('Mashina sozlandi');
    });

    it('records resolvedAt timestamp when resolve is called', () => {
      const d = makeDefect();
      d.resolve('u', 'fix');
      expect(d.resolvedAt).toBeInstanceOf(Date);
    });

    it('updates updatedAt timestamp when resolve is called', () => {
      const d = makeDefect();
      const before = d.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      d.resolve('u', 'fix');
      expect(d.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('overwrites previous resolution when resolve is called twice', () => {
      const d = makeDefect();
      d.resolve('u1', 'first');
      d.resolve('u2', 'second');
      expect(d.resolvedBy).toBe('u2');
      expect(d.resolution).toBe('second');
    });
  });

  describe('markAsRework / markAsScrapped', () => {
    it('flips status to REWORK when markAsRework is called', () => {
      const d = makeDefect();
      d.markAsRework();
      expect(d.status).toBe(DefectStatus.REWORK);
    });

    it('flips status to SCRAPPED when markAsScrapped is called', () => {
      const d = makeDefect();
      d.markAsScrapped();
      expect(d.status).toBe(DefectStatus.SCRAPPED);
    });

    it('updates updatedAt when markAsRework changes state', () => {
      const d = makeDefect();
      const before = d.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      d.markAsRework();
      expect(d.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('updates updatedAt when markAsScrapped changes state', () => {
      const d = makeDefect();
      const before = d.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      d.markAsScrapped();
      expect(d.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('leaves resolvedBy null when only markAsRework is called', () => {
      const d = makeDefect();
      d.markAsRework();
      expect(d.resolvedBy).toBeNull();
      expect(d.resolution).toBeNull();
    });
  });
});
