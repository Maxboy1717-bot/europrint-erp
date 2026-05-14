/**
 * @module analytics.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsExtendedController } from './analytics-extended.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExtendedService } from './analytics-extended.service';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsExtendedRepository } from './analytics-extended.repository';

@Module({
  imports: [AuthModule],
  controllers: [AnalyticsController, AnalyticsExtendedController],
  providers: [AnalyticsService, AnalyticsExtendedService, AnalyticsRepository, AnalyticsExtendedRepository],
})
export class AnalyticsModule {}
