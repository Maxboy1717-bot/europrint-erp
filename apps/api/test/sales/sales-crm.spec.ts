/**
 * test/sales/sales-crm.spec.ts
 *
 * Sales order math + CRM pipeline FSM. Pure-logic.
 */

import Decimal from 'decimal.js';

// ─── Sales order line totals ────────────────────────────────────────────────

interface OrderLine { qty: number; price: number; discountPct: number }
function calcLineTotal(line: OrderLine): { ok: boolean; total?: string; error?: string } {
  if (line.qty <= 0) return { ok: false, error: 'INVALID_QUANTITY' };
  if (line.price < 0) return { ok: false, error: 'INVALID_PRICE' };
  if (line.discountPct < 0 || line.discountPct > 100) return { ok: false, error: 'INVALID_DISCOUNT' };
  const gross = new Decimal(line.qty).times(line.price);
  const discount = gross.times(line.discountPct).div(100);
  const total = gross.minus(discount);
  return { ok: true, total: total.toFixed(4) };
}

describe('Sales order line total', () => {
  it('no discount: 10 * 100 = 1000.0000', () => {
    expect(calcLineTotal({ qty: 10, price: 100, discountPct: 0 }).total).toBe('1000.0000');
  });

  it('10% discount on 1000 = 900', () => {
    expect(calcLineTotal({ qty: 10, price: 100, discountPct: 10 }).total).toBe('900.0000');
  });

  it('100% discount → 0', () => {
    expect(calcLineTotal({ qty: 10, price: 100, discountPct: 100 }).total).toBe('0.0000');
  });

  it('rejects qty <= 0', () => {
    expect(calcLineTotal({ qty: 0, price: 100, discountPct: 0 }).ok).toBe(false);
    expect(calcLineTotal({ qty: -1, price: 100, discountPct: 0 }).ok).toBe(false);
  });

  it('rejects discount > 100%', () => {
    expect(calcLineTotal({ qty: 1, price: 100, discountPct: 150 }).ok).toBe(false);
  });

  it('rejects negative discount', () => {
    expect(calcLineTotal({ qty: 1, price: 100, discountPct: -5 }).ok).toBe(false);
  });

  it('preserves 4-decimal precision on fractional prices', () => {
    expect(calcLineTotal({ qty: 3, price: 3.33, discountPct: 0 }).total).toBe('9.9900');
  });
});

// ─── Credit limit guard ─────────────────────────────────────────────────────

function canCreateOrder(creditLimit: number, currentDebt: number, orderTotal: number): { ok: boolean; error?: string } {
  if (orderTotal <= 0) return { ok: false, error: 'INVALID_TOTAL' };
  if (currentDebt + orderTotal > creditLimit) return { ok: false, error: 'CREDIT_LIMIT' };
  return { ok: true };
}

describe('Customer credit limit guard', () => {
  it('allows order within limit', () => {
    expect(canCreateOrder(10000, 2000, 5000).ok).toBe(true);
  });

  it('rejects order that exceeds limit', () => {
    expect(canCreateOrder(10000, 9000, 2000).error).toBe('CREDIT_LIMIT');
  });

  it('rejects order exactly at limit + 1', () => {
    expect(canCreateOrder(10000, 9999, 2).error).toBe('CREDIT_LIMIT');
  });

  it('allows order exactly at limit (boundary)', () => {
    expect(canCreateOrder(10000, 9000, 1000).ok).toBe(true);
  });
});

// ─── CRM pipeline stage transitions ─────────────────────────────────────────

type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
const STAGE_ORDER: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];

function canMoveStage(from: DealStage, to: DealStage): boolean {
  if (to === 'lost') return from !== 'won' && from !== 'lost';
  if (from === 'won' || from === 'lost') return false;
  const fromIdx = STAGE_ORDER.indexOf(from);
  const toIdx = STAGE_ORDER.indexOf(to);
  // Allow forward by any amount; allow backward by exactly one
  return toIdx > fromIdx || toIdx === fromIdx - 1;
}

describe('CRM deal pipeline', () => {
  it('moves forward lead → qualified', () => {
    expect(canMoveStage('lead', 'qualified')).toBe(true);
  });

  it('moves forward lead → won (skip stages allowed in pipeline)', () => {
    expect(canMoveStage('lead', 'won')).toBe(true);
  });

  it('moves backward exactly one step', () => {
    expect(canMoveStage('proposal', 'qualified')).toBe(true);
  });

  it('rejects backward more than one step', () => {
    expect(canMoveStage('won', 'lead')).toBe(false);
  });

  it('any stage can be marked lost except won/lost', () => {
    expect(canMoveStage('proposal', 'lost')).toBe(true);
    expect(canMoveStage('won', 'lost')).toBe(false);
    expect(canMoveStage('lost', 'lost')).toBe(false);
  });

  it('terminal states cannot move', () => {
    expect(canMoveStage('won', 'proposal')).toBe(false);
    expect(canMoveStage('lost', 'proposal')).toBe(false);
  });
});
