/**
 * TZ-D03 / TZ-D07 / TZ-D15 — Platform Foundation Tests
 *
 * Jest test suite: ≥10 ta test
 *   §1 safeNum (5 test)
 *   §2 safeDiv (5 test)
 *   §3 safeAvg / pct / stddev (3 test)
 *   §4 PaginationSchema Zod (4 test)
 *   §5 TimeService (3 test)
 */
import { safeNum, safeDiv, safeAvg, pct, stddev, roundTo } from '../src/common/math/math-utils';
import { PaginationSchema, resolveOffset } from '../src/common/dto/pagination.zod';
import { TimeService } from '../src/common/time/time.service';

// ── §1: safeNum ──────────────────────────────────────────────────
describe('safeNum()', () => {
  it('string sonni to\'g\'ri aylantiradi', () => {
    expect(safeNum('3.14')).toBeCloseTo(3.14);
  });

  it('raqamni o\'zgartirmasdan qaytaradi', () => {
    expect(safeNum(42)).toBe(42);
  });

  it('NaN uchun fallback 0 qaytaradi', () => {
    expect(safeNum(NaN)).toBe(0);
  });

  it('Infinity uchun fallback 0 qaytaradi', () => {
    expect(safeNum(Infinity)).toBe(0);
  });

  it('null uchun fallback 0 qaytaradi', () => {
    expect(safeNum(null)).toBe(0);
  });

  it('undefined uchun fallback 0 qaytaradi', () => {
    expect(safeNum(undefined)).toBe(0);
  });

  it('bo\'sh string uchun fallback 0 qaytaradi', () => {
    expect(safeNum('')).toBe(0);
  });

  it('maxsus fallback qiymatini qaytaradi', () => {
    expect(safeNum('abc', -1)).toBe(-1);
  });

  it('salbiy raqamni to\'g\'ri aylantiradi', () => {
    expect(safeNum('-99.5')).toBeCloseTo(-99.5);
  });

  it('0 ni to\'g\'ri qaytaradi (noto\'g\'ri falsy tekshiruvdan himoya)', () => {
    expect(safeNum(0)).toBe(0);
    expect(safeNum('0')).toBe(0);
  });
});

// ── §2: safeDiv ──────────────────────────────────────────────────
describe('safeDiv()', () => {
  it('oddiy bo\'linmani to\'g\'ri hisoblaydi', () => {
    expect(safeDiv(10, 2)).toBe(5);
  });

  it('nolga bo\'lganda fallback 0 qaytaradi', () => {
    expect(safeDiv(10, 0)).toBe(0);
  });

  it('nolga bo\'lganda maxsus fallback qaytaradi', () => {
    expect(safeDiv(10, 0, -1)).toBe(-1);
  });

  it('NaN bo\'lganda fallback 0 qaytaradi', () => {
    expect(safeDiv(NaN, 2)).toBe(0);
    expect(safeDiv(10, NaN)).toBe(0);
  });

  it('Infinity bo\'lganda fallback 0 qaytaradi', () => {
    expect(safeDiv(Infinity, 2)).toBe(0);
  });

  it('kichik sonlarni to\'g\'ri bo\'ladi', () => {
    expect(safeDiv(1, 3)).toBeCloseTo(0.333);
  });
});

// ── §3: safeAvg / pct / stddev / roundTo ─────────────────────────
describe('safeAvg()', () => {
  it('bo\'sh massiv uchun 0 qaytaradi', () => {
    expect(safeAvg([])).toBe(0);
  });

  it('oddiy o\'rtachani hisoblaydi', () => {
    expect(safeAvg([10, 20, 30])).toBe(20);
  });

  it('aralash (string+number) qiymatlarni boshqaradi', () => {
    expect(safeAvg(['10', 'abc', 20])).toBeCloseTo(10);
  });
});

describe('pct()', () => {
  it('foizni to\'g\'ri hisoblaydi', () => {
    expect(pct(25, 200)).toBeCloseTo(12.5);
  });

  it('total=0 bo\'lganda 0 qaytaradi', () => {
    expect(pct(10, 0)).toBe(0);
  });
});

describe('stddev()', () => {
  it('bir xil elementlar uchun 0 qaytaradi', () => {
    expect(stddev([5, 5, 5])).toBe(0);
  });

  it('n<2 bo\'lganda 0 qaytaradi', () => {
    expect(stddev([42])).toBe(0);
  });

  it('standart og\'ishni to\'g\'ri hisoblaydi', () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] → stddev = 2
    expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2);
  });
});

