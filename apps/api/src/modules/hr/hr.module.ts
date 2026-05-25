/**
 * @module hr.module
 * @description NestJS @Module() definition. Imports list lives here; the heavy provider
 * and controller arrays were extracted to `hr.providers.ts` per Rule 16 (≤ 300 lines).
 * No DI tokens or route paths changed — consumers see the same exported HrModule.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';
import { HrV2CommonModule } from './common/hr-v2-common.module';
import { DocumentWorkflowModule } from './document-workflow/document-workflow.module';
import { DisciplineV2Module } from './discipline-v2/discipline-v2.module';
import { GamificationModule } from './gamification/gamification.module';
import { DailyReportModule } from './daily-report/daily-report.module';
import { OnboardingChecklistsModule } from './onboarding-checklists/onboarding-checklists.module';
import { CareerPathModule } from './career-path/career-path.module';
import { SkillsMatrixModule } from './skills-matrix/skills-matrix.module';
import { PipModule } from './pip/pip.module';
import { EnpsModule } from './enps/enps.module';
import { ReceptionModule } from './reception/reception.module';
import { ShiftModule } from './shift/shift.module';
import { AiInterviewV2Module } from './ai-interview-v2/ai-interview-v2.module';
import { TelegramBotsModule } from './telegram-bots/telegram-bots.module';
import { InspectionModule } from './inspection/inspection.module';
import { hrControllers, hrProviders, hrExports } from './hr.providers';

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    HrV2CommonModule,
    DocumentWorkflowModule,
    DisciplineV2Module,
    GamificationModule,
    DailyReportModule,
    OnboardingChecklistsModule,
    CareerPathModule,
    SkillsMatrixModule,
    PipModule,
    EnpsModule,
    ReceptionModule,
    ShiftModule,
    AiInterviewV2Module,
    TelegramBotsModule,
    InspectionModule,
  ],
  controllers: hrControllers,
  providers: hrProviders,
  exports: hrExports,
})
export class HrModule {}
