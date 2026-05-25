/**
 * @module technology-schema.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TechnologySchemaRepository } from './technology-schema.repository';

@Injectable()
export class TechnologySchemaService implements OnModuleInit {
  private readonly logger = new Logger(TechnologySchemaService.name);
  constructor(private readonly repo: TechnologySchemaRepository) {}

  onModuleInit(): void {
    this.repo.ensureTables().catch((e: unknown) => this.logger.warn(`technology schema init: ${e}`));
  }
}
