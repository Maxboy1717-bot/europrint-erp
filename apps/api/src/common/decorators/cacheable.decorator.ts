/**
 * cacheable.decorator.ts — TZ-59: @Cacheable method dekoratoru.
 *
 * Ishlatish:
 *   @Cacheable({ key: (id: string) => `europrint:product:${id}:v1`, ttl: 300 })
 *   async findProduct(id: string): Promise<Product> { ... }
 *
 * Logika:
 *   1. keyFn(args) bilan kesh kaliti yaratiladi
 *   2. CacheService.get(key) → hit bo'lsa qaytariladi
 *   3. Miss: original metod chaqiriladi + CacheService.set(key, result)
 *
 * MUHIM: @Cacheable faqat async metodlarga qo'llanadi.
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
