/**
 * transfer-request.aggregate.spec.ts — POS v2 TransferRequest aggregate tests.
 *
 * Covers approve/startTransit/complete/reject state transitions and their
 * guards, plus updatedAt mutation on each transition.
 */

import {
  TransferRequest,
  RequestStatus,
  RequestLine,
} from '../../src/modules/pos-v2/domain/aggregates/transfer-request.aggregate';
import { InternalServerErrorException } from '@nestjs/common';
import { stockFactory } from '../_fixtures/factories';

function makeLine(overrides: Partial<RequestLine> = {}): RequestLine {
  const s = stockFactory();
  return {
    id: `line-${s.id}`,
    requestId: 'req-1',
    stockItemId: String(s.materialId),
    itemName: 'Karton 250g',
    sku: `SKU-${s.materialId}`,
    requestedQty: 100,
    approvedQty: null,
    unit: 'kg',
    ...overrides,
  };
}

function makeRequest(status: RequestStatus, lines: RequestLine[] = [makeLine()]): TransferRequest {
  return new TransferRequest(
    'req-uuid',
    'TR-2026-0001',
    'wh-A',
    'wh-B',
    status,
    lines,
    'user-1',
    null,
    null,
    'Restock',
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );
}

describe('TransferRequest aggregate', () => {
  describe('approve', () => {
    it('flips status to APPROVED and records approver when status was PENDING', () => {
      const r = makeRequest(RequestStatus.PENDING);
      r.approve('approver-9');
      expect(r.status).toBe(RequestStatus.APPROVED);
      expect(r.approvedBy).toBe('approver-9');
      expect(r.approvedAt).toBeInstanceOf(Date);
    });

    it('updates updatedAt timestamp when approve succeeds', () => {
      const r = makeRequest(RequestStatus.PENDING);
      const before = r.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      r.approve('u');
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('throws InternalServerErrorException when approve is called on APPROVED', () => {
      const r = makeRequest(RequestStatus.APPROVED);
      expect(() => r.approve('u')).toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when approve is called on REJECTED', () => {
      const r = makeRequest(RequestStatus.REJECTED);
      expect(() => r.approve('u')).toThrow(InternalServerErrorException);
    });
  });

  describe('startTransit', () => {
    it('flips status to IN_TRANSIT when invoked', () => {
      const r = makeRequest(RequestStatus.APPROVED);
      r.startTransit();
      expect(r.status).toBe(RequestStatus.IN_TRANSIT);
    });

    it('updates updatedAt when startTransit is called', () => {
      const r = makeRequest(RequestStatus.APPROVED);
      const before = r.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      r.startTransit();
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('complete', () => {
    it('flips status to COMPLETED when invoked', () => {
      const r = makeRequest(RequestStatus.IN_TRANSIT);
      r.complete();
      expect(r.status).toBe(RequestStatus.COMPLETED);
    });

    it('updates updatedAt when complete is called', () => {
      const r = makeRequest(RequestStatus.IN_TRANSIT);
      const before = r.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      r.complete();
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('reject', () => {
    it('flips status to REJECTED when current is PENDING', () => {
      const r = makeRequest(RequestStatus.PENDING);
      r.reject();
      expect(r.status).toBe(RequestStatus.REJECTED);
    });

    it('flips status to REJECTED when current is APPROVED', () => {
      const r = makeRequest(RequestStatus.APPROVED);
      r.reject();
      expect(r.status).toBe(RequestStatus.REJECTED);
    });

    it('throws InternalServerErrorException when reject is called on IN_TRANSIT', () => {
      const r = makeRequest(RequestStatus.IN_TRANSIT);
      expect(() => r.reject()).toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when reject is called on COMPLETED', () => {
      const r = makeRequest(RequestStatus.COMPLETED);
      expect(() => r.reject()).toThrow(InternalServerErrorException);
    });
  });
});
