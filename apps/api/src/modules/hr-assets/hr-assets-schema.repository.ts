/**
 * @module hr-assets-schema.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable, Logger } from '@nestjs/common';
import { ensureHrAssetsTables } from '@common/database/ddl-migrations';

@Injectable()
export class HrAssetsSchemaRepository {
  private readonly logger = new Logger(HrAssetsSchemaRepository.name);

  async ensureTables(): Promise<Result<void>>  {
  try {  
      await ensureHrAssetsTables();
      this.logger.log('hr-assets-schema: employee_assets ensured');  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
