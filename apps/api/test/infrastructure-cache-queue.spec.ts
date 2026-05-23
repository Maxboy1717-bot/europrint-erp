/**
 * infrastructure-cache-queue.spec.ts — Sprint 5: Infratuzilma testlari
 *
 * TZ-D02 Umumiy Soliq Hisoblash
 * TZ-59  Redis L1/L2 Kesh
 * TZ-60  BullMQ Exponential Backoff
 * TZ-61  Keyset Cursor Pagination
 * TZ-62  Materialized View Refresh Cron
 * TZ-63  Read Replica CQRS
 */

jest.mock('../src/shared/db', () => ({
  db:       {},
  rawSql:   jest.fn(),
  runQuery: jest.fn(),
  ddlRun:   jest.fn(),
}));

// ============================================================================
// TZ-D02: GeneralTaxService
// ============================================================================
import { GeneralTaxService } from '../src/modules/fi/tax/general-tax.service';

describe('TZ-D02: GeneralTaxService — Umumiy Soliq Hisoblash', () => {
  let svc: GeneralTaxService;
  let mockRunQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new GeneralTaxService();
    mockRunQuery = jest.requireMock('../src/shared/db').runQuery as jest.Mock;
  });

  // INCLUSIVE tests
  describe('calculate — INCLUSIVE', () => {
    it('12% INCLUSIVE: total=1000 → tax≈107.14, base≈892.86', () => {
      const r = svc.calculate(1000, { rate: 0.12, rateType: 'INCLUSIVE' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.rateType).toBe('INCLUSIVE');
      expect(r.data.total).toBe(1000);
      expect(r.data.tax).toBeCloseTo(107.14, 1);
      expect(r.data.base).toBeCloseTo(892.86, 1);
      expect(r.data.tax + r.data.base).toBeCloseTo(1000, 1);
    });

    it('20% INCLUSIVE: total=1200 → tax = 1200×0.2/1.2 = 200', () => {
      const r = svc.calculate(1200, { rate: 0.20, rateType: 'INCLUSIVE' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.tax).toBeCloseTo(200, 2);
      expect(r.data.base).toBeCloseTo(1000, 2);
    });

    it('0% INCLUSIVE: tax = 0, base = total', () => {
      const r = svc.calculate(500, { rate: 0, rateType: 'INCLUSIVE' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.tax).toBe(0);
      expect(r.data.base).toBe(500);
    });
  });

  // EXCLUSIVE tests
  describe('calculate — EXCLUSIVE', () => {
    it('12% EXCLUSIVE: base=1000 → tax=120, total=1120', () => {
      const r = svc.calculate(1000, { rate: 0.12, rateType: 'EXCLUSIVE' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.rateType).toBe('EXCLUSIVE');
      expect(r.data.base).toBe(1000);
      expect(r.data.tax).toBeCloseTo(120, 2);
      expect(r.data.total).toBeCloseTo(1120, 2);
    });

    it('0% EXCLUSIVE: tax = 0', () => {
      const r = svc.calculate(800, { rate: 0, rateType: 'EXCLUSIVE' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.tax).toBe(0);
      expect(r.data.total).toBe(800);
    });
  });

  // Validation tests
  it('manfiy summa → VALIDATION xato', () => {
    const r = svc.calculate(-100, { rate: 0.12, rateType: 'EXCLUSIVE' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('stavka > 1 → VALIDATION xato', () => {
    const r = svc.calculate(1000, { rate: 1.5, rateType: 'INCLUSIVE' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('stavka manfiy → VALIDATION xato', () => {
    const r = svc.calculate(1000, { rate: -0.1, rateType: 'EXCLUSIVE' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  // Batch
  it('calculateBatch: 3 satr → 3 natija', () => {
    const config = { rate: 0.12, rateType: 'EXCLUSIVE' as const };
    const r = svc.calculateBatch([
      { amount: 100, config },
      { amount: 200, config },
      { amount: 300, config },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toHaveLength(3);
    expect(r.data[2].tax).toBeCloseTo(36, 2);
  });

  it('calculateBatch: bitta xato → butun batch xato', () => {
    const r = svc.calculateBatch([
      { amount: 100, config: { rate: 0.12, rateType: 'EXCLUSIVE' as const } },
      { amount: -50, config: { rate: 0.12, rateType: 'EXCLUSIVE' as const } },
    ]);
    expect(r.ok).toBe(false);
  });

  // DB mock tests
  it('loadActiveRate: DB stavka qaytarsa → TaxRateConfig', async () => {
    mockRunQuery.mockResolvedValue([{
      id: 'cfg-1',
      company_id: 'COMPANY_A',
      rate_type: 'EXCLUSIVE',
      rate: '0.12',
      effective_from: '2024-01-01',
      effective_to: null,
    }]);
    const r = await svc.loadActiveRate('COMPANY_A', new Date('2025-01-01'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.rate).toBe(0.12);
    expect(r.data.rateType).toBe('EXCLUSIVE');
    expect(r.data.companyId).toBe('COMPANY_A');
    expect(r.data.effectiveTo).toBeNull();
  });

  it('loadActiveRate: bo\'sh natija → NOT_FOUND', async () => {
    mockRunQuery.mockResolvedValue([]);
    const r = await svc.loadActiveRate('UNKNOWN_COMPANY');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('loadActiveRate: effectiveTo sanasi to\'g\'ri parse qilinadi', async () => {
    mockRunQuery.mockResolvedValue([{
      id: 'cfg-2',
      company_id: 'COMPANY_B',
      rate_type: 'INCLUSIVE',
      rate: '0.15',
      effective_from: '2024-01-01',
      effective_to: '2025-12-31',
    }]);
    const r = await svc.loadActiveRate('COMPANY_B', new Date('2025-06-01'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.effectiveTo).toBeInstanceOf(Date);
    expect(r.data.rateType).toBe('INCLUSIVE');
  });
});

// ============================================================================
// TZ-59: CacheService — Redis L1/L2
// ============================================================================
import { CacheService, applyTtlJitter, IRedisClient } from '../src/common/cache/cache.service';

function createMockRedis(): jest.Mocked<IRedisClient> {
  return {
    get:  jest.fn().mockResolvedValue(null),
    set:  jest.fn().mockResolvedValue('OK'),
    del:  jest.fn().mockResolvedValue(1),
    scan: jest.fn().mockResolvedValue(['0', []]),
    status: 'ready',
  };
}

describe('TZ-59: CacheService — Redis L1 + L2', () => {
  it('applyTtlJitter: T_actual = T_base × (1 ± 10%)', () => {
    for (let i = 0; i < 100; i++) {
      const actual = applyTtlJitter(300);
      expect(actual).toBeGreaterThanOrEqual(270);
      expect(actual).toBeLessThanOrEqual(330);
    }
  });

  it('L1 hit: Redis chaqirilmaydi', async () => {
    const redis = createMockRedis();
    const svc = new CacheService(redis);
    await svc.set('k1', { name: 'test' }, { ttlSeconds: 60 });
    redis.get.mockClear();
    const val = await svc.get('k1');
    expect(val).toEqual({ name: 'test' });
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('L1 miss, L2 hit: Redis.get chaqiriladi, qaytariladi', async () => {
    const redis = createMockRedis();
    redis.get.mockResolvedValue(JSON.stringify({ price: 42 }));
    const svc = new CacheService(redis);
    svc.clearL1();
    const val = await svc.get<{ price: number }>('k2');
    expect(val).toEqual({ price: 42 });
    expect(redis.get).toHaveBeenCalledWith('k2');
  });

  it('L1 miss, L2 miss: null qaytariladi', async () => {
    const redis = createMockRedis();
    redis.get.mockResolvedValue(null);
    const svc = new CacheService(redis);
    const val = await svc.get('nonexistent');
    expect(val).toBeNull();
  });

  it('set: L1 va L2 ikkalasiga ham yoziladi', async () => {
    const redis = createMockRedis();
    const svc = new CacheService(redis);
    await svc.set('k3', 'value', { ttlSeconds: 120 });
    expect(redis.set).toHaveBeenCalledWith(
      'k3', JSON.stringify('value'), 'EX', expect.any(Number),
    );
    const l1 = await svc.get('k3');
    expect(l1).toBe('value');
  });

  it('set l1Only: Redis.set chaqirilmaydi', async () => {
    const redis = createMockRedis();
    const svc = new CacheService(redis);
    await svc.set('k4', 'only-l1', { ttlSeconds: 60, l1Only: true });
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('delete: L1 va L2 ikkalasidan o\'chiriladi', async () => {
    const redis = createMockRedis();
    const svc = new CacheService(redis);
    await svc.set('k5', 'deleteme');
    await svc.delete('k5');
    expect(redis.del).toHaveBeenCalledWith('k5');
    const val = await svc.get('k5');
    expect(val).toBeNull();
  });

  it('scan: SCAN chaqiriladi, KEYS emas', async () => {
    const redis = createMockRedis();
    redis.scan.mockResolvedValue(['0', ['europrint:product:1', 'europrint:product:2']]);
    const svc = new CacheService(redis);
    const result = await svc.scan('europrint:product:*');
    expect(redis.scan).toHaveBeenCalledWith('0', 'MATCH', 'europrint:product:*', 'COUNT', 100);
    expect(result.keys).toHaveLength(2);
  });

  it('Redis yo\'q: null qaytariladi (graceful degradation)', async () => {
    const svc = new CacheService(null);
    const val = await svc.get('any');
    expect(val).toBeNull();
  });

  it('set TTL Redis EX parametri jitter bilan [270,330] oralig\'ida', async () => {
    const redis = createMockRedis();
    const svc = new CacheService(redis);
    await svc.set('jitter-test', 'x', { ttlSeconds: 300 });
    const callArgs = redis.set.mock.calls[0] as [string, string, string, number];
    const ttlArg = callArgs[3];
    expect(ttlArg).toBeGreaterThanOrEqual(270);
    expect(ttlArg).toBeLessThanOrEqual(330);
  });
});

// ============================================================================
// TZ-60: BullMQ Backoff Formula
// ============================================================================
import { backoffDelay } from '../src/modules/queue/queue.constants';

describe('TZ-60: BullMQ Exponential Backoff', () => {
  const T0   = 1000;
  const TMAX = 1_800_000;

  it('attempt=0: t ≈ T0 (1000ms), jitter qo\'shiladi', () => {
    const t = backoffDelay(0, T0, TMAX);
    expect(t).toBeGreaterThanOrEqual(T0);
    expect(t).toBeLessThanOrEqual(T0 * 2);
  });

  it('attempt=1: t ≈ 2000ms', () => {
    const t = backoffDelay(1, T0, TMAX);
    expect(t).toBeGreaterThanOrEqual(2000);
    expect(t).toBeLessThanOrEqual(2000 + T0);
  });

  it('attempt=5: t = min(1800000, 32000 + jitter)', () => {
    const t = backoffDelay(5, T0, TMAX);
    expect(t).toBeGreaterThanOrEqual(32000);
    expect(t).toBeLessThanOrEqual(33000);
  });

  it('katta attempt: t ≤ t_max = 1800000ms', () => {
    for (let n = 0; n < 20; n++) {
      const t = backoffDelay(n, T0, TMAX);
      expect(t).toBeLessThanOrEqual(TMAX);
    }
  });

  it('attempt=20 (overflowed): t = t_max (cap ishlaydi)', () => {
    const t = backoffDelay(20, T0, TMAX);
    expect(t).toBeLessThanOrEqual(TMAX);
  });

  it('t_max parametri sozlanuvchi', () => {
    const t = backoffDelay(10, T0, 10_000);
    expect(t).toBeLessThanOrEqual(10_000);
  });
});

// ============================================================================
// TZ-61: KeysetPaginationService
// ============================================================================
import { KeysetPaginationService } from '../src/common/pagination/keyset-pagination.service';

describe('TZ-61: KeysetPaginationService — Cursor Pagination', () => {
  let svc: KeysetPaginationService;

  beforeEach(() => { svc = new KeysetPaginationService(); });

  it('encodeCursor → valid base64url string', () => {
    const token = svc.encodeCursor({ createdAt: '2024-01-01T00:00:00Z', id: 'abc' });
    expect(typeof token).toBe('string');
    expect(token).toMatch(/^[A-Za-z0-9_-]+=*$/);
  });

  it('decodeCursor: roundtrip encode→decode', () => {
    const cursor = { createdAt: '2025-03-15T12:30:00.000Z', id: 'uuid-123' };
    const token = svc.encodeCursor(cursor);
    const decoded = svc.decodeCursor(token);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.data.createdAt).toBe(cursor.createdAt);
    expect(decoded.data.id).toBe(cursor.id);
  });

  it('decodeCursor: noto\'g\'ri token → VALIDATION xato', () => {
    const r = svc.decodeCursor('!!!invalid-base64!!!');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('decodeCursor: to\'g\'ri base64 lekin fields yo\'q → VALIDATION', () => {
    const badToken = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64url');
    const r = svc.decodeCursor(badToken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  // paginateInMemory tests
  const makeItems = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `id-${String(i).padStart(3, '0')}`,
      createdAt: new Date(2024_000_000 + i * 1000).toISOString(),
      value: i,
    }));

  it('birinchi sahifa: cursor=null, 3 ta element', () => {
    const items = makeItems(10);
    const r = svc.paginateInMemory(items, null, 3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.data).toHaveLength(3);
    expect(r.data.hasMore).toBe(true);
    expect(r.data.nextCursor).not.toBeNull();
  });

  it('keyingi sahifa: cursor bilan davom etish', () => {
    const items = makeItems(10);
    const page1 = svc.paginateInMemory(items, null, 3);
    expect(page1.ok).toBe(true);
    if (!page1.ok) return;
    const page2 = svc.paginateInMemory(items, page1.data.nextCursor!, 3);
    expect(page2.ok).toBe(true);
    if (!page2.ok) return;
    expect(page2.data.data[0].id).toBe('id-003');
  });

  it('oxirgi sahifa: nextCursor = null, hasMore = false', () => {
    const items = makeItems(5);
    const r = svc.paginateInMemory(items, null, 10);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.hasMore).toBe(false);
    expect(r.data.nextCursor).toBeNull();
  });

  it('limit=0 → VALIDATION xato', () => {
    const r = svc.paginateInMemory([], null, 0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('buildNextCursor: rows < limit → undefined/falsy', () => {
    const rows = [{ id: 'a', createdAt: new Date() }];
    const next = svc.buildNextCursor(rows, 5);
    // Service returns undefined (falsy) when there are fewer rows than limit
    expect(next).toBeFalsy();
  });

  it('cursorToParams: cursor → { createdAt: Date, id, order }', () => {
    const cursor = { createdAt: '2024-06-01T00:00:00Z', id: 'test-id' };
    const token = svc.encodeCursor(cursor);
    const decoded = svc.decodeCursor(token);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    const params = svc.cursorToParams(decoded.data, 'DESC');
    expect(params.createdAt).toBeInstanceOf(Date);
    expect(params.id).toBe('test-id');
    expect(params.order).toBe('DESC');
  });
});

// ============================================================================
// TZ-62: MaterializedViewRefreshService
// ============================================================================
import { MaterializedViewRefreshService, MATERIALIZED_VIEWS } from '../src/modules/queue/materialized-view-refresh.service';

describe('TZ-62: MaterializedViewRefreshService — MV Refresh Cron', () => {
  let svc: MaterializedViewRefreshService;
  let mockDdlRun: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new MaterializedViewRefreshService();
    mockDdlRun = jest.requireMock('../src/shared/db').ddlRun as jest.Mock;
    mockDdlRun.mockResolvedValue(undefined);
  });

  it('3 ta materialized view nomi to\'g\'ri', () => {
    expect(MATERIALIZED_VIEWS).toContain('mv_sales_monthly');
    expect(MATERIALIZED_VIEWS).toContain('mv_inventory_daily');
    expect(MATERIALIZED_VIEWS).toContain('mv_kpi_daily');
    expect(MATERIALIZED_VIEWS).toHaveLength(3);
  });

  it('refreshView → ddlRun chaqiriladi', async () => {
    await svc.refreshView('mv_sales_monthly');
    expect(mockDdlRun).toHaveBeenCalledTimes(1);
  });

  it('refreshAll → barcha 3 ta view uchun ddlRun chaqiriladi', async () => {
    await svc.refreshAll();
    expect(mockDdlRun).toHaveBeenCalledTimes(3);
  });

  it('refreshView: ddlRun xato bo\'lsa → Err Result qaytariladi', async () => {
    mockDdlRun.mockRejectedValue(new Error('DB xato'));
    const r = await svc.refreshView('mv_kpi_daily');
    // Service uses Result pattern — errors are returned as Err, not thrown
    expect(r.ok).toBe(false);
  });

  it('refreshAll: bitta view xato → boshqalar bajariladi (allSettled)', async () => {
    mockDdlRun
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('mv_inventory_daily xato'))
      .mockResolvedValueOnce(undefined);
    await expect(svc.refreshAll()).resolves.not.toThrow();
    expect(mockDdlRun).toHaveBeenCalledTimes(3);
  });
});

// ============================================================================
// TZ-63: Read Replica CQRS
// ============================================================================
import { hasReadReplica } from '../src/shared/db/db-cqrs';

describe('TZ-63: Read Replica CQRS', () => {
  const origSlave = process.env.SLAVE_DATABASE_URL;

  afterEach(() => {
    if (origSlave === undefined) {
      delete process.env.SLAVE_DATABASE_URL;
    } else {
      process.env.SLAVE_DATABASE_URL = origSlave;
    }
  });

  it('SLAVE_DATABASE_URL yo\'q → hasReadReplica() = false', () => {
    delete process.env.SLAVE_DATABASE_URL;
    expect(hasReadReplica()).toBe(false);
  });

  it('SLAVE_DATABASE_URL bor → hasReadReplica() = true', () => {
    process.env.SLAVE_DATABASE_URL = 'postgresql://slave:5432/europrint';
    expect(hasReadReplica()).toBe(true);
  });
});
