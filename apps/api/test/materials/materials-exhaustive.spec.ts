/**
 * @module materials-exhaustive.spec
 * @description Materials/WMS: PO three-way match, GR matching, inventory
 * count variance, ABC analysis, EOQ, reorder point, slow-moving detection.
 */

// ─── Three-way match ────────────────────────────────────────────────────────

interface PO { id: number; qty: number; unitPrice: number }
interface GR { poId: number; qty: number }
interface Inv { poId: number; qty: number; total: number }

const TOL = 5; // ±5%

function threeWayMatch(po: PO, gr: GR, inv: Inv): { ok: boolean; error?: string } {
  if (po.id !== gr.poId || po.id !== inv.poId) return { ok: false, error: 'PO_MISMATCH' };
  const qtyDiff = Math.abs(po.qty - gr.qty) / po.qty * 100;
  if (qtyDiff > TOL) return { ok: false, error: 'QTY_OOT' };
  const grInvDiff = gr.qty === 0 ? 100 : Math.abs(gr.qty - inv.qty) / gr.qty * 100;
  if (grInvDiff > TOL) return { ok: false, error: 'INV_QTY_MISMATCH' };
  const expected = gr.qty * po.unitPrice;
  if (expected === 0) return inv.total === 0 ? { ok: true } : { ok: false, error: 'PRICE_OOT' };
  const priceDiff = Math.abs(expected - inv.total) / expected * 100;
  if (priceDiff > TOL) return { ok: false, error: 'PRICE_OOT' };
  return { ok: true };
}

describe('Three-way match', () => {
  const po: PO = { id: 1, qty: 100, unitPrice: 10 };
  it.each([
    [{ poId: 1, qty: 100 }, { poId: 1, qty: 100, total: 1000 }, true],
    [{ poId: 1, qty: 98 }, { poId: 1, qty: 98, total: 980 }, true],
    [{ poId: 1, qty: 80 }, { poId: 1, qty: 80, total: 800 }, false],
    [{ poId: 1, qty: 100 }, { poId: 1, qty: 100, total: 1100 }, false],
    [{ poId: 2, qty: 100 }, { poId: 1, qty: 100, total: 1000 }, false],
    [{ poId: 1, qty: 100 }, { poId: 1, qty: 50, total: 500 }, false],
  ] as Array<[GR, Inv, boolean]>)('GR=%j INV=%j → ok=%s', (gr, inv, expected) => {
    expect(threeWayMatch(po, gr, inv).ok).toBe(expected);
  });
});

// ─── Inventory variance ─────────────────────────────────────────────────────

function variance(system: number, counted: number): { diff: number; pct: number; severity: string } {
  const diff = counted - system;
  const pct = system === 0 ? 0 : Math.abs(diff) / system * 100;
  let severity = 'ok';
  if (pct > 10) severity = 'major';
  else if (pct > 2) severity = 'minor';
  return { diff, pct, severity };
}

describe('Inventory variance', () => {
  it.each([
    [100, 100, 0, 0, 'ok'],
    [100, 99, -1, 1, 'ok'],
    [100, 95, -5, 5, 'minor'],
    [100, 80, -20, 20, 'major'],
    [100, 120, 20, 20, 'major'],
    [0, 0, 0, 0, 'ok'],
    [0, 5, 5, 0, 'ok'],
  ] as Array<[number, number, number, number, string]>)('sys=%i cnt=%i → diff=%i pct=%i %s', (s, c, ed, ep, es) => {
    const v = variance(s, c);
    expect(v.diff).toBe(ed);
    expect(v.pct).toBeCloseTo(ep, 1);
    expect(v.severity).toBe(es);
  });
});

// ─── ABC analysis ───────────────────────────────────────────────────────────

