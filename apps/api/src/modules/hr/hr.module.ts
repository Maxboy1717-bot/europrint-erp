/**
 * @module hr.module
 * @description NestJS @Module() definition. Imports list lives here; the heavy provider
 * and controller arrays were extracted to `hr.providers.ts` per Rule 16 (≤ 300 lines).
 * No DI tokens or route paths changed — consumers see the same exported HrModule.
 */

import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';
import { HrV2CommonModule } from './common/hr-v2-common.module';
import { DocumentWorkflowModule } from './document-workflow/document-workflow.module';
import { DailyReportModule } from './daily-report/daily-report.module';
import { OnboardingChecklistsModule } from './onboarding-checklists/onboarding-checklists.module';
import { CareerPathModule } from './career-path/career-path.module';
import { SkillsMatrixModule } from './skills-matrix/skills-matrix.module';
import { ReceptionModule } from './reception/reception.module';
import { ShiftModule } from './shift/shift.module';
import { AiInterviewV2Module } from './ai-interview-v2/ai-interview-v2.module';
import { TelegramBotsModule } from './telegram-bots/telegram-bots.module';
import { InspectionModule } from './inspection/inspection.module';
import { EnpsModule } from './enps/enps.module';
import { PipModule } from './pip/pip.module';
// Modul 02 (HR) vizyon 02.41 — tijorat siri NDA imzosi (owner-approved 2026-06-30).
import { NdaModule } from './nda/nda.module';
import { FinanceModule } from '../finance/finance.module';
import { LmsModule } from '../lms/lms.module';
import { OrgStructureModule } from '../org-structure/org-structure.module';
import { hrControllers, hrProviders, hrExports } from './hr.providers';

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    HrV2CommonModule,
    DocumentWorkflowModule,
    DailyReportModule,
    OnboardingChecklistsModule,
    CareerPathModule,
    SkillsMatrixModule,
    ReceptionModule,
    ShiftModule,
    AiInterviewV2Module,
    TelegramBotsModule,
    InspectionModule,
    EnpsModule,
    PipModule,
    NdaModule,
    // forwardRef: FinanceModule (Moliya-GL-Kassa 2026-07-02) now also imports HrModule
    // (to proxy its payroll-close route through HR's PayrollService.closePeriod) — the
    // two modules depend on each other, so both sides must use forwardRef().
    forwardRef(() => FinanceModule), // exports GlPostingService — payroll closure posts the GL journal through the ONE engine
    LmsModule, // T7-10: exports LmsCardGateService — payroll consults the LMS oylik-gate (EP-ORG-027/EP-LMS-070)
    OrgStructureModule, // SB0072/SB0101: exports CardService — probation-pass activates the onboarding target card
  ],
  controllers: hrControllers,
  providers: hrProviders,
  exports: hrExports,
})
export class HrModule {}
