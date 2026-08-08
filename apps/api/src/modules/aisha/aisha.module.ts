/**
 * @module aisha.module
 * @description Voice-only AI assistant for the Director. Integrates with all
 * 55 business modules via the tool registry. Lives inside the Director
 * Dashboard (not a standalone page). Provides full data provenance for every
 * answer (which tool, which source table, when queried).
 *
 * Routes registered:
 *   GET    /api/aisha/wake/config       — Porcupine bootstrap
 *   PATCH  /api/aisha/wake/sensitivity  — director-only sensitivity tune
 *   POST   /api/aisha/voice/transcribe  — STT (Whisper)
 *   POST   /api/aisha/voice/synthesize  — TTS (ElevenLabs)
 *   POST   /api/aisha/chat              — text-chat (graceful stub if no LLM key)
 *   SSE    /api/aisha/stream/:id        — streaming text deltas + tool results
 *
 * Voice and stream controllers depend on WhisperService / ElevenLabsService /
 * AishaSseGateway respectively — kept as providers so DI resolves cleanly even
 * when their underlying API keys are absent (the services themselves degrade
 * gracefully).
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AishaConfig } from './config/aisha.config';
import { WakeConfigController } from './presentation/controllers/wake-config.controller';
import { AishaChatController } from './presentation/controllers/chat.controller';
import { AishaHistoryController } from './presentation/controllers/aisha-history.controller';
import { VoiceController } from './presentation/controllers/voice.controller';
import { AishaSseGateway } from './infrastructure/streaming/aisha-sse.gateway';
import { WhisperService } from './application/voice/whisper.service';
import { ElevenLabsService } from './application/voice/elevenlabs.service';
import { ClaudeService } from './application/llm/claude.service';
import { GeminiFallbackService } from './application/llm/gemini-fallback.service';
import { ClaudeAdapter } from './infrastructure/external/claude.adapter';
import { GeminiAdapter } from './infrastructure/external/gemini.adapter';
import { CLAUDE_PORT } from './domain/ports/i-claude-port';
import { GEMINI_PORT } from './domain/ports/i-gemini-port';
import { BudgetTrackerService } from './application/llm/budget-tracker.service';
import { ToolRegistry } from './application/tools/tool.registry';
import { AishaConversationService } from './application/conversation/aisha-conversation.service';
import { AishaHistoryService } from './application/conversation/aisha-history.service';
import { AishaHistoryRepository } from './infrastructure/persistence/aisha-history.repo';
import { WakeConfigRepository } from './infrastructure/persistence/wake-config.repo';
import { AishaToolBootstrap } from './application/tools/tool-bootstrap.service';
// 25 tools — each is @Injectable() and registered in providers below
import { AnalyzeCameraFeedTool }       from './application/tools/analyze-camera-feed.tool';
import { AssignTaskTool }               from './application/tools/assign-task.tool';
import { ComparePeriodsTool }           from './application/tools/compare-periods.tool';
import { CreateReminderTool }           from './application/tools/create-reminder.tool';
import { DetectSafetyViolationsTool }   from './application/tools/detect-safety-violations.tool';
import { DetectWorkersInAreaTool }      from './application/tools/detect-workers-in-area.tool';
import { ForecastDemandTool }           from './application/tools/forecast-demand.tool';
import { GenerateKpiReportTool }        from './application/tools/generate-kpi-report.tool';
import { GetActiveAlertsTool }          from './application/tools/get-active-alerts.tool';
import { GetCameraSnapshotTool }        from './application/tools/get-camera-snapshot.tool';
import { GetCustomerInfoTool }          from './application/tools/get-customer-info.tool';
import { GetEmployeeInfoTool }          from './application/tools/get-employee-info.tool';
import { GetFinancialSummaryTool }      from './application/tools/get-financial-summary.tool';
import { GetInventoryLevelsTool }       from './application/tools/get-inventory-levels.tool';
import { GetMachineStateViaVisionTool } from './application/tools/get-machine-state-via-vision.tool';
import { CAMERA_SNAPSHOT_PROVIDER }     from './application/tools/get-camera-snapshot.tool';
import { CameraSnapshotProvider }       from './infrastructure/external/camera-snapshot.provider';
import { GetMachineStatusTool }         from './application/tools/get-machine-status.tool';
import { GetOrderStatusTool }           from './application/tools/get-order-status.tool';
import { GetProductionStatusTool }      from './application/tools/get-production-status.tool';
import { GetQualityMetricsTool }        from './application/tools/get-quality-metrics.tool';
import { GetTodayBriefingTool }         from './application/tools/get-today-briefing.tool';
import { GetTopDebtorsTool }            from './application/tools/get-top-debtors.tool';
import { GetSalesLeaderboardTool }      from './application/tools/get-sales-leaderboard.tool';
import { ListAvailableCamerasTool }     from './application/tools/list-available-cameras.tool';
import { ScheduleMeetingTool }          from './application/tools/schedule-meeting.tool';
import { SendEmailTool }                from './application/tools/send-email.tool';
import { EMAIL_SENDER as AISHA_EMAIL_SENDER } from './application/tools/send-email.tool';
import { TELEGRAM_SENDER as AISHA_TELEGRAM_SENDER } from './application/tools/send-telegram-to-team.tool';
// Audit 2026-08-06: the two tools' local Symbols were never bound to anything, so the
// HITL approval flow completed and then sent nothing. These adapters bind them to the
// real notifications infrastructure.
import { AishaEmailSenderAdapter, AishaTelegramSenderAdapter } from './infrastructure/external/notification-sender.adapters';
import { NotificationsModule } from '../notifications/notifications.module';
import { SendTelegramToTeamTool }       from './application/tools/send-telegram-to-team.tool';
import { WhatIfSimulationTool }         from './application/tools/what-if-simulation.tool';
// AI Bilim Grafigi (owner 2026-08-08) — 4 yangi tool, KnowledgeGraphModule'dan KNOWLEDGE_GRAPH_REPO oladi.
import { SearchGraphTool }              from './application/tools/search-graph.tool';
import { ReadNodeTool }                 from './application/tools/read-node.tool';
import { CreateLinkTool }               from './application/tools/create-link.tool';
import { ExecuteErpActionTool }         from './application/tools/execute-erp-action.tool';
import { KnowledgeGraphModule }         from '../knowledge-graph/knowledge-graph.module';

@Module({
  imports: [
    NotificationsModule,
    ConfigModule,
    CqrsModule,
    EventEmitterModule,
    ScheduleModule.forRoot(),
    KnowledgeGraphModule,
  ],
  providers: [
    AishaConfig,
    WhisperService,
    ElevenLabsService,
    // Also a @Controller (registered below) — listed here too so
    // AishaConversationService can inject it directly (push() streaming).
    AishaSseGateway,
    // LLM stack — hex-arch ports (P2-23). Concrete adapters live in
    // `infrastructure/external/`; domain code depends on the port tokens
    // via `@Inject(CLAUDE_PORT)` / `@Inject(GEMINI_PORT)`. The legacy
    // `ClaudeService` / `GeminiFallbackService` classes remain as thin
    // delegating shims so existing tool injectors keep compiling — they
    // forward every call to the adapter and inherit the retry/timeout
    // behaviour automatically.
    ClaudeAdapter,
    GeminiAdapter,
    { provide: CLAUDE_PORT, useExisting: ClaudeAdapter },
    { provide: GEMINI_PORT, useExisting: GeminiAdapter },
    // Camera-snapshot port (item 2.12): real HTTP-snapshot implementation.
    // Consumed by get-camera-snapshot / analyze-camera-feed /
    // detect-workers-in-area / detect-safety-violations /
    // get-machine-state-via-vision tools via @Inject(CAMERA_SNAPSHOT_PROVIDER).
    CameraSnapshotProvider,
    { provide: CAMERA_SNAPSHOT_PROVIDER, useExisting: CameraSnapshotProvider },
    ClaudeService,
    GeminiFallbackService,
    BudgetTrackerService,
    ToolRegistry,
    AishaHistoryRepository,      // persistence + read adapter for the 4 aisha_* tables
    WakeConfigRepository,        // persists Director wake-word sensitivity (settings table)
    AishaHistoryService,         // read/governance surface (history + HITL queue + resume-after-approve via ToolRegistry)
    AishaConversationService,   // #15 P0 tool-execution loop (now persists turns)
    // 31 AIsha tools — each @Injectable, registered with ToolRegistry on
    // module init by AishaToolBootstrap. Order alphabetical, matches the
    // bootstrap service's constructor.
    AnalyzeCameraFeedTool, AssignTaskTool, ComparePeriodsTool,
    CreateReminderTool, DetectSafetyViolationsTool, DetectWorkersInAreaTool,
    ForecastDemandTool, GenerateKpiReportTool, GetActiveAlertsTool,
    GetCameraSnapshotTool, GetCustomerInfoTool, GetEmployeeInfoTool,
    GetFinancialSummaryTool, GetInventoryLevelsTool,
    GetMachineStateViaVisionTool, GetMachineStatusTool, GetOrderStatusTool,
    GetProductionStatusTool, GetQualityMetricsTool, GetTodayBriefingTool,
    GetTopDebtorsTool, GetSalesLeaderboardTool,
    ListAvailableCamerasTool, ScheduleMeetingTool, SendEmailTool,
    SendTelegramToTeamTool, WhatIfSimulationTool,
    // AI Bilim Grafigi (owner 2026-08-08) — tool #28-31.
    SearchGraphTool, ReadNodeTool, CreateLinkTool, ExecuteErpActionTool,
    AishaEmailSenderAdapter, AishaTelegramSenderAdapter,
    { provide: AISHA_EMAIL_SENDER, useExisting: AishaEmailSenderAdapter },
    { provide: AISHA_TELEGRAM_SENDER, useExisting: AishaTelegramSenderAdapter },
    AishaToolBootstrap,
  ],
  controllers: [
    WakeConfigController,
    AishaChatController,
    AishaHistoryController,
    VoiceController,
    AishaSseGateway,
  ],
  exports: [AishaConfig, ToolRegistry, ClaudeService, CLAUDE_PORT, GEMINI_PORT],
})
export class AishaModule {}
