/**
 * @module gamification.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { GamificationRepository } from './gamification.repository';

@Module({
  controllers: [GamificationController],
  providers: [GamificationRepository, GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
