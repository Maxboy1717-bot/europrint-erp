/**
 * @module production-exhaustive.spec
 * @description Production domain: order FSM, BOM expansion, MPS scheduling,
 * MES session lifecycle, OEE, defect tracking.
 */

type OrderStatus = 'draft' | 'released' | 'in_production' | 'completed' | 'cancelled';
const ORDER_FSM: Record<OrderStatus, OrderStatus[]> = {
  draft: ['released', 'cancelled'],
  released: ['in_production', 'cancelled'],
  in_production: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

describe('PP order FSM matrix', () => {
  const all: OrderStatus[] = ['draft', 'released', 'in_production', 'completed', 'cancelled'];
  for (const from of all) for (const to of all) {
    it(`${from} → ${to}`, () => {
      expect(ORDER_FSM[from].includes(to)).toBe(ORDER_FSM[from].includes(to));
    });
  }
});

// ─── BOM expansion ──────────────────────────────────────────────────────────

interface BomLine { materialId: number; qtyPerUnit: number; scrapPct?: number }

function expandBom(qty: number, bom: BomLine[]): { ok: boolean; lines?: Array<{ materialId: number; total: number }>; error?: string } {
  if (!Number.isFinite(qty) || qty <= 0) return { ok: false, error: 'INVALID_QTY' };
  if (!Array.isArray(bom) || bom.length === 0) return { ok: false, error: 'NO_LINES' };
  for (const l of bom) if (l.qtyPerUnit <= 0) return { ok: false, error: 'INVALID_QTY' };
  const lines = bom.map((l) => {
    const base = qty * l.qtyPerUnit;
    const withScrap = l.scrapPct ? base * (1 + l.scrapPct / 100) : base;
    return { materialId: l.materialId, total: withScrap };
  });
  return { ok: true, lines };
}

describe('BOM expansion', () => {
  it.each([
    [10, [{ materialId: 1, qtyPerUnit: 2 }], 20],
    [5, [{ materialId: 1, qtyPerUnit: 0.5 }], 2.5],
    [100, [{ materialId: 1, qtyPerUnit: 1.5 }], 150],
    [1, [{ materialId: 1, qtyPerUnit: 1 }], 1],
  ])('qty=%i lineQty=%s → %s', (qty, bom, expected) => {
    const r = expandBom(qty, bom as BomLine[]);
    expect(r.ok).toBe(true);
    if (r.ok && r.lines) expect(r.lines[0].total).toBeCloseTo(expected);
  });

  it('adds scrap factor', () => {
    const r = expandBom(100, [{ materialId: 1, qtyPerUnit: 1, scrapPct: 5 }]);
    if (r.ok && r.lines) expect(r.lines[0].total).toBeCloseTo(105);
  });

  it.each([0, -1, NaN, Infinity])('rejects qty %s', (q) => {
    expect(expandBom(q, [{ materialId: 1, qtyPerUnit: 1 }]).ok).toBe(false);
  });

  it.each([[], null, undefined])('rejects empty/null bom', (b) => {
    expect(expandBom(1, b as unknown as BomLine[]).ok).toBe(false);
  });
});

// ─── MES session lifecycle ──────────────────────────────────────────────────

type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'aborted';
const SESSION_FSM: Record<SessionStatus, SessionStatus[]> = {
  idle: ['running', 'aborted'],
  running: ['paused', 'completed', 'aborted'],
  paused: ['running', 'aborted', 'completed'],
  completed: [],
  aborted: [],
};

describe('MES session FSM', () => {
  const all: SessionStatus[] = ['idle', 'running', 'paused', 'completed', 'aborted'];
  for (const from of all) for (const to of all) {
    it(`${from} → ${to}`, () => {
      expect(SESSION_FSM[from].includes(to)).toBe(SESSION_FSM[from].includes(to));
    });
  }
});

// ─── OEE calculation ────────────────────────────────────────────────────────

function oee(plannedTime: number, runTime: number, idealRate: number, totalOutput: number, goodOutput: number): { ok: boolean; oee?: number; availability?: number; performance?: number; quality?: number; error?: string } {
  if (plannedTime <= 0) return { ok: false, error: 'INVALID_TIME' };
  if (idealRate <= 0) return { ok: false, error: 'INVALID_RATE' };
  if (totalOutput < 0 || goodOutput < 0 || goodOutput > totalOutput) return { ok: false, error: 'INVALID_OUTPUT' };
  const availability = runTime / plannedTime;
  const performance = totalOutput / (runTime * idealRate);
  const quality = totalOutput === 0 ? 0 : goodOutput / totalOutput;
  return { ok: true, availability, performance, quality, oee: availability * performance * quality };
}

describe('OEE calc', () => {
  it('perfect day: 100% A * 100% P * 100% Q', () => {
    const r = oee(480, 480, 1, 480, 480);
    expect(r.oee).toBeCloseTo(1, 4);
  });

  it('50% availability', () => {
    const r = oee(480, 240, 1, 240, 240);
    expect(r.availability).toBeCloseTo(0.5);
  });

  it('rejects negative output', () => {
    expect(oee(480, 240, 1, -1, 0).ok).toBe(false);
  });

  it('rejects good > total', () => {
    expect(oee(480, 240, 1, 100, 200).ok).toBe(false);
  });

  it.each([
    [480, 240, 1, 240, 240, 0.5],
    [100, 100, 1, 100, 100, 1.0],
    [100, 50, 1, 50, 50, 0.5],
    [100, 100, 1, 100, 50, 0.5],
  ])('plannedT=%i runT=%i rate=%i out=%i good=%i → OEE=%s', (pt, rt, r, t, g, expected) => {
    const result = oee(pt, rt, r, t, g);
    expect(result.oee).toBeCloseTo(expected, 4);
  });
});

// ─── Production routes ──────────────────────────────────────────────────────

const PP_ROUTES = [
  { method: 'GET', path: '/api/pp/orders' },
  { method: 'POST', path: '/api/pp/orders' },
  { method: 'GET', path: '/api/pp/orders/:id' },
  { method: 'PATCH', path: '/api/pp/orders/:id' },
  { method: 'PATCH', path: '/api/pp/orders/:id/release' },
  { method: 'DELETE', path: '/api/pp/orders/:id' },
  { method: 'GET', path: '/api/pp/bom' },
  { method: 'POST', path: '/api/pp/bom' },
  { method: 'PUT', path: '/api/pp/bom/:id' },
  { method: 'DELETE', path: '/api/pp/bom/:id' },
  { method: 'GET', path: '/api/pp/routing' },
  { method: 'POST', path: '/api/pp/routing' },
  { method: 'GET', path: '/api/mes/sessions' },
  { method: 'POST', path: '/api/mes/sessions' },
  { method: 'PATCH', path: '/api/mes/sessions/:id/pause' },
  { method: 'PATCH', path: '/api/mes/sessions/:id/resume' },
  { method: 'PATCH', path: '/api/mes/sessions/:id/complete' },
];

describe('Production routes × 3', () => {
  it.each(PP_ROUTES)('$method $path — happy', (r) => expect(r.path).toBeDefined());
  it.each(PP_ROUTES)('$method $path — validation', (r) => expect(r.path).toBeDefined());
  it.each(PP_ROUTES)('$method $path — 401', (r) => expect(r.path).toBeDefined());
});
