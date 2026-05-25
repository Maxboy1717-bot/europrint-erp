/**
 * @module technology-schema.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable, Logger } from '@nestjs/common';
import { ensureTechnologyTables } from '@common/database/ddl-migrations';

@Injectable()
export class TechnologySchemaRepository {
  private readonly logger = new Logger(TechnologySchemaRepository.name);

  async ensureTables(): Promise<Result<void>>  {
  try {  
      await ensureTechnologyTables();
      this.logger.log('technology-schema: technology_approvals ensured');  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
