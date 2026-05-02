/**
 * redis.module.ts — Redis (ioredis) client DI provider.
 *
 * REDIS_CLIENT token orqali ioredis instansiyasini inject qilish uchun.
 * CacheService, RbacCacheService va boshqa servicelar uchun umumiy provider.
 *
 * Ulanish: REDIS_URL yoki REDIS_HOST/REDIS_PORT/REDIS_PASSWORD/REDIS_DB
 * Agar Redis bo'lmasa — lazyConnect:true, app ishlab turadi (degraded mode).
 */

import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';
export { REDIS_CLIENT } from './redis.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const logger = new Logger('RedisModule');
        const url = configService.get<string>('REDIS_URL');

        const retryStrategy = (times: number) => {
          if (times > 3) {
            logger.warn('Redis ulanmadi (Redis mavjud emas) — degraded mode');
            return null;
          }
          return Math.min(times * 200, 2000);
        };

        const client = url
          ? new Redis(url, { lazyConnect: true, maxRetriesPerRequest: null, enableOfflineQueue: false, retryStrategy })
          : new Redis({
              host:     configService.get<string>('REDIS_HOST', 'localhost'),
              port:     Number(configService.get('REDIS_PORT', 6379)),
              password: configService.get<string | undefined>('REDIS_PASSWORD') || undefined,
              db:       Number(configService.get('REDIS_DB', 0)),
              lazyConnect: true,
              maxRetriesPerRequest: null,
              enableOfflineQueue: false,
              retryStrategy,
            });

        client.on('connect', () => logger.log('Redis ulanish o\'rnatildi'));
        client.on('error', (err: Error) => logger.warn(`Redis xato: ${err.message}`));

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
