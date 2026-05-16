/**
 * test/sd/_so-builder.ts
 *
 * Shared helper for constructing real SalesOrder aggregates from factory data.
 * Avoids duplicating the construction shape across handler specs.
 */

import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { SoStatus, SoStatusType } from '../../src/modules/sd/domain/value-objects/so-status.vo';
import { Money } from '../../src/common/money/money.vo';
import { salesOrderFactory } from '../_fixtures/factories';

export function buildSalesOrder(overrides: Partial<{
  id: number;
  status: SoStatusType;
  totalAmount: number;
  advanceRequired: number;
  advancePaid: number;
  advanceStatus: 'pending' | 'partial' | 'approved' | 'bypassed';
  designFlag: boolean;
  sampleFlag: boolean;
  techBomApproved: boolean;
  techRoutingApproved: boolean;
  techCardApproved: boolean;
  version: number;
}> = {}): SalesOrder {
  const f = salesOrderFactory();
  const statusResult = SoStatus.create(overrides.status ?? 'pending_advance');
  if (!statusResult.ok) throw new Error('invalid status in test setup');
  return new SalesOrder({
    id: overrides.id ?? f.id,
    orderNumber: f.orderNumber,
    status: statusResult.data,
    companyId: f.companyId,
    totalAmount: Money.of(overrides.totalAmount ?? f.totalAmount, 'UZS'),
    advanceRequired: overrides.advanceRequired ?? f.advanceRequired,
    advancePaid: overrides.advancePaid ?? f.advancePaid,
    advanceStatus: overrides.advanceStatus ?? f.advanceStatus,
    designFlag: overrides.designFlag ?? f.designFlag,
    sampleFlag: overrides.sampleFlag ?? f.sampleFlag,
    techBomApproved: overrides.techBomApproved ?? false,
    techRoutingApproved: overrides.techRoutingApproved ?? false,
    techCardApproved: overrides.techCardApproved ?? false,
    createdBy: f.createdBy,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
    version: overrides.version ?? 0,
  });
}
