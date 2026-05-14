/**
 * @module admin.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { DatabaseModule } from '@/infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CronModule } from '../../cron/cron.module';

import { AdminUsersController } from './presentation/controllers/admin-users.controller';
import { AdminSettingsController } from './presentation/controllers/admin-settings.controller';
import { AdminCronStatusController } from './presentation/controllers/admin-cron-status.controller';
import { AdminQueueController } from './presentation/controllers/admin-queue.controller';
import { AdminExtraController } from './presentation/controllers/admin-extra.controller';
import { AdminExtraService } from './application/services/admin-extra.service';
import { AdminExtraRepository } from './infrastructure/repositories/admin-extra.repo';

import { CreateUserHandler } from './application/commands/create-user.handler';
import { UpdateUserRoleHandler } from './application/commands/update-user-role.handler';
import { UpdateSettingsHandler } from './application/commands/update-settings.handler';
import { ListUsersHandler } from './application/queries/list-users.handler';

import { DrizzleUserRepo } from './infrastructure/repositories/drizzle-user.repo';
import { DrizzleSettingsRepo } from './infrastructure/repositories/drizzle-settings.repo';

import { RolesGuard } from './infrastructure/guards/roles.guard';
import { AuditInterceptor } from './infrastructure/interceptors/audit.interceptor';

import { USER_REPO, SETTINGS_REPO } from './admin.tokens';
import { QUERY_TIMEOUT_MS } from '@common/constants/app.constants';
export { USER_REPO, SETTINGS_REPO } from './admin.tokens';
import { AdminQueueService } from './application/services/admin-queue.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CronModule,
    ThrottlerModule.forRoot([
      {
        name: 'admin',
        ttl: QUERY_TIMEOUT_MS,
        limit: 100,
      },
    ]),
  ],
  controllers: [AdminUsersController, AdminSettingsController, AdminCronStatusController, AdminQueueController, AdminExtraController],
  providers: [
    CreateUserHandler,
    UpdateUserRoleHandler,
    UpdateSettingsHandler,
    ListUsersHandler,
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
    RolesGuard,
    AuditInterceptor,
  ],
  exports: [USER_REPO, SETTINGS_REPO],
})
export class AdminModule {}
