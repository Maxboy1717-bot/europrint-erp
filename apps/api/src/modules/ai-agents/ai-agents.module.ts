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
import { AiAgentsController } from './presentation/ai-agents.controller';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';

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
  ],
})
export class AiAgentsModule {}
