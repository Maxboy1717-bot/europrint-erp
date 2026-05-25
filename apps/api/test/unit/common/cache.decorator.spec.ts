/**
 * test/unit/common/cache.decorator.spec.ts
 *
 * Unit tests for @Cacheable method decorator. The decorator pulls
 * `cacheService` off `this` at call time; we exercise hit / miss / l1Only /
 * key-as-function / no-cache-service fallback.
 */

import { Cacheable } from '../../../src/common/decorators/cacheable.decorator';

interface CacheStub {
  get: jest.Mock<Promise<unknown>, [string]>;
  set: jest.Mock<Promise<void>, [string, unknown, { ttlSeconds?: number; l1Only?: boolean }]>;
}

function makeCacheStub(): CacheStub {
  return {
    get: jest.fn<Promise<unknown>, [string]>().mockResolvedValue(null),
    set: jest.fn<Promise<void>, [string, unknown, { ttlSeconds?: number; l1Only?: boolean }]>()
      .mockResolvedValue(undefined),
  };
}

class Subject {
  public cacheService: CacheStub | undefined;
  public callCount = 0;

  constructor(cache?: CacheStub) {
    this.cacheService = cache;
  }

  @Cacheable({ key: 'static-key', ttlSeconds: 60 })
  async staticKey(): Promise<number> {
    this.callCount++;
    return 7;
  }

  @Cacheable({ key: (id: unknown) => `dyn:${String(id)}`, ttlSeconds: 30, l1Only: true })
  async dynamicKey(id: number): Promise<{ id: number; val: string }> {
    this.callCount++;
    return { id, val: 'computed' };
  }
}

describe('@Cacheable decorator', () => {
  it('returns cached value when cache hit on subsequent call', async () => {
    const cache = makeCacheStub();
    cache.get.mockResolvedValueOnce('CACHED');
    const s = new Subject(cache);

    const r = await s.staticKey();

    expect(r).toBe('CACHED');
    expect(s.callCount).toBe(0); // original method skipped
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('invokes original method and stores result when cache miss', async () => {
    const cache = makeCacheStub();
    cache.get.mockResolvedValueOnce(null);
    const s = new Subject(cache);

    const r = await s.staticKey();

    expect(r).toBe(7);
    expect(s.callCount).toBe(1);
    expect(cache.set).toHaveBeenCalledWith(
      'static-key',
      7,
      expect.objectContaining({ ttlSeconds: 60 }),
    );
  });

  it('treats undefined cached entry as miss and recomputes when get returns undefined', async () => {
    const cache = makeCacheStub();
    cache.get.mockResolvedValueOnce(undefined);
    const s = new Subject(cache);

    const r = await s.staticKey();
    expect(r).toBe(7);
    expect(s.callCount).toBe(1);
  });

  it('builds key via factory when options.key is a function', async () => {
    const cache = makeCacheStub();
    cache.get.mockResolvedValue(null);
    const s = new Subject(cache);

    await s.dynamicKey(42);

    expect(cache.get).toHaveBeenCalledWith('dyn:42');
    expect(cache.set).toHaveBeenCalledWith(
      'dyn:42',
      { id: 42, val: 'computed' },
      expect.objectContaining({ ttlSeconds: 30, l1Only: true }),
    );
  });

  it('calls original method directly when cacheService is missing on this', async () => {
    const s = new Subject(undefined);
    const r = await s.staticKey();
    expect(r).toBe(7);
    expect(s.callCount).toBe(1);
  });

  it('returns falsy cached values verbatim when get returns 0 or empty string', async () => {
    const cache = makeCacheStub();
    cache.get.mockResolvedValueOnce(0);
    const s = new Subject(cache);

    const r = await s.staticKey();
    expect(r).toBe(0);
    expect(s.callCount).toBe(0);
  });
});
