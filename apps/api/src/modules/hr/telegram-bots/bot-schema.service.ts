/**
 * @module bot-schema.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BotSchemaRepository } from './bot-schema.repository';

@Injectable()
export class BotSchemaService implements OnModuleInit {
  private readonly logger = new Logger(BotSchemaService.name);
  constructor(private readonly repo: BotSchemaRepository) {}

  onModuleInit(): void {
    this.repo.ensureBotTables().catch((e: unknown) => this.logger.warn(`bot schema init: ${e}`));
  }

  async ensureBotTables(): Promise<void> {
    await this.repo.ensureBotTables();
  }
}
