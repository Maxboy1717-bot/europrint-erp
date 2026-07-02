/**
 * Communication Center Module — 3 Savat Tizimi
 *
 * Phase 1: 3-savat operatsiyalari (inbox/pending/outbox/move/summary).
 * Phase 2: Hujjat yaratish + workflow engine + tasdiqlash/rad etish/qayta yuborish/bekor qilish.
 * Phase 3: AI hujjat to'ldirish (Claude intervyu).
 * Phase 5: Telegram bot + Socket.IO gateway + cron jobs.
 * Phase 6: Event listeners + webhook (HMAC).
 * Phase 7: Public verify (QR), KPI/statistika, notification prefs API,
 *          Director Telegram komandalar (Agents module bilan integratsiya).
 *
 * Phase 4 (frontend) alohida `artifacts/erp-dashboard/` papkasida.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { AgentsModule } from '../agents/agents.module';

// Repositories
import { CcBasketsRepository }            from './infrastructure/repositories/cc-baskets.repo';
import { CcDocumentsRepository, CcDocumentsReadRepo, CcDocumentsWriteRepo } from './infrastructure/repositories/cc-documents.repo';
import { CcNotificationPrefsRepository }  from './infrastructure/repositories/cc-notification-prefs.repo';

// Application services
import { CcBasketsService }        from './application/cc-baskets.service';
import { CcWorkflowService }       from './application/cc-workflow.service';
import { CcWorkflowRejectService } from './application/cc-workflow-reject.service';
import { CcPinService }            from './application/cc-pin.service';
import { CcDocumentNumberService } from './application/cc-document-number.service';
import { CcOrgResolverService }    from './application/cc-org-resolver.service';
import { CcAiInterviewService }    from './application/cc-ai-interview.service';
import { CcPdfService }            from './application/cc-pdf.service';
import { CcStatsService }          from './application/cc-stats.service';

// Presentation
import { CcBasketsController }            from './presentation/cc-baskets.controller';
import { CcDocumentsController }          from './presentation/cc-documents.controller';
import { CcAiController }                 from './presentation/cc-ai.controller';
import { CcWebhookController }            from './presentation/cc-webhook.controller';
import { CcPublicController }             from './presentation/cc-public.controller';
import { CcNotificationPrefsController }  from './presentation/cc-notification-prefs.controller';
import { CcGateway }                      from './presentation/cc.gateway';

// Cron + Telegram + Events
import { CcSlaCron }       from './cron/cc-sla.cron';
import { CcBotService }    from './telegram/cc-bot.service';
import { CcEventListener } from './events/cc-event.listener';
import { CcApprovedKassirListener } from './events/cc-approved-kassir.listener';

@Module({
  imports: [
    CqrsModule,
    AiModule,
    AgentsModule,                  // CcBotService → DirectorAgentService + StrategicAgentService
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [
    CcBasketsController,
    CcDocumentsController,
    CcAiController,
    CcWebhookController,
    CcPublicController,                  // /api/cc/verify/:id (public, JWT yo'q)
    CcNotificationPrefsController,       // GET/PUT /api/cc/notification-prefs
  ],
  providers: [
    // repositories
    CcBasketsRepository,
    CcDocumentsReadRepo,
    CcDocumentsWriteRepo,
    CcDocumentsRepository,
    CcNotificationPrefsRepository,
    // application services
    CcBasketsService,
    CcWorkflowService,
    CcWorkflowRejectService,
    CcPinService,
    CcDocumentNumberService,
    CcOrgResolverService,
    CcAiInterviewService,
    CcPdfService,
    CcStatsService,
    // realtime + cron + telegram + events
    CcGateway,
    CcSlaCron,
    CcBotService,
    CcEventListener,
    CcApprovedKassirListener,   // G4: approve→kassir bildirishnoma ko'prigi
  ],
  exports: [
    CcBasketsService,
    CcWorkflowService,
    CcPinService,
    CcAiInterviewService,
    CcGateway,
    CcBotService,
    CcStatsService,
  ],
})
export class CommunicationCenterModule {}
