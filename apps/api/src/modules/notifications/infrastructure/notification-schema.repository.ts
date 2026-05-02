import { Ok, Err, Result } from '@common/result';
import { Injectable, Logger } from '@nestjs/common';
import { ensureNotificationTables } from '@common/database/ddl-migrations';

@Injectable()
export class NotificationSchemaRepository {
  private readonly logger = new Logger(NotificationSchemaRepository.name);

  async ensurePreferencesTables(): Promise<Result<void>>  {
  try {  
      await ensureNotificationTables();
      this.logger.log('notification-schema: notification_preferences ensured');  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
