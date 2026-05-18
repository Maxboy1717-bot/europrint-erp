/**
 * @module feature-modules
 * @description Aggregated re-exports of every NestJS feature module that
 *   AppModule.imports relies on. Extracted to keep `app.module.ts` under
 *   the 300-line cap (Rule 16) — no behavioural change, only a relocation
 *   of imports.
 */

// ── Infrastructure ──────────────────────────────────────────────────────────
export { DatabaseModule } from './infrastructure/database/database.module';
export { RedisModule } from './infrastructure/redis/redis.module';

// ── Sprint 5 — Infratuzilma (TZ-59 Cache, TZ-60 BullMQ) ─────────────────────
export { CacheModule } from './common/cache/cache.module';
export { QueueModule } from './modules/queue/queue.module';

// ── Core modules (24 ta) ────────────────────────────────────────────────────
export { AuthModule } from './modules/auth/auth.module';
export { AdminModule } from './modules/admin/admin.module';
export { CrmModule } from './modules/crm/crm.module';
export { SdModule } from './modules/sd/sd.module';
export { PpModule } from './modules/pp/pp.module';
export { MesModule } from './modules/mes/mes.module';
export { WmsModule } from './modules/wms/wms.module';
export { QcModule } from './modules/qc/qc.module';
export { HrModule } from './modules/hr/hr.module';
export { LmsModule } from './modules/lms/lms.module';
export { FinanceModule } from './modules/finance/finance.module';
export { MmModule } from './modules/mm/mm.module';
export { LogisticsModule } from './modules/logistics/logistics.module';
export { NotificationsModule } from './modules/notifications/notifications.module';
export { IotModule } from './modules/iot/iot.module';
export { DesignModule } from './modules/design/design.module';
export { MarketingModule } from './modules/marketing/marketing.module';
export { MroModule } from './modules/mro/mro.module';
export { SecurityModule } from './modules/security/security.module';
export { KanbanModule } from './modules/kanban/kanban.module';
export { AiModule } from './modules/ai/ai.module';
export { AiAgentsModule } from './modules/ai-agents/ai-agents.module';
export { BotGatewayModule } from './modules/bot-gateway/bot-gateway.module';
export { DirectorModule } from './modules/director/director.module';
export { AishaModule } from './modules/aisha/aisha.module';
export { CommunicationCenterModule } from './modules/communication-center/communication-center.module';
export { AgentsModule } from './modules/agents/agents.module';
export { PosModule } from './modules/pos/pos.module';
export { PosV2Module } from './modules/pos-v2/pos-v2.module';
export { CoreModule } from './modules/core/core.module';
export { OrgStructureModule } from './modules/org-structure/org-structure.module';
export { ChatModule } from './modules/chat/chat.module';
export { StorageModule } from './modules/storage/storage.module';

// ── Ecommerce & Website (Express dan ko'chirildi — NestJS native) ───────────
// PA3-17 Wave 6: WebsiteModule merged into EcommerceModule
export { EcommerceModule } from './modules/ecommerce/ecommerce.module';

// ── Legacy & Compatibility (minimallashtirilgan) ────────────────────────────
export { LegacyModule } from './modules/general/legacy.module';
export { CompatibilityModule } from './modules/compatibility/compatibility.module';

// ── Cron + Telegram ─────────────────────────────────────────────────────────
export { CronModule } from './cron/cron.module';
export { TelegramModule } from './telegram/telegram.module';

// ── Remaining routes ────────────────────────────────────────────────────────
export { RemainingModule } from './modules/remaining/remaining.module';
export { IntegrationModule } from './modules/integration/integration.module';

// ── PP / MES / Production Extensions ────────────────────────────────────────
// PA3-17 Wave 6: ProductionModule merged into PpModule
export { ErpModule } from './modules/erp/erp.module';

// ── Analytics & Export ──────────────────────────────────────────────────────
// PA3-17 Wave 6: AnalyticsModule merged into DirectorModule
export { ExportModule } from './modules/export/export.module';

// ── Sprint 4 — Order-to-Cash Workflow ───────────────────────────────────────
export { OrderWorkflowModule } from './modules/order-workflow/order-workflow.module';

// ── PA0 event bridge (CQRS → EventEmitter2) ─────────────────────────────────
export { SharedEventsModule } from './modules/shared/events/shared-events.module';

// ── PA0-6 outbox pattern ────────────────────────────────────────────────────
export { OutboxModule } from './modules/shared/outbox/outbox.module';
