/**
 * @module hr-assets-schema.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HrAssetsSchemaRepository } from './hr-assets-schema.repository';

@Injectable()
export class HrAssetsSchemaService implements OnModuleInit {
  private readonly logger = new Logger(HrAssetsSchemaService.name);
  constructor(private readonly repo: HrAssetsSchemaRepository) {}

  onModuleInit(): void {
    this.repo.ensureTables().catch((e: unknown) => this.logger.warn(`hr-assets schema init: ${e}`));
  }
}
