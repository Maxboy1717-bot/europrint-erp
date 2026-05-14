/**
 * @module adaptation.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdaptationController } from './adaptation.controller';
import { AdaptationService } from './adaptation.service';
import { AdaptationRepository } from './adaptation.repo';
import { ValidateController } from '../common/presentation/validate.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdaptationController, ValidateController],
  providers: [AdaptationService, AdaptationRepository],
  exports: [AdaptationService],
})
export class AdaptationModule {}
