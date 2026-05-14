/**
 * test/production/pp-orders.spec.ts
 *
 * Production-order FSM and BOM expansion rules. Pure-logic tests.
 */

type OrderStatus = 'draft' | 'released' | 'in_production' | 'completed' | 'cancelled';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft:        ['released', 'cancelled'],
  released:     ['in_production', 'cancelled'],
  in_production: ['completed', 'cancelled'],
  completed:    [],
  cancelled:    [],
};

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

interface BomLine { materialId: number; qtyPerUnit: number }
function expandBom(orderQty: number, bom: BomLine[]): { ok: boolean; lines?: Array<{ materialId: number; totalQty: number }>; error?: string } {
  if (orderQty <= 0) return { ok: false, error: 'INVALID_QUANTITY' };
  if (!Array.isArray(bom)) return { ok: false, error: 'NO_LINES' };
  if (bom.length === 0) return { ok: false, error: 'NO_LINES' };
  for (const l of bom) if (l.qtyPerUnit <= 0) return { ok: false, error: 'INVALID_QUANTITY' };
  const lines = bom.map((l) => ({ materialId: l.materialId, totalQty: orderQty * l.qtyPerUnit }));
  return { ok: true, lines };
}

describe('PpOrders FSM', () => {
  it('allows draft → released', () => {
    expect(canTransition('draft', 'released')).toBe(true);
  });

  it('rejects draft → completed (skips states)', () => {
    expect(canTransition('draft', 'completed')).toBe(false);
  });

  it('rejects transitions from terminal states', () => {
    expect(canTransition('completed', 'released')).toBe(false);
    expect(canTransition('cancelled', 'in_production')).toBe(false);
  });

  it('every non-terminal state allows cancellation', () => {
    expect(canTransition('draft', 'cancelled')).toBe(true);
    expect(canTransition('released', 'cancelled')).toBe(true);
    expect(canTransition('in_production', 'cancelled')).toBe(true);
  });
});

describe('BOM expansion', () => {
  it('expands a 2-line BOM at orderQty 10', () => {
    const r = expandBom(10, [
      { materialId: 1, qtyPerUnit: 2 },
      { materialId: 2, qtyPerUnit: 0.5 },
    ]);
    expect(r.ok).toBe(true);
    expect(r.lines).toEqual([
      { materialId: 1, totalQty: 20 },
      { materialId: 2, totalQty: 5 },
    ]);
  });

  it('rejects orderQty <= 0', () => {
    expect(expandBom(0, [{ materialId: 1, qtyPerUnit: 1 }]).ok).toBe(false);
    expect(expandBom(-1, [{ materialId: 1, qtyPerUnit: 1 }]).ok).toBe(false);
  });

  it('rejects empty BOM', () => {
    const r = expandBom(10, []);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('NO_LINES');
  });

  it('rejects null BOM', () => {
    // simulate corrupted DB row
    const r = expandBom(10, null as unknown as BomLine[]);
    expect(r.ok).toBe(false);
  });

  it('rejects BOM line with zero qtyPerUnit', () => {
    const r = expandBom(10, [{ materialId: 1, qtyPerUnit: 0 }]);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('INVALID_QUANTITY');
  });
});

describe('MES session math', () => {
  // OEE = (good output / target output) where target = run-time minutes * theoretical-rate
  function calcOee(runMinutes: number, theoreticalRate: number, goodOutput: number): number {
    if (runMinutes <= 0 || theoreticalRate <= 0) return 0;
    const target = runMinutes * theoreticalRate;
    if (target === 0) return 0;
    return Math.max(0, Math.min(1, goodOutput / target));
  }

  it('100% target met → OEE 1.0', () => {
    expect(calcOee(60, 10, 600)).toBe(1);
  });

  it('half output → OEE 0.5', () => {
    expect(calcOee(60, 10, 300)).toBe(0.5);
  });

  it('zero run time → 0', () => {
    expect(calcOee(0, 10, 0)).toBe(0);
  });

  it('clamps to ≤ 1 even when overproduction', () => {
    expect(calcOee(60, 10, 9999)).toBe(1);
  });
});
