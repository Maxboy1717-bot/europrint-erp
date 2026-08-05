/**
 * @module admin.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '@/infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CronModule } from '../../cron/cron.module';
import { QueueModule } from '../queue/queue.module';
import { QUEUE_NAMES } from '../queue/queue.constants';

import { AdminUsersController } from './presentation/controllers/admin-users.controller';
import { AdminSettingsController } from './presentation/controllers/admin-settings.controller';
import { AdminCronStatusController } from './presentation/controllers/admin-cron-status.controller';
import { AdminQueueController } from './presentation/controllers/admin-queue.controller';
import { AdminExtraController } from './presentation/controllers/admin-extra.controller';
import { AdminExtraService } from './application/services/admin-extra.service';
import { AdminExtraRepository } from './infrastructure/repositories/admin-extra.repo';

import { CreateUserService } from './application/services/create-user.service';
import { UpdateUserRoleService } from './application/services/update-user-role.service';
import { UpdateSettingsService } from './application/services/update-settings.service';
import { ListUsersService } from './application/services/list-users.service';

import { DrizzleUserRepo } from './infrastructure/repositories/drizzle-user.repo';
import { DrizzleSettingsRepo } from './infrastructure/repositories/drizzle-settings.repo';

import { RolesGuard } from './infrastructure/guards/roles.guard';
import { AuditInterceptor } from './infrastructure/interceptors/audit.interceptor';

import { USER_REPO, SETTINGS_REPO } from './admin.tokens';
import { QUERY_TIMEOUT_MS } from '@common/constants/app.constants';
export { USER_REPO, SETTINGS_REPO } from './admin.tokens';
import { AdminQueueService } from './application/services/admin-queue.service';
// Global biznes-sozlamalar CRUD (OWNER-JAVOBLAR-2026-07-11 — global CRUD qoidasi).
import { BusinessSettingsController } from './settings/business-settings.controller';
import { BusinessSettingsService } from './settings/business-settings.service';
import { BusinessSettingsRepository } from './settings/business-settings.repo';
// §2 Taksonomiya CRUD (nomli ro'yxatlar — mahsulot turi, chegirma, bezash...).
import { TaxonomyController } from './settings/taxonomy.controller';
import { TaxonomyService } from './settings/taxonomy.service';
import { TaxonomyRepository } from './settings/taxonomy.repo';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CronModule,
    // Item #118: real BullMQ access for AdminQueueService (Queue Monitor was 100% mocked).
    // Re-importing QueueModule does not duplicate its processors — Nest dedupes static
    // module imports across the graph (same pattern as cron.module.ts + app.module.ts).
    QueueModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.KANBAN_CRON }),
    ThrottlerModule.forRoot([
      {
        name: 'admin',
        ttl: QUERY_TIMEOUT_MS,
        limit: 100,
      },
    ]),
  ],
  controllers: [AdminUsersController, AdminSettingsController, AdminCronStatusController, AdminQueueController, AdminExtraController, BusinessSettingsController, TaxonomyController],
  providers: [
    CreateUserService,
    UpdateUserRoleService,
    UpdateSettingsService,
    ListUsersService,
    {
      provide: USER_REPO,
      useClass: DrizzleUserRepo,
    },
    {
      provide: SETTINGS_REPO,
      useClass: DrizzleSettingsRepo,
    },
    AdminQueueService,
    AdminExtraService,
    AdminExtraRepository,
    BusinessSettingsService,
    BusinessSettingsRepository,
    TaxonomyService,
    TaxonomyRepository,
    RolesGuard,
    AuditInterceptor,
  ],
  exports: [USER_REPO, SETTINGS_REPO, BusinessSettingsService, TaxonomyService],
})
export class AdminModule {}
