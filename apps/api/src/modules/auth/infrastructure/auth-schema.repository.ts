/**
 * @module auth-schema.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable, Logger } from '@nestjs/common';
import { ensureOtpTables } from '@common/database/ddl-migrations';

@Injectable()
export class AuthSchemaRepository {
  private readonly logger = new Logger(AuthSchemaRepository.name);

  async ensureOtpTables(): Promise<Result<void>> {
    try {
      await ensureOtpTables();
      this.logger.log('auth-schema: otp_sessions ensured');
      return Ok(undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
