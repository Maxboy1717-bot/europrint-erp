/**
 * reclamation.aggregate.spec.ts — QC Reclamation aggregate tests.
 *
 * Reclamation has a single behavioural method (resolve) plus a rich set of
 * constructor fields. Tests cover field assignment and resolve transition.
 */

import {
  Reclamation,
  ReclamationStatus,
} from '../../src/modules/qc/domain/aggregates/reclamation.aggregate';
import { DefectSeverity } from '../../src/modules/qc/domain/aggregates/defect.aggregate';

function makeReclamation(overrides: Partial<{
  id: string;
  customerName: string;
  customerId: string | null;
  orderId: string | null;
  description: string;
  severity: DefectSeverity;
  status: ReclamationStatus;
  reportedDate: Date;
  assignedTo: string | null;
  resolution: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}): Reclamation {
  const defaults = {
    id: 'rec-1',
    customerName: 'Tashkent Pack',
    customerId: 'cust-9' as string | null,
    orderId: 'ord-3' as string | null,
    description: 'Karton egilgan',
    severity: DefectSeverity.MAJOR,
    status: ReclamationStatus.OPEN,
    reportedDate: new Date('2026-01-01'),
    assignedTo: null as string | null,
    resolution: null as string | null,
    resolvedAt: null as Date | null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  const p = { ...defaults, ...overrides };
  return new Reclamation(
    p.id, p.customerName, p.customerId, p.orderId, p.description,
    p.severity, p.status, p.reportedDate, p.assignedTo,
    p.resolution, p.resolvedAt, p.createdAt, p.updatedAt,
  );
}

describe('Reclamation aggregate', () => {
  describe('construction', () => {
    it('exposes id and customerName when constructed', () => {
      const r = makeReclamation({ id: 'rec-7', customerName: 'EuroPrint' });
      expect(r.id).toBe('rec-7');
      expect(r.customerName).toBe('EuroPrint');
    });

    it('preserves nullable customerId and orderId when both supplied', () => {
      const r = makeReclamation({ customerId: 'c-1', orderId: 'o-2' });
      expect(r.customerId).toBe('c-1');
      expect(r.orderId).toBe('o-2');
    });

    it('preserves nullable customerId when set to null', () => {
      const r = makeReclamation({ customerId: null, orderId: null });
      expect(r.customerId).toBeNull();
      expect(r.orderId).toBeNull();
    });

    it('starts in OPEN status and unresolved when defaults used', () => {
      const r = makeReclamation();
      expect(r.status).toBe(ReclamationStatus.OPEN);
      expect(r.resolvedAt).toBeNull();
      expect(r.resolution).toBeNull();
    });

    it('stores CRITICAL severity when explicitly supplied', () => {
      const r = makeReclamation({ severity: DefectSeverity.CRITICAL });
      expect(r.severity).toBe(DefectSeverity.CRITICAL);
    });

    it('stores assignedTo when explicitly supplied', () => {
      const r = makeReclamation({ assignedTo: 'qc-manager-3' });
      expect(r.assignedTo).toBe('qc-manager-3');
    });
  });

  describe('resolve', () => {
    it('flips status to RESOLVED when resolve is invoked', () => {
      const r = makeReclamation();
      r.resolve('Qoplangan zarar to\'landi');
      expect(r.status).toBe(ReclamationStatus.RESOLVED);
    });

    it('records resolution text when resolve is invoked', () => {
      const r = makeReclamation();
      r.resolve('Replaced batch');
      expect(r.resolution).toBe('Replaced batch');
    });

    it('records resolvedAt timestamp when resolve is invoked', () => {
      const r = makeReclamation();
      expect(r.resolvedAt).toBeNull();
      r.resolve('done');
      expect(r.resolvedAt).toBeInstanceOf(Date);
    });

    it('updates updatedAt timestamp when resolve mutates state', () => {
      const r = makeReclamation();
      const before = r.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      r.resolve('done');
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('overwrites previous resolution when resolve is called twice', () => {
      const r = makeReclamation();
      r.resolve('first attempt');
      r.resolve('final fix');
      expect(r.resolution).toBe('final fix');
      expect(r.status).toBe(ReclamationStatus.RESOLVED);
    });
  });
});