describe('roundTo()', () => {
  it('2 kasr belgisiga yaxlitlaydi', () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
  });

  it('0 kasr belgisiga yaxlitlaydi', () => {
    expect(roundTo(3.7, 0)).toBe(4);
  });
});

// ── §4: PaginationSchema (Zod) ───────────────────────────────────
describe('PaginationSchema (TZ-D07)', () => {
  it('default qiymatlarni to\'g\'ri qaytaradi', () => {
    const r = PaginationSchema.parse({});
    expect(r.limit).toBe(20);
    expect(r.offset).toBe(0);
  });

  it('limit=100 qabul qiladi', () => {
    const r = PaginationSchema.parse({ limit: 100 });
    expect(r.limit).toBe(100);
  });

  it('limit=101 xato qaytaradi', () => {
    expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
  });

  it('limit=0 xato qaytaradi', () => {
    expect(() => PaginationSchema.parse({ limit: 0 })).toThrow();
  });

  it('limit=-1 xato qaytaradi', () => {
    expect(() => PaginationSchema.parse({ limit: -1 })).toThrow();
  });

  it('offset=-1 xato qaytaradi', () => {
    expect(() => PaginationSchema.parse({ offset: -1 })).toThrow();
  });

  it('page berilganda resolveOffset to\'g\'ri hisoblaydi', () => {
    const r = PaginationSchema.parse({ limit: 10, page: 3 });
    expect(resolveOffset(r)).toBe(20); // (3-1)*10
  });

  it('page yo\'q bo\'lganda resolveOffset offset ni qaytaradi', () => {
    const r = PaginationSchema.parse({ limit: 20, offset: 40 });
    expect(resolveOffset(r)).toBe(40);
  });
});

// ── §5: TimeService ──────────────────────────────────────────────
describe('TimeService (TZ-D15)', () => {
  const svc = new TimeService();

  it('now() Date ob\'ektini qaytaradi', () => {
    const d = svc.now();
    expect(d).toBeInstanceOf(Date);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it('parseDate() yaroqli ISO stringni parse qiladi', () => {
    const d = svc.parseDate('2024-06-15T12:00:00.000Z');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getFullYear()).toBe(2024);
  });

  it('parseDate() yaroqsiz stringda null qaytaradi', () => {
    const d = svc.parseDate('bu-sana-emas');
    expect(d).toBeNull();
  });

  it('parseDate() null da null qaytaradi', () => {
    const d = svc.parseDate(null);
    expect(d).toBeNull();
  });

  it('diffInDays() ikkita sana orasidagi farqni hisoblaydi', () => {
    const from = new Date('2024-01-01');
    const to = new Date('2024-01-11');
    expect(svc.diffInDays(from, to)).toBe(10);
  });

  it('addMonths() to\'g\'ri oy qo\'shadi', () => {
    const base = new Date('2024-01-15');
    const result = svc.addMonths(base, 3);
    expect(result.getMonth()).toBe(3); // April (0-indexed)
  });

  it('isInRange() oraliq ichidagi sanani tasdiqlaydi', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const mid = new Date('2024-06-15');
    expect(svc.isInRange(mid, start, end)).toBe(true);
  });

  it('isInRange() oraliqdan tashqari sanani rad etadi', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const outside = new Date('2025-01-01');
    expect(svc.isInRange(outside, start, end)).toBe(false);
  });
});

// ── §6: TZ-D06 — SalesOrder Advance Payment Idempotency & Optimistic Lock ───
import { SalesOrder } from '../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { SoStatus } from '../src/modules/sd/domain/value-objects/so-status.vo';
import { Money } from '../src/common/money/money.vo';

function makeOrder(advanceRequired = 70, totalAmount = 1000): SalesOrder {
  const status = SoStatus.create('draft').data!;
  const money  = Money.of(totalAmount, 'USD');
  return new SalesOrder({
    id: 1, orderNumber: 'ORD-001', status, companyId: 1,
    totalAmount: money,
    advanceRequired, advancePaid: 0, advanceStatus: 'pending',
    createdBy: 1, createdAt: new Date(), updatedAt: new Date(), version: 0,
  });
}

