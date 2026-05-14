/**
 * @module database.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Global, Module } from '@nestjs/common';
import { Database } from './database';
import { Sprint2MigrationService } from './sprint2-migration.service';
import { Sprint4MigrationService } from './sprint4-migration.service';
import { Sprint5MigrationService } from './sprint5-migration.service';
import { Sprint6MigrationService } from './sprint6-migration.service';
import { CrmMigrationService } from './crm-migration.service';

@Global()
@Module({
  providers: [Database, Sprint2MigrationService, Sprint4MigrationService, Sprint5MigrationService, Sprint6MigrationService, CrmMigrationService],
  exports: [Database],
})
export class DatabaseModule {}
