/**
 * @module export.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportRepository } from './export.repository';

@Module({
  imports: [AuthModule],
  controllers: [ExportController],
  providers: [ExportService, ExportRepository],
})
export class ExportModule {}
