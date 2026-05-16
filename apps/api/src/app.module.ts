/**
 * @module app.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module, Logger } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { FastifyThrottlerGuard } from './common/guards/fastify-throttler.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import {
  I18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';

// Sprint 3 startup migration
import { Sprint3MigrationService } from './modules/common/services/sprint3-migration.service';

// Common
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ResultUnwrapInterceptor } from './common/interceptors/result-unwrap.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SodGuard } from './common/guards/sod.guard';
import { PermissionGuard } from './common/guards/permission.guard';

// Config
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';

// Sprint 5 — Infratuzilma (TZ-59 Cache, TZ-60 BullMQ)
import { CacheModule } from './common/cache/cache.module';
import { QueueModule } from './modules/queue/queue.module';

// Core modules (24 ta — to'liq NestJS)
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { CrmModule } from './modules/crm/crm.module';
import { SdModule } from './modules/sd/sd.module';
import { PpModule } from './modules/pp/pp.module';
import { MesModule } from './modules/mes/mes.module';
import { WmsModule } from './modules/wms/wms.module';
import { QcModule } from './modules/qc/qc.module';
import { HrModule } from './modules/hr/hr.module';
import { LmsModule } from './modules/lms/lms.module';
import { FinanceModule } from './modules/finance/finance.module';
import { MmModule } from './modules/mm/mm.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IotModule } from './modules/iot/iot.module';
import { DesignModule } from './modules/design/design.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { MroModule } from './modules/mro/mro.module';
import { SecurityModule } from './modules/security/security.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { AiModule } from './modules/ai/ai.module';
import { AiAgentsModule } from './modules/ai-agents/ai-agents.module';
import { BotGatewayModule } from './modules/bot-gateway/bot-gateway.module';
import { DirectorModule } from './modules/director/director.module';
import { AishaModule } from './modules/aisha/aisha.module';
import { CommunicationCenterModule } from './modules/communication-center/communication-center.module';
import { AgentsModule } from './modules/agents/agents.module';
import { PosModule } from './modules/pos/pos.module';
import { PosV2Module } from './modules/pos-v2/pos-v2.module';
import { CoreModule } from './modules/core/core.module';
import { OrgStructureModule } from './modules/org-structure/org-structure.module';
import { ChatModule } from './modules/chat/chat.module';
import { StorageModule } from './modules/storage/storage.module';

// Ecommerce & Website (Express dan ko'chirildi — NestJS native)
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { WebsiteModule } from './modules/website/website.module';

// Legacy & Compatibility (minimallashtirilgan — asosiy route'lar ko'chirildi)
import { LegacyModule } from './modules/general/legacy.module';
import { CompatibilityModule } from './modules/compatibility/compatibility.module';

// Cron + Telegram
import { CronModule } from './cron/cron.module';
import { TelegramModule } from './telegram/telegram.module';

// Remaining routes (to'liq NestJS — Express o'chirildi)
import { RemainingModule } from './modules/remaining/remaining.module';
import { IntegrationModule } from './modules/integration/integration.module';

// New modules (CRM/SD extensions)
// PA3-17 Wave 3: SalesModule merged into SdModule
import { ApplicationsModule } from './modules/applications/applications.module';
import { SapModule } from './modules/sap/sap.module';

// PP / MES / Production extensions
import { ProductionModule } from './modules/production/production.module';
import { ErpModule } from './modules/erp/erp.module';

// Analytics & Export
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ExportModule } from './modules/export/export.module';

// Design / Technology / HR Assets (Task #262)
import { TechnologyModule } from './modules/technology/technology.module';
// PA3-17 Wave 3: HrAssetsModule merged into HrModule

// Faza 7 — New endpoint modules
// PA3-17 Wave 3: AdaptationModule merged into HrModule
// CameraModule removed — its routes were dead code (no frontend usage). All
// active camera functionality now lives under IotModule.
// PA3-17 Wave 3: Feedback360Module merged into HrModule

// Sprint 4 — Order-to-Cash Workflow
import { OrderWorkflowModule } from './modules/order-workflow/order-workflow.module';

// PA0 event-bridge fix — CQRS EventBus → EventEmitter2 (Trigger 2, 7, 14, 15, 20)
import { SharedEventsModule } from './modules/shared/events/shared-events.module';

// PA0-6 — Outbox pattern (persisted domain events + scheduled publisher)
import { OutboxModule } from './modules/shared/outbox/outbox.module';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig],
    }),

    // ── Throttler: §6 Rate Limiting ──────────────────────────────────────────
    // To'rt nomli profil — FastifyThrottlerGuard global enforcement orqali:
    //   default  — umumiy endpointlar     (100/daq)
    //   auth     — /auth/* (brute-force)  (5/daq)
    //   ai       — LLM (qimmat operatsiya)(20/daq) — Claude/OpenAI cost cheklash
    //   report   — og'ir hisobotlar       (10/daq)
    //   export   — PDF/Excel eksport      (5/daq)
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: parseInt(process.env.THROTTLE_DEFAULT_LIMIT ?? '100', 10) },
      { name: 'auth',    ttl: 60_000, limit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '5', 10) },
      { name: 'ai',      ttl: 60_000, limit: parseInt(process.env.THROTTLE_AI_LIMIT ?? '20', 10) },
      { name: 'report',  ttl: 60_000, limit: parseInt(process.env.THROTTLE_REPORT_LIMIT ?? '10', 10) },
      { name: 'export',  ttl: 60_000, limit: parseInt(process.env.THROTTLE_EXPORT_LIMIT ?? '5', 10) },
    ]),

    // ── Event-Driven (§10 — 20 trigger) ─────────────────────────────────────
    EventEmitterModule.forRoot(),

    // ── Cron jobs (§22) ──────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Logging (global, nestjs-pino) ─────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),

    // ── i18n: lokalizatsiya (Backend Task Group 3) ───────────────────────────
    // Frontend Accept-Language: uz/ru sarlavhasini yuboradi. nestjs-i18n
    // resolveri tilni aniqlaydi va I18nService.t(key) lokalizatsiyalangan
    // matn qaytaradi. Fallback til — uz.
    // Resolvers tartibi (yuqori prioritet birinchi): ?lang=ru → x-lang header
    // → accept-language header.
    I18nModule.forRoot({
      fallbackLanguage: 'uz',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        // HeaderResolver only for custom 'x-lang' header — 'accept-language' is
        // handled by AcceptLanguageResolver (supports RFC4647 quality values).
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
      typesOutputPath: path.join(__dirname, '../src/generated/i18n.generated.ts'),
    }),

    // ── Infrastructure ────────────────────────────────────────────────────────
    DatabaseModule,
    RedisModule,

    // ── Sprint 5 Infratuzilma (TZ-59 L1/L2 Cache, TZ-60 BullMQ 6 Navbat) ────
    CacheModule,
    QueueModule,

    // ── Core Modullar (24 ta) ─────────────────────────────────────────────────
    AuthModule,
    AdminModule,
    CrmModule,
    SdModule,
    PpModule,
    MesModule,
    WmsModule,
    QcModule,
    HrModule,  // HrV2Module is composed inside HrModule — single registration point
    LmsModule,
    FinanceModule,
    MmModule,
    LogisticsModule,
    NotificationsModule,
    IotModule,
    DesignModule,
    MarketingModule,
    MroModule,
    SecurityModule,
    KanbanModule,
    AiModule,
    AiAgentsModule,
    BotGatewayModule,
    DirectorModule,
    AishaModule,
    CommunicationCenterModule,
    AgentsModule,
    PosModule,
    PosV2Module,
    CoreModule,
    OrgStructureModule,
    ChatModule,
    StorageModule,

    // ── Ecommerce & Website (NestJS native — Express dan ko'chirildi) ──────────
    EcommerceModule,
    WebsiteModule,

    // ── Legacy & Compatibility (minimallashtirilgan — saqlanadi chunki funksiya yo'qolmasligi shart) ──
    CompatibilityModule,
    LegacyModule,

    // ── Cron + Telegram ───────────────────────────────────────────────────────
    CronModule,
    TelegramModule,

    // ── Remaining routes (to'liq NestJS — Express o'chirildi) ─────────────────
    RemainingModule,
    IntegrationModule,

    // ── CRM/SD Extensions ────────────────────────────────────────────────────
    // PA3-17 Wave 3: SalesModule merged into SdModule (controllers/services moved to sd/sales/)
    ApplicationsModule,
    SapModule,

    // ── PP / MES / Production Extensions ─────────────────────────────────────
    ProductionModule,
    ErpModule,

    // ── Analytics & Export ────────────────────────────────────────────────────
    AnalyticsModule,
    ExportModule,

    // ── Design / Technology / HR Assets (Task #262) ───────────────────────────
    TechnologyModule,
    // PA3-17 Wave 3: HrAssetsModule merged into HrModule (hr/hr-assets/)

    // ── Faza 7 — New endpoint modules ─────────────────────────────────────────
    // PA3-17 Wave 3: AdaptationModule + Feedback360Module merged into HrModule
    //   (hr/adaptation/ and hr/feedback-360/)

    // ── Sprint 4 — Order-to-Cash Workflow ─────────────────────────────────────
    OrderWorkflowModule,

    // ── PA0 event bridge (CQRS → EventEmitter2, Triggers 2/7/14/15/20) ────────
    SharedEventsModule,

    // ── PA0-6 outbox pattern (persisted domain events + scheduled publisher) ─
    OutboxModule,
  ],

  providers: [
    // ── Global Guards (§6) ────────────────────────────────────────────────────
    { provide: APP_GUARD, useClass: FastifyThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: SodGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },

    // ── Sprint 3 startup migration (ensures rfm_clusters, churn_model_params, imposition_layouts) ──
    Sprint3MigrationService,

    // ── Global Interceptors (tartib muhim: Audit → ResultUnwrap) ─────────────
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    // ResultUnwrapInterceptor: controller Result<T> qaytarsa avtomatik unwrap
    // qiladi. isSuccess=true → value qaytaradi; isFailure → 500 tashlaydi.
    { provide: APP_INTERCEPTOR, useClass: ResultUnwrapInterceptor },
  ],
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);
}
