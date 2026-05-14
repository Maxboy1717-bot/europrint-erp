/**
 * @module order-status.vo
 * @description Value object. Immutable domain primitive with validation in its factory.
 */

import { Result, Ok, Err } from '@common/types/result.type';

export const ORDER_STATUSES = [
  'DRAFT',
  'LEAD_INTAKE',
  'SAMPLE_REQUESTED',
  'PRICING',
  'SAMPLE_PRODUCTION',
  'DESIGN_IN_PROGRESS',
  'CONTRACT_DRAFT',
  'PAYMENT_PENDING',
  'ORDER_CONFIRMED',
  'TECH_INTAKE',
  'PREPRESS',
  'MOLDS_ORDERED',
  'CLICHE_ORDERED',
  'TECHCARD_REVIEW',
  'SPELL_CHECK',
  'TECHCARD_CONFIRMED',
  'CUSTOMER_APPROVED',
  'PLANNING',
  'MATERIAL_WAIT',
  'LAB_WAIT',
  'PRODUCTION_SCHEDULED',
  'IN_PRODUCTION',
  'FINISHED_AWAITING_QC',
  'PACKAGED',
  'IN_FG_WAREHOUSE',
  'SHIPPING_READY',
  'SHIPPING',
  'SHIPPED',
  'DELIVERED',
  'CLOSED',
  'LOST_DEAL',
  'CANCELLED',
] as const;

export type OrderStatusCode = typeof ORDER_STATUSES[number];

const ALLOWED_TRANSITIONS: Record<OrderStatusCode, OrderStatusCode[]> = {
  DRAFT:                ['LEAD_INTAKE', 'CANCELLED'],
  LEAD_INTAKE:          ['SAMPLE_REQUESTED', 'PRICING', 'LOST_DEAL'],
  SAMPLE_REQUESTED:     ['SAMPLE_PRODUCTION', 'PRICING'],
  PRICING:              ['SAMPLE_REQUESTED', 'CONTRACT_DRAFT', 'LOST_DEAL'],
  SAMPLE_PRODUCTION:    ['DESIGN_IN_PROGRESS', 'PRICING'],
  DESIGN_IN_PROGRESS:   ['CONTRACT_DRAFT'],
  CONTRACT_DRAFT:       ['PAYMENT_PENDING', 'LOST_DEAL'],
  PAYMENT_PENDING:      ['ORDER_CONFIRMED', 'CANCELLED'],
  ORDER_CONFIRMED:      ['TECH_INTAKE'],
  TECH_INTAKE:          ['PREPRESS'],
  PREPRESS:             ['MOLDS_ORDERED', 'TECH_INTAKE'],
  MOLDS_ORDERED:        ['CLICHE_ORDERED', 'TECHCARD_REVIEW'],
  CLICHE_ORDERED:       ['TECHCARD_REVIEW'],
  TECHCARD_REVIEW:      ['SPELL_CHECK', 'PREPRESS'],
  SPELL_CHECK:          ['TECHCARD_CONFIRMED', 'TECHCARD_REVIEW'],
  TECHCARD_CONFIRMED:   ['CUSTOMER_APPROVED'],
  CUSTOMER_APPROVED:    ['PLANNING'],
  PLANNING:             ['MATERIAL_WAIT', 'LAB_WAIT', 'PRODUCTION_SCHEDULED'],
  MATERIAL_WAIT:        ['PLANNING', 'PRODUCTION_SCHEDULED'],
  LAB_WAIT:             ['PLANNING', 'PRODUCTION_SCHEDULED'],
  PRODUCTION_SCHEDULED: ['IN_PRODUCTION'],
  IN_PRODUCTION:        ['FINISHED_AWAITING_QC', 'PLANNING'],
  FINISHED_AWAITING_QC: ['PACKAGED', 'IN_PRODUCTION'],
  PACKAGED:             ['IN_FG_WAREHOUSE'],
  IN_FG_WAREHOUSE:      ['SHIPPING_READY'],
  SHIPPING_READY:       ['SHIPPING'],
  SHIPPING:             ['SHIPPED'],
  SHIPPED:              ['DELIVERED'],
  DELIVERED:            ['CLOSED'],
  CLOSED:               [],
  LOST_DEAL:            [],
  CANCELLED:            [],
};

export class OrderStatusVo {
  private constructor(private readonly value: OrderStatusCode) {}

  static create(raw: string): Result<OrderStatusVo> {
    const found = ORDER_STATUSES.find((s) => s === raw);
    if (!found) {
      return Err({ code: 'INVALID_TRANSITION', message: `Noto'g'ri holat: ${raw}` });
    }
    return Ok(new OrderStatusVo(found));
  }

  canTransitionTo(next: string): Result<OrderStatusVo> {
    const allowed = (ALLOWED_TRANSITIONS[this.value] ?? []) as string[];
    if (!allowed.includes(next)) {
      return Err({
        code: 'INVALID_TRANSITION',
        message: `${this.value} → ${next} o'tish mumkin emas`,
      });
    }
    return OrderStatusVo.create(next);
  }

  getValue(): OrderStatusCode { return this.value; }

  isTerminal(): boolean {
    return this.value === 'CLOSED' || this.value === 'LOST_DEAL' || this.value === 'CANCELLED';
  }
}
