import { Global, Module } from '@nestjs/common';
import { Database } from './database';
import { Sprint2MigrationService } from './sprint2-migration.service';
import { Sprint4MigrationService } from './sprint4-migration.service';
import { Sprint5MigrationService } from './sprint5-migration.service';

@Global()
@Module({
  providers: [Database, Sprint2MigrationService, Sprint4MigrationService, Sprint5MigrationService],
  exports: [Database],
})
export class DatabaseModule {}
