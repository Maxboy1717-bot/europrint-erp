import { Module } from '@nestjs/common';
import { OnboardingChecklistsController } from './onboarding-checklists.controller';
import { OnboardingChecklistsService } from './onboarding-checklists.service';
import { OnboardingChecklistsRepository } from './onboarding-checklists.repository';

@Module({
  controllers: [OnboardingChecklistsController],
  providers: [OnboardingChecklistsService, OnboardingChecklistsRepository],
  exports: [OnboardingChecklistsService],
})
export class OnboardingChecklistsModule {}
