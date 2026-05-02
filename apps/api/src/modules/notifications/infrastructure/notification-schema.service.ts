import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationSchemaRepository } from './notification-schema.repository';

@Injectable()
export class NotificationSchemaService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSchemaService.name);
  constructor(private readonly repo: NotificationSchemaRepository) {}

  onModuleInit(): void {
    this.repo.ensurePreferencesTables().catch((e: unknown) => this.logger.warn(`notification schema init: ${e}`));
  }
}
