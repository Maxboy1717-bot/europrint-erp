/**
 * @module ai-agents.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AiDecisionLogService } from './common/ai-decision-log.service';
import { AiAlertsService } from './common/ai-alerts.service';
import { SalesCopilotService } from './sales/sales-copilot.service';
import { PrepressAssistantService } from './prepress/prepress-assistant.service';
import { AiPlannerService } from './planning/planner.service';
import { AiMesMonitorService } from './mes/mes-monitor.service';
import { AiVisionQcService } from './qc/vision-qc.service';
import { AiRouterService as VrpRouterService } from './logistics/router.service';
// A78: Aisha tool-call loop skeleton (AI-kalit gated; tool registry seam).
import { AishaOrchestratorService } from './aisha/aisha-orchestrator.service';
import { AiAgentsController } from './presentation/ai-agents.controller';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DrizzleService } from '@common/services/drizzle.service';
// P35: AiAlertsService Qoida-15 uchun DB queries DrizzleAiAlertsRepo ga ko'chirildi
// (avval db.* to'g'ridan ishlatilardi). Repo + AI_ALERTS_REPO token bu yerda register
// qilinadi; AiAlertsService constructor @Inject(AI_ALERTS_REPO) bilan oladi.
import { DrizzleAiAlertsRepo, AI_ALERTS_REPO } from './infrastructure/repositories/drizzle-ai-alerts.repo';

@Module({
  imports: [AiModule, NotificationsModule],
  providers: [
    AiDecisionLogService,
    AiAlertsService,
    SalesCopilotService,
    PrepressAssistantService,
    AiPlannerService,
    AiMesMonitorService,
    AiVisionQcService,
    VrpRouterService,
    AishaOrchestratorService,
    // P35: ai-alerts Qoida-15 fix
    DrizzleService,
    DrizzleAiAlertsRepo,
    { provide: AI_ALERTS_REPO, useClass: DrizzleAiAlertsRepo },
  ],
  controllers: [AiAgentsController],
  exports: [
    AiDecisionLogService,
    SalesCopilotService,
    PrepressAssistantService,
    AiPlannerService,
    AiMesMonitorService,
    AiVisionQcService,
    VrpRouterService,
    AishaOrchestratorService,
  ],
})
export class AiAgentsModule {}
