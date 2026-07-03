/**
 * @module ai.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
// T18-C2 — kanonik ЦКП-fakt yozish uchun (AI-answer → ckp_fact_values source=AI_CHAT)
import { OrgStructureModule } from '../org-structure/org-structure.module';
// 2.8 — AI-reservation → warehouse_stock.reserved_quantity wiring (WMS_REPO.reserveMaterial)
import { WmsModule } from '../wms/wms.module';
import { AiRouterService }          from './application/services/ai-router.service';
import { AiRouterCallService }       from './application/services/ai-router-call.service';
import { CentralAiService }          from './application/services/central-ai.service';
import { AiRouterRepository }       from './infrastructure/repositories/ai-router.repository';
import { AI_ROUTER_REPO }            from './domain/repositories/i-ai-router.repo';
import { DrizzleAiProviderConfigRepo } from './infrastructure/repositories/drizzle-ai-provider-config.repo';
import { AI_PROVIDER_CONFIG_REPO }   from './domain/repositories/i-ai-provider-config.repo';
import { AiProviderConfigController } from './presentation/ai-provider-config.controller';
import { AiExamService }             from './application/services/ai-exam.service';
import { AiHrNewService }            from './application/services/ai-hr-new.service';
import { AiPlanningService }         from './application/services/ai-planning.service';
import { AiReservationService }      from './application/services/ai-reservation.service';
import { InsightsService }           from './application/services/insights.service';
import { AiController }              from './presentation/ai.controller';
import { AiExamController }          from './presentation/ai-exam.controller';
import { AiHrNewController }         from './presentation/ai-hr-new.controller';
import { AiPlanningController }      from './presentation/ai-planning.controller';
import { AiReservationController }   from './presentation/ai-reservation.controller';
import { InsightsController }        from './presentation/insights.controller';
import { GptController }             from './presentation/gpt.controller';
import { DrizzleService }            from '../common/services/drizzle.service';
import { HrAiService }               from './services/hr-ai.service';
import { HrAiRepository }           from './services/hr-ai.repository';
import { HrAiExtService }            from './services/hr-ai-ext.service';
import { CrmAiService }              from './services/crm-ai.service';
import { FinanceAiService }          from './services/finance-ai.service';
import { FinanceAiRepository }       from './services/finance-ai.repository';
import { FinanceAiAnalysisService }  from './services/finance-ai-analysis.service';
import { WmsAiService }              from './services/wms-ai.service';
import { DirectorAiService }         from './services/director-ai.service';
import { DirectorAiStrategyService } from './services/director-ai-strategy.service';
import { MarketingAiService }        from './services/marketing-ai.service';
import { AiAutomationService }       from './services/ai-automation.service';
import { AiAutomationRepository }   from './services/ai-automation.repository';
import { AiDataRepository }         from './services/ai-data.repository';
import { AiAutomationDailyService }  from './services/ai-automation-daily.service';
import {
  AiAutomationEventsService,
  AiLeadScoreHandler,
  AiCandidateScreeningHandler,
  AiInvoiceClassifyHandler,
} from './services/ai-automation-events.service';
import { AiHrController }            from './presentation/ai-hr.controller';
import { AiCrmController }           from './presentation/ai-crm.controller';
import { AiFinanceController }       from './presentation/ai-finance.controller';
import { AiWmsController }           from './presentation/ai-wms.controller';
import { AiDirectorController }      from './presentation/ai-director.controller';
import { AiMarketingController }     from './presentation/ai-marketing.controller';
import { AiAutomationController }    from './presentation/ai-automation.controller';
import { DrizzleAiExamRepo }         from './infrastructure/repositories/drizzle-ai-exam.repo';
import { DrizzleAiHrNewRepo }        from './infrastructure/repositories/drizzle-ai-hr-new.repo';
import { DrizzleInsightsRepo }       from './infrastructure/repositories/drizzle-insights.repo';
import { DrizzleAiPlanningRepo }     from './infrastructure/repositories/drizzle-ai-planning.repo';
import { DrizzleAiReservationRepo }  from './infrastructure/repositories/drizzle-ai-reservation.repo';
import { ForecastService }           from './forecast/forecast.service';
import { HoltWintersService }        from './forecast/holt-winters.service';
import { ForecastRepository }        from './forecast/forecast.repository';
import { ForecastPersistenceService } from './forecast/forecast-persistence.service';
import { ForecastWeeklyJob }         from './forecast/forecast-weekly.job';
import { CrostonService }            from './forecast/croston.service';
import { NelderMeadService }         from './forecast/nelder-mead.service';
import { EnsembleForecastService }   from './forecast/ensemble-forecast.service';
import { ForecastExtController }     from './presentation/forecast-ext.controller';
// A75 — Kunlik AI-chatbot (mashinasiz xodim ЦКП-hisoboti)
import { AiDailyReportService }      from './application/services/ai-daily-report.service';
import { AiDailyReportRepository }   from './infrastructure/repositories/ai-daily-report.repository';
import { AiDailyReportController }   from './presentation/ai-daily-report.controller';
// T12-08 — Kunlik ЦКП AI-chatbot cron (mashinasiz xodimga savol)
import { AiDailyReportCron }         from './application/services/ai-daily-report.cron';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    // T18-C2 — exports CkpFactService (kanonik ЦКП-fakt yozish: formula + deadline + cascade).
    OrgStructureModule,
    // 2.8 — exports WMS_REPO (IWmsRepository.reserveMaterial) for AiReservationService.
    WmsModule,
  ],
  providers: [
    AiRouterRepository,
    { provide: AI_ROUTER_REPO, useClass: AiRouterRepository },
    AiRouterService,
    AiRouterCallService,
    CentralAiService,
    DrizzleAiProviderConfigRepo,
    { provide: AI_PROVIDER_CONFIG_REPO, useClass: DrizzleAiProviderConfigRepo },
    DrizzleService,
    HrAiRepository,
    HrAiService,
    HrAiExtService,
    CrmAiService,
    FinanceAiRepository,
    FinanceAiService,
    FinanceAiAnalysisService,
    WmsAiService,
    DirectorAiService,
    DirectorAiStrategyService,
    MarketingAiService,
    AiAutomationRepository,
    AiDataRepository,
    AiAutomationService,
    AiAutomationDailyService,
    AiAutomationEventsService,
    // PA2-18 Wave 4 round-3: canonical @EventsHandler split
    AiLeadScoreHandler,
    AiCandidateScreeningHandler,
    AiInvoiceClassifyHandler,
    DrizzleAiExamRepo,
    DrizzleAiHrNewRepo,
    DrizzleInsightsRepo,
    DrizzleAiPlanningRepo,
    DrizzleAiReservationRepo,
    AiExamService,
    AiHrNewService,
    AiPlanningService,
    AiReservationService,
    InsightsService,
    // Forecast services (TZ-06/07/08)
    ForecastService,
    HoltWintersService,
    ForecastRepository,
    ForecastPersistenceService,
    ForecastWeeklyJob,
    // Sprint 3: Croston/TSB, Nelder-Mead, Ensemble (TZ-30/31)
    CrostonService,
    NelderMeadService,
    EnsembleForecastService,
    // A75 — Kunlik AI-chatbot
    AiDailyReportService,
    AiDailyReportRepository,
    // T12-08 — Kunlik ЦКП AI-chatbot cron (08:00 Du-Sha, mashinasiz xodimga savol)
    AiDailyReportCron,
  ],
  controllers: [
    AiController,
    AiProviderConfigController,
    AiHrController,
    AiCrmController,
    AiFinanceController,
    AiWmsController,
    AiDirectorController,
    AiMarketingController,
    AiAutomationController,
    AiExamController,
    AiHrNewController,
    AiPlanningController,
    AiReservationController,
    InsightsController,
    GptController,
    ForecastExtController,
    // A75 — Kunlik AI-chatbot
    AiDailyReportController,
  ],
  exports: [
    AiRouterService,
    AiRouterCallService,
    CentralAiService,
    HrAiService,
    HrAiExtService,
    CrmAiService,
    FinanceAiService,
    FinanceAiAnalysisService,
    WmsAiService,
    DirectorAiService,
    DirectorAiStrategyService,
    MarketingAiService,
    AiAutomationService,
    AiAutomationDailyService,
    AiAutomationEventsService,
    AiExamService,
    AiHrNewService,
    AiPlanningService,
    AiReservationService,
    InsightsService,
    ForecastService,
    HoltWintersService,
    ForecastPersistenceService,
    CrostonService,
    NelderMeadService,
    EnsembleForecastService,
  ],
})
export class AiModule {}
