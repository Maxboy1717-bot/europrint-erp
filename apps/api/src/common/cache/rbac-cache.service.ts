import { Injectable, Inject, Logger } from '@nestjs/common';
import { PermissionSet } from './permission-set.interface';
import { Result, safeCall } from '@common/result';

import { SECONDS_PER_HOUR } from '@common/constants/app.constants';
interface RedisClient {
  status: string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: string, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
}

@Injectable()
export class RbacCacheService {
  private readonly logger = new Logger(RbacCacheService.name);
  private redis: RedisClient;

  constructor(@Inject('default_IORedisModuleConnectionToken') redis: RedisClient) {
    this.redis = redis;
  }

  get isRedisConnected(): boolean {
    return this.redis?.status === 'ready';
  }

  async getPositionPerms(positionId: number): Promise<Result<PermissionSet | null>> {
    return safeCall(async () => {
      const key = `pos_perms:${positionId}`;
      const cached = await this.redis.get(key);
      if (!cached) { const missing: PermissionSet | null = null; return missing; }
      return JSON.parse(cached) as PermissionSet;
    });
  }

  async setPositionPerms(positionId: number, perms: PermissionSet): Promise<Result<void>> {
    return safeCall(async () => {
      const key = `pos_perms:${positionId}`;
      await this.redis.set(key, JSON.stringify(perms), 'EX', SECONDS_PER_HOUR);
    });
  }

  async clearPositionPerms(positionId: number): Promise<Result<void>> {
    return safeCall(async () => {
      const key = `pos_perms:${positionId}`;
      await this.redis.del(key);
    });
  }
}
