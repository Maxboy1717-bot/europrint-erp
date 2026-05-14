/**
 * @module hr-assets.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HrAssetsController } from './hr-assets.controller';
import { HrAssetsService } from './hr-assets.service';
import { HrAssetsRepository } from './hr-assets.repository';
import { HrAssetsSchemaService } from './hr-assets-schema.service';
import { HrAssetsSchemaRepository } from './hr-assets-schema.repository';

@Module({
  imports: [AuthModule],
  controllers: [HrAssetsController],
  providers: [HrAssetsService, HrAssetsRepository, HrAssetsSchemaRepository, HrAssetsSchemaService],
})
export class HrAssetsModule {}
