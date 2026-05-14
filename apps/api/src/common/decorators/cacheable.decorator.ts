/**
 * @module cacheable.decorator
 * @description Method-level Redis caching. Wraps an async method so its
 *   result is cached against a configurable key; subsequent calls with
 *   the same key skip the original computation and return the cached
 *   value. Two-tier cache (L1 in-memory + L2 Redis) by default; L1-only
 *   for short-TTL hot data.
 *
 *   Usage:
 *     @Cacheable({ key: (id) => `europrint:product:${id}:v1`, ttlSeconds: 300 })
 *     async findProduct(id: string): Promise<Product> { ... }
 *
 *   Flow:
 *     1. Build cacheKey from `key` (function or static string)
 *     2. Look up cacheService.get(cacheKey)
 *     3. Cache hit → return cached value
 *     4. Cache miss → call original method, store result, return
 * @layer Decorator (cross-cutting)
 *
 * WHY KEY VERSIONING (`:v1` SUFFIX CONVENTION)
 *   When the cached shape changes (added field, renamed property), old
 *   cached entries become invalid. Bumping `:v1` → `:v2` in the key
 *   namespace forces an immediate cache miss on the new code path while
 *   old entries naturally expire. No flush required.
 *
 * WHY THE DECORATOR LOOKS UP `cacheService` ON `this` (not constructor-injected)
 *   NestJS decorators run before DI. Injecting via decorator parameter
 *   would require pulling from a global registry — fragile across tests.
 *   By reading `this.cacheService` at call time, we depend on whatever
 *   instance the class has DI'd in. The fallback (no cache service →
 *   call original directly) makes the decorator safe in tests where
 *   `CacheService` is not provided.
 *
 * WHY THE NULL/UNDEFINED CHECK ON CACHED RESULT
 *   `cacheService.get` returns `null` on miss, but a *cached* value might
 *   legitimately be `false`, `0`, or `""`. The explicit
 *   `!== null && !== undefined` check distinguishes "no cache entry" from
 *   "cache entry is a falsy value" — important for boolean and numeric
 *   results.
 *
 * WHY `l1Only` OPTION EXISTS
 *   L1 (in-memory) is process-local and fast but small. L2 (Redis) is
 *   shared across processes but has network cost. For very hot, very
 *   short TTL data (5-second OEE polls), l1Only avoids hammering Redis
 *   when stale-by-5s is acceptable. Default is L1+L2 for correctness.
 */

import { CacheService } from '@common/cache/cache.service';

export interface CacheableOptions {
  key: string | ((...args: unknown[]) => string);
  ttlSeconds?: number;
  l1Only?: boolean;
}

export function Cacheable(options: CacheableOptions): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const cacheService: CacheService | undefined =
        (this as Record<string, unknown>)['cacheService'] as CacheService | undefined;

      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      const cacheKey =
        typeof options.key === 'function'
          ? options.key(...args)
          : options.key;

      const cachedRes = await cacheService.get(cacheKey);
      if (cachedRes !== null && cachedRes !== undefined) {
        return cachedRes;
      }

      const result = await originalMethod.apply(this, args);

      await cacheService.set(cacheKey, result, {
        ttlSeconds: options.ttlSeconds,
        l1Only: options.l1Only,
      });

      return result;
    };

    return descriptor;
  };
}
