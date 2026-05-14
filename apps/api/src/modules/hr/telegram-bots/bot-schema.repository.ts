/**
 * @module bot-schema.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable, Logger } from '@nestjs/common';
import { ensureBotTables } from '@common/database/ddl-migrations';

@Injectable()
export class BotSchemaRepository {
  private readonly logger = new Logger(BotSchemaRepository.name);

  async ensureBotTables(): Promise<Result<void>>  {
  try {  
      await ensureBotTables();
      this.logger.log('bot-schema: all bot tables ensured');  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
