/**
 * @module gamification.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { GamificationRepository } from './gamification.repository';
import {
  DailyReportPointsListener,
  DocumentApprovedPointsListener,
  CertificateEarnedPointsListener,
} from './gamification.listeners';

@Module({
  imports: [CqrsModule],
  controllers: [GamificationController],
  providers: [
    GamificationRepository,
    GamificationService,
    // Wave 4 round-4 — canonical CQRS handlers replacing the three @OnEvent
    // listeners that used to live on GamificationService.
    DailyReportPointsListener,
    DocumentApprovedPointsListener,
    CertificateEarnedPointsListener,
  ],
  exports: [GamificationService],
})
export class GamificationModule {}