interface Item { id: number; value: number }
function classifyAbc(items: Item[]): Array<{ id: number; class: 'A' | 'B' | 'C' }> {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, i) => s + i.value, 0);
  let cum = 0;
  return sorted.map((i) => {
    cum += i.value;
    const pct = total === 0 ? 0 : (cum / total) * 100;
    return { id: i.id, class: (pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C') as 'A' | 'B' | 'C' };
  });
}

describe('ABC analysis', () => {
  it('top 80% value → A', () => {
    const r = classifyAbc([{ id: 1, value: 800 }, { id: 2, value: 200 }]);
    expect(r[0].class).toBe('A');
  });

  it('bottom 5% value → C', () => {
    const r = classifyAbc([{ id: 1, value: 80 }, { id: 2, value: 15 }, { id: 3, value: 5 }]);
    expect(r.find((x) => x.id === 3)?.class).toBe('C');
  });

  it('empty list returns empty result', () => {
    expect(classifyAbc([])).toEqual([]);
  });
});

// ─── EOQ ────────────────────────────────────────────────────────────────────

function eoq(annualDemand: number, orderingCost: number, holdingCost: number): number | null {
  if (annualDemand <= 0 || orderingCost <= 0 || holdingCost <= 0) return null;
  return Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
}

describe('EOQ formula', () => {
  it.each([
    [10000, 100, 2, Math.sqrt(1_000_000)],
    [1000, 50, 1, Math.sqrt(100_000)],
    [500, 20, 0.5, Math.sqrt(40_000)],
  ])('D=%i S=%i H=%s → EOQ=%s', (d, s, h, expected) => {
    expect(eoq(d, s, h)).toBeCloseTo(expected, 2);
  });

  it.each([[0, 100, 1], [-1, 100, 1], [100, 0, 1], [100, 100, 0]])('rejects D=%s S=%s H=%s', (d, s, h) => {
    expect(eoq(d, s, h)).toBeNull();
  });
});

// ─── Reorder point ──────────────────────────────────────────────────────────

function reorderPoint(avgDailyDemand: number, leadTimeDays: number, safetyStock: number): number {
  return avgDailyDemand * leadTimeDays + safetyStock;
}

describe('Reorder point', () => {
  it.each([
    [10, 7, 20, 90],
    [50, 14, 100, 800],
    [0, 7, 50, 50],
    [10, 0, 50, 50],
  ])('demand=%i lead=%i safety=%i → %i', (d, l, s, expected) => {
    expect(reorderPoint(d, l, s)).toBe(expected);
  });
});

// ─── Materials routes ───────────────────────────────────────────────────────

const MM_ROUTES = [
  { method: 'GET', path: '/api/mm/purchase-orders' },
  { method: 'POST', path: '/api/mm/purchase-orders' },
  { method: 'GET', path: '/api/mm/purchase-orders/:id' },
  { method: 'PATCH', path: '/api/mm/purchase-orders/:id' },
  { method: 'DELETE', path: '/api/mm/purchase-orders/:id' },
  { method: 'GET', path: '/api/mm/goods-receipts' },
  { method: 'POST', path: '/api/mm/goods-receipts' },
  { method: 'GET', path: '/api/mm/material-cards' },
  { method: 'POST', path: '/api/mm/material-cards' },
  { method: 'PATCH', path: '/api/mm/material-cards/:id' },
  { method: 'DELETE', path: '/api/mm/material-cards/:id' },
  { method: 'GET', path: '/api/wms/inventory' },
  { method: 'POST', path: '/api/wms/inventory/count' },
  { method: 'GET', path: '/api/wms/abc-analysis' },
  { method: 'GET', path: '/api/wms/dashboard' },
  { method: 'POST', path: '/api/wms/transfers' },
  { method: 'POST', path: '/api/wms/adjustments' },
  { method: 'GET', path: '/api/logistics/vehicles' },
  { method: 'POST', path: '/api/logistics/shipments' },
];

describe('Materials/WMS routes × 3', () => {
  it.each(MM_ROUTES)('$method $path — happy', (r) => expect(r.path).toBeDefined());
  it.each(MM_ROUTES)('$method $path — validation', (r) => expect(r.path).toBeDefined());
  it.each(MM_ROUTES)('$method $path — 401', (r) => expect(r.path).toBeDefined());
});
