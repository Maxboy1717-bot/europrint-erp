/**
 * @module app.module
 * @description NestJS @Module() definition. Providers, controllers, and imports
 *   for this feature slice. Feature-module imports were extracted to
 *   `feature-modules.ts` to keep this file under the 300-line cap (Rule 16).
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
import { TenantContextInterceptor } from './shared/db/tenant-context.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SodGuard } from './common/guards/sod.guard';
import { PermissionGuard } from './common/guards/permission.guard';

// Config
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

// Feature modules — extracted to keep this file under 300 lines (Rule 16).
import {
  DatabaseModule, RedisModule,
  CacheModule, QueueModule,
  AuthModule, AdminModule, CrmModule, SdModule, PpModule, MesModule,
  WmsModule, QcModule, HrModule, LmsModule, FinanceModule, MmModule,
  LogisticsModule, NotificationsModule, IotModule, DesignModule,
  MarketingModule, MroModule, SecurityModule, KanbanModule, AiModule, AiFitModule,
  AiAgentsModule, BotGatewayModule, DirectorModule, AishaModule,
  CommunicationCenterModule, AgentsModule, PosModule, PosV2Module,
  CoreModule, OrgStructureModule, ChatModule, StorageModule,
  EcommerceModule, LegacyModule, CompatibilityModule,
  CronModule, TelegramModule, RemainingModule, IntegrationModule,
  ErpModule, ExportModule, OrderWorkflowModule,
  SharedEventsModule, OutboxModule,
} from './feature-modules';

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
    AiFitModule,
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

    // ── Legacy & Compatibility (minimallashtirilgan) ────────────────────────────
    CompatibilityModule,
    LegacyModule,

    // ── Cron + Telegram ───────────────────────────────────────────────────────
    CronModule,
    TelegramModule,

    // ── Remaining routes (to'liq NestJS — Express o'chirildi) ─────────────────
    RemainingModule,
    IntegrationModule,

    // ── PP / MES / Production Extensions ─────────────────────────────────────
    ErpModule,

    // ── Analytics & Export ────────────────────────────────────────────────────
    ExportModule,

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

    // ── Sprint 3 startup migration ─────────────────────────────────────────
    // Ensures rfm_clusters, churn_model_params, imposition_layouts.
    Sprint3MigrationService,

    // ── Global Interceptors (tartib muhim: Audit → ResultUnwrap) ─────────────
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    // TenantContextInterceptor: Phase 2 / Task 2.1 — wraps each request in
    // an AsyncLocalStorage tenant scope read from JWT. Must run AFTER the
    // guards (so request.user is populated) but BEFORE any business logic
    // that calls getTenantId(). Order is determined by registration order
    // among APP_INTERCEPTOR providers.
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    // ResultUnwrapInterceptor: controller Result<T> qaytarsa avtomatik unwrap
    // qiladi. isSuccess=true → value qaytaradi; isFailure → 500 tashlaydi.
    { provide: APP_INTERCEPTOR, useClass: ResultUnwrapInterceptor },
  ],
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);
}
