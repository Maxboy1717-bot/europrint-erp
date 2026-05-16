/**
 * order.aggregate.spec.ts — OrderAggregate unit tests.
 *
 * Verifies create / reconstitute factories, status transitions through the
 * lifecycle FSM, terminal state guard, state version increments, and accessors.
 */

import { OrderAggregate, OrderProps } from '../../src/modules/order-workflow/domain/aggregates/order.aggregate';
import { OrderStatusVo } from '../../src/modules/order-workflow/domain/value-objects/order-status.vo';
import { salesOrderFactory } from '../_fixtures/factories';

function buildCreateInput(): {
  id: string;
  orderNumber: string;
  customerId: number;
  totalAmount: number;
  currency: string;
  assignedSalesManager: number;
  tenantId: string;
} {
  const so = salesOrderFactory({ totalAmount: 5_000_000, currency: 'UZS' });
  return {
    id: 'order-uuid-1',
    orderNumber: so.orderNumber,
    customerId: so.companyId,
    totalAmount: so.totalAmount,
    currency: so.currency,
    assignedSalesManager: so.createdBy,
    tenantId: 'tenant-1',
  };
}

describe('OrderAggregate', () => {
  describe('create', () => {
    it('returns Ok with DRAFT status when input is valid', () => {
      const result = OrderAggregate.create(buildCreateInput());
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.getStatus()).toBe('DRAFT');
      expect(result.data.getStateVersion()).toBe(0);
    });

    it('initialises customerTier to NEW when aggregate is created', () => {
      const r = OrderAggregate.create(buildCreateInput());
      if (!r.ok) throw new Error('expected ok');
      expect(r.data.getCustomerTier()).toBe('NEW');
    });

    it('defaults assignedSalesManager and tenantId to null when omitted', () => {
      const input = buildCreateInput();
      const r = OrderAggregate.create({
        id: input.id,
        orderNumber: input.orderNumber,
        customerId: input.customerId,
        totalAmount: input.totalAmount,
        currency: input.currency,
      });
      if (!r.ok) throw new Error('expected ok');
      expect(r.data.getSalesManager()).toBeNull();
      expect(r.data.getTenantId()).toBeNull();
    });

    it('preserves order number and currency when create succeeds', () => {
      const input = buildCreateInput();
      const r = OrderAggregate.create(input);
      if (!r.ok) throw new Error('expected ok');
      expect(r.data.getOrderNumber()).toBe(input.orderNumber);
      expect(r.data.getCurrency()).toBe(input.currency);
      expect(r.data.getTotalAmount()).toBe(input.totalAmount);
    });
  });

  describe('reconstitute', () => {
    it('rehydrates aggregate without resetting state when props are supplied', () => {
      const statusR = OrderStatusVo.create('PRICING');
      if (!statusR.ok) throw new Error('vo failed');
      const props: OrderProps = {
        id: 'ord-2',
        orderNumber: 'SO-2026-000001',
        customerId: 9,
        customerTier: 'GOLD',
        status: statusR.data,
        stateVersion: 5,
        totalAmount: 1000,
        currency: 'UZS',
        assignedSalesManager: 11,
        tenantId: 't1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };
      const agg = OrderAggregate.reconstitute(props);
      expect(agg.getStatus()).toBe('PRICING');
      expect(agg.getStateVersion()).toBe(5);
      expect(agg.getCustomerTier()).toBe('GOLD');
    });
  });

  describe('canTransitionTo', () => {
    it('returns Ok when next status is reachable from DRAFT', () => {
      const r = OrderAggregate.create(buildCreateInput());
      if (!r.ok) throw new Error('expected ok');
      const can = r.data.canTransitionTo('LEAD_INTAKE');
      expect(can.ok).toBe(true);
    });

    it('returns INVALID_TRANSITION error when next status is unreachable from DRAFT', () => {
      const r = OrderAggregate.create(buildCreateInput());
      if (!r.ok) throw new Error('expected ok');
      const can = r.data.canTransitionTo('SHIPPED');
      expect(can.ok).toBe(false);
      if (can.ok) return;
      expect(can.error.code).toBe('INVALID_TRANSITION');
    });

    it('blocks any transition when aggregate is in terminal CLOSED state', () => {
      const statusR = OrderStatusVo.create('CLOSED');
      if (!statusR.ok) throw new Error('vo failed');
      const agg = OrderAggregate.reconstitute({
        id: 'x', orderNumber: 'n', customerId: null, customerTier: 'NEW',
        status: statusR.data, stateVersion: 0, totalAmount: 0, currency: 'UZS',
        assignedSalesManager: null, tenantId: null,
        createdAt: new Date(), updatedAt: new Date(),
      });
      const can = agg.canTransitionTo('DRAFT');
      expect(can.ok).toBe(false);
      if (can.ok) return;
      expect(can.error.message).toMatch(/[Tt]erminal/);
    });
  });

  describe('transition', () => {
    it('advances status and increments stateVersion when transition is legal', () => {
      const r = OrderAggregate.create(buildCreateInput());
      if (!r.ok) throw new Error('expected ok');
      const t = r.data.transition('LEAD_INTAKE');
      expect(t.ok).toBe(true);
      expect(r.data.getStatus()).toBe('LEAD_INTAKE');
      expect(r.data.getStateVersion()).toBe(1);
    });

    it('refuses to mutate state when transition is illegal', () => {
      const r = OrderAggregate.create(buildCreateInput());
      if (!r.ok) throw new Error('expected ok');
      const before = r.data.getStateVersion();
      const t = r.data.transition('IN_PRODUCTION');
      expect(t.ok).toBe(false);
      expect(r.data.getStatus()).toBe('DRAFT');
      expect(r.data.getStateVersion()).toBe(before);
    });

    it('chains multi-step transitions when each step is allowed', () => {
      const r = OrderAggregate.create(buildCreateInput());
      if (!r.ok) throw new Error('expected ok');
      expect(r.data.transition('LEAD_INTAKE').ok).toBe(true);
      expect(r.data.transition('PRICING').ok).toBe(true);
      expect(r.data.transition('CONTRACT_DRAFT').ok).toBe(true);
      expect(r.data.getStatus()).toBe('CONTRACT_DRAFT');
      expect(r.data.getStateVersion()).toBe(3);
    });
  });

  describe('toJSON and accessors', () => {
    it('serialises status as string code when toJSON is called', () => {
      const input = buildCreateInput();
      const r = OrderAggregate.create(input);
      if (!r.ok) throw new Error('expected ok');
      const json = r.data.toJSON();
      expect(json.status).toBe('DRAFT');
      expect(json.id).toBe(input.id);
      expect(json.orderNumber).toBe(input.orderNumber);
      expect(json.totalAmount).toBe(input.totalAmount);
    });

    it('exposes immutable copy of domain events when getDomainEvents called', () => {
      const r = OrderAggregate.create(buildCreateInput());
      if (!r.ok) throw new Error('expected ok');
      const events = r.data.getDomainEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(0);
    });

    it('clears events safely when clearEvents is called on empty list', () => {
      const r = OrderAggregate.create(buildCreateInput());
      if (!r.ok) throw new Error('expected ok');
      r.data.clearEvents();
      expect(r.data.getDomainEvents()).toEqual([]);
    });
  });
});
