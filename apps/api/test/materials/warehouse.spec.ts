/**
 * test/materials/warehouse.spec.ts
 *
 * Materials / WMS pure-logic: three-way match, inventory variance, ABC.
 */

interface PurchaseOrder { id: number; itemId: number; orderedQty: number; unitPrice: number }
interface GoodsReceipt { poId: number; receivedQty: number }
interface VendorInvoice { poId: number; invoiceQty: number; invoiceTotal: number }

const TOLERANCE_PCT = 5; // ±5%

function threeWayMatch(po: PurchaseOrder, gr: GoodsReceipt, inv: VendorInvoice): { ok: boolean; error?: string } {
  if (po.id !== gr.poId || po.id !== inv.poId) return { ok: false, error: 'PO_MISMATCH' };
  const qtyDiff = Math.abs(po.orderedQty - gr.receivedQty) / po.orderedQty * 100;
  if (qtyDiff > TOLERANCE_PCT) return { ok: false, error: 'QTY_OUT_OF_TOLERANCE' };
  const invQtyDiff = Math.abs(gr.receivedQty - inv.invoiceQty) / gr.receivedQty * 100;
  if (invQtyDiff > TOLERANCE_PCT) return { ok: false, error: 'INVOICE_QTY_MISMATCH' };
  const expectedTotal = gr.receivedQty * po.unitPrice;
  const priceDiff = Math.abs(expectedTotal - inv.invoiceTotal) / expectedTotal * 100;
  if (priceDiff > TOLERANCE_PCT) return { ok: false, error: 'PRICE_OUT_OF_TOLERANCE' };
  return { ok: true };
}

describe('Three-way match (PO × GR × Invoice)', () => {
  const po: PurchaseOrder = { id: 1, itemId: 100, orderedQty: 100, unitPrice: 10 };

  it('passes when all three documents match exactly', () => {
    const gr: GoodsReceipt = { poId: 1, receivedQty: 100 };
    const inv: VendorInvoice = { poId: 1, invoiceQty: 100, invoiceTotal: 1000 };
    expect(threeWayMatch(po, gr, inv).ok).toBe(true);
  });

  it('passes within tolerance band (±5%)', () => {
    const gr: GoodsReceipt = { poId: 1, receivedQty: 98 };  // -2%
    const inv: VendorInvoice = { poId: 1, invoiceQty: 98, invoiceTotal: 980 };
    expect(threeWayMatch(po, gr, inv).ok).toBe(true);
  });

  it('rejects qty short outside tolerance', () => {
    const gr: GoodsReceipt = { poId: 1, receivedQty: 80 };  // -20%
    const inv: VendorInvoice = { poId: 1, invoiceQty: 80, invoiceTotal: 800 };
    expect(threeWayMatch(po, gr, inv).error).toBe('QTY_OUT_OF_TOLERANCE');
  });

  it('rejects when PO ids do not match', () => {
    const gr: GoodsReceipt = { poId: 999, receivedQty: 100 };
    const inv: VendorInvoice = { poId: 1, invoiceQty: 100, invoiceTotal: 1000 };
    expect(threeWayMatch(po, gr, inv).error).toBe('PO_MISMATCH');
  });

  it('rejects price inflation > 5%', () => {
    const gr: GoodsReceipt = { poId: 1, receivedQty: 100 };
    const inv: VendorInvoice = { poId: 1, invoiceQty: 100, invoiceTotal: 1100 };  // +10%
    expect(threeWayMatch(po, gr, inv).error).toBe('PRICE_OUT_OF_TOLERANCE');
  });

  it('rejects when invoiced qty differs from received', () => {
    const gr: GoodsReceipt = { poId: 1, receivedQty: 100 };
    const inv: VendorInvoice = { poId: 1, invoiceQty: 50, invoiceTotal: 500 };
    expect(threeWayMatch(po, gr, inv).error).toBe('INVOICE_QTY_MISMATCH');
  });
});

// ─── Inventory variance ─────────────────────────────────────────────────────

function calcVariance(systemQty: number, countedQty: number): { qtyDiff: number; pct: number; severity: 'ok' | 'minor' | 'major' } {
  const qtyDiff = countedQty - systemQty;
  const pct = systemQty === 0 ? 0 : Math.abs(qtyDiff) / systemQty * 100;
  let severity: 'ok' | 'minor' | 'major' = 'ok';
  if (pct > 10) severity = 'major';
  else if (pct > 2) severity = 'minor';
  return { qtyDiff, pct, severity };
}

describe('Inventory variance', () => {
  it('exact match → severity ok', () => {
    expect(calcVariance(100, 100).severity).toBe('ok');
  });

  it('1% diff → severity ok', () => {
    expect(calcVariance(100, 99).severity).toBe('ok');
  });

  it('5% diff → severity minor', () => {
    expect(calcVariance(100, 95).severity).toBe('minor');
  });

  it('20% diff → severity major', () => {
    expect(calcVariance(100, 80).severity).toBe('major');
  });

  it('negative diff (shrinkage)', () => {
    const v = calcVariance(100, 95);
    expect(v.qtyDiff).toBe(-5);
  });

  it('positive diff (overage)', () => {
    const v = calcVariance(100, 110);
    expect(v.qtyDiff).toBe(10);
  });

  it('zero system qty does not divide by zero', () => {
    expect(calcVariance(0, 5).pct).toBe(0);
  });
});

// ─── ABC classification ─────────────────────────────────────────────────────

interface Item { id: number; annualValue: number }

function classifyAbc(items: Item[]): Array<{ id: number; cumPct: number; class: 'A' | 'B' | 'C' }> {
  const sorted = [...items].sort((a, b) => b.annualValue - a.annualValue);
  const total = sorted.reduce((s, i) => s + i.annualValue, 0);
  let cum = 0;
  return sorted.map((i) => {
    cum += i.annualValue;
    const cumPct = total === 0 ? 0 : (cum / total) * 100;
    const cls: 'A' | 'B' | 'C' = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C';
    return { id: i.id, cumPct, class: cls };
  });
}

describe('ABC classification', () => {
  it('top items by value get class A', () => {
    const r = classifyAbc([
      { id: 1, annualValue: 8000 },
      { id: 2, annualValue: 1500 },
      { id: 3, annualValue: 500 },
    ]);
    expect(r[0].class).toBe('A');
    expect(r[2].class).toBe('C');
  });

  it('empty list returns empty result', () => {
    expect(classifyAbc([])).toEqual([]);
  });
});
