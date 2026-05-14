/**
 * @module telegram.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TelegramService } from './telegram.service'
import { CrmHandler } from './handlers/crm.handler'
import { LmsHandler } from './handlers/lms.handler'
import { KanbanHandler } from './handlers/kanban.handler'
import { AiReportsHandler } from './handlers/ai-reports.handler'
import { HrHandler } from './handlers/hr.handler'
import { WarehouseHandler } from './handlers/warehouse.handler'
import { ProductionHandler } from './handlers/production.handler'

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    TelegramService,
    CrmHandler,
    LmsHandler,
    KanbanHandler,
    AiReportsHandler,
    HrHandler,
    WarehouseHandler,
    ProductionHandler,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
