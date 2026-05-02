import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { materials } from '@europrint/schemas';
import { isNull } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IMaterialsSvcRepository } from './i-materials-svc.repo';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
@Injectable()
export class DrizzleMaterialsSvcRepository implements IMaterialsSvcRepository {
  async findAll(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(materials).where(isNull(materials.deletedAt)).limit(MAX_QUERY_LIMIT).offset(0);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Materiallar topilmadi');
    }
  }
}
