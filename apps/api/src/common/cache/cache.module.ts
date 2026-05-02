/**
 * cache.module.ts — CacheService DI moduli.
 *
 * Redis (REDIS_CLIENT) va LRU L1 keshni birlashtiradi.
 * Factory provider orqali REDIS_CLIENT → CacheService inject qilinadi.
 * CacheService o'zi @Inject ishlatmaydi — test izolatsiyasi saqlanadi.
 */
import { Module, Global } from '@nestjs/common';
import type Redis from 'ioredis';
import { RedisModule, REDIS_CLIENT } from '@/infrastructure/redis/redis.module';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    {
      provide: CacheService,
      useFactory: (redis: Redis | null) => new CacheService(redis),
      inject: [{ token: REDIS_CLIENT, optional: true }],
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}
