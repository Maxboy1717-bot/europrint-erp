/**
 * @module drizzle-materials-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db, materials } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import { IMaterialsSvcRepository } from './i-materials-svc.repo';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
@Injectable()
export class DrizzleMaterialsSvcRepository implements IMaterialsSvcRepository {
  async findAll(): Promise<Result<object[]>> {
    try {
      // NOTE: materials.id = uuid (DB truth); table has no deleted_at column
      // (soft-delete not modeled for materials — isActive is the lifecycle flag).
      const rows = await db.select().from(materials).limit(MAX_QUERY_LIMIT).offset(0);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Materiallar topilmadi');
    }
  }
}