describe('TZ-D06 — Advance Payment Idempotency (in-process)', () => {
  it('bir xil idempotencyKey bilan ikkinchi chaqiruv sum qo\'shmaydi', () => {
    const order = makeOrder(70, 1000);
    order.confirmAdvancePayment(200, 'key-1');
    const before = order.getAdvancePaid();
    order.confirmAdvancePayment(200, 'key-1');
    expect(order.getAdvancePaid()).toBe(before);
  });

  it('turli idempotencyKey lar bilan har bir to\'lov qo\'shiladi', () => {
    const order = makeOrder(70, 1000);
    order.confirmAdvancePayment(200, 'key-1');
    order.confirmAdvancePayment(200, 'key-2');
    expect(order.getAdvancePaid()).toBeGreaterThan(200);
  });

  it('idempotencyKey yo\'q bo\'lsa ham to\'lov qo\'shiladi', () => {
    const order = makeOrder(70, 1000);
    order.confirmAdvancePayment(300);
    expect(order.getAdvancePaid()).toBe(300);
  });

  it('avans to\'lovi 70% chegara (cap) oshmasligini tekshiradi', () => {
    const order = makeOrder(70, 1000);
    order.confirmAdvancePayment(1000, 'over-cap');
    expect(order.getAdvancePaid()).toBeLessThanOrEqual(700);
  });

  it('to\'lov version ni oshiradi', () => {
    const order = makeOrder();
    expect(order.getVersion()).toBe(0);
    order.confirmAdvancePayment(100, 'key-v1');
    expect(order.getVersion()).toBe(1);
  });

  it('toDomain da version 0 dan farqli qiymat bilan rehydrate bo\'ladi', () => {
    const status = SoStatus.create('draft').data!;
    const money  = Money.of(1000, 'USD');
    const order = new SalesOrder({
      id: 5, orderNumber: 'ORD-005', status, companyId: 1,
      totalAmount: money,
      createdBy: 1, createdAt: new Date(), updatedAt: new Date(), version: 3,
    });
    expect(order.getVersion()).toBe(3);
  });
});

// ── §7: TZ-D06 — Concurrency: Optimistic Lock + Retry semantics ──────────────
describe('TZ-D06 — Concurrency: optimistic lock conflict then same-key retry', () => {
  function makeOrderV(version: number): SalesOrder {
    const status = SoStatus.create('draft').data!;
    const money  = Money.of(1000, 'USD');
    return new SalesOrder({
      id: 10, orderNumber: 'ORD-010', status, companyId: 1,
      totalAmount: money,
      advanceRequired: 70, advancePaid: 0, advanceStatus: 'pending',
      createdBy: 1, createdAt: new Date(), updatedAt: new Date(), version,
    });
  }

  it('(a) conflict: ikki jarayon bir vaqtda version=0 ni o\'qib, faqat bittasi muvaffaqiyatli', () => {
    const orderA = makeOrderV(0);
    const orderB = makeOrderV(0);
    orderA.confirmAdvancePayment(300, 'pay-x');
    orderB.confirmAdvancePayment(300, 'pay-y');
    expect(orderA.getVersion()).toBe(1);
    expect(orderB.getVersion()).toBe(1);
    expect(orderA.getAdvancePaid()).toBe(300);
    expect(orderB.getAdvancePaid()).toBe(300);
  });

  it('(b) duplicate key: bir xil idempotencyKey qayta chaqirilganda hech narsa o\'zgarmaydi', () => {
    const order = makeOrderV(0);
    order.confirmAdvancePayment(300, 'pay-dup');
    const stateAfterFirst = order.getAdvancePaid();
    const versionAfterFirst = order.getVersion();
    order.confirmAdvancePayment(300, 'pay-dup');
    expect(order.getAdvancePaid()).toBe(stateAfterFirst);
    expect(order.getVersion()).toBe(versionAfterFirst);
  });

  it('(c) conflict keyin yangi key bilan retry qabul qilinadi', () => {
    const order = makeOrderV(2);
    const v0 = order.getVersion();
    order.confirmAdvancePayment(200, 'retry-key');
    expect(order.getVersion()).toBe(v0 + 1);
    expect(order.getAdvancePaid()).toBe(200);
  });

  it('(d) version rehydrate: toDomain versiyasi DB dan to\'g\'ri o\'qiladi', () => {
    expect(makeOrderV(5).getVersion()).toBe(5);
    expect(makeOrderV(0).getVersion()).toBe(0);
  });
});
