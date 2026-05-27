/**
 * @module core.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleCoreRepo } from './infrastructure/repositories/drizzle-core.repo';
import { CORE_REPO } from './domain/repositories/i-core.repo';

import { CreateDepartmentHandler } from './application/commands/create-department.command';
import { UpdateDepartmentHandler } from './application/commands/update-department.command';
import { DeleteDepartmentHandler } from './application/commands/delete-department.command';
import { CreatePositionHandler } from './application/commands/create-position.command';
import { UpdatePositionHandler } from './application/commands/update-position.command';
import { DeletePositionHandler } from './application/commands/delete-position.command';
import { SavePanelHandler } from './application/commands/save-panel.command';

import { GetDepartmentsHandler } from './application/queries/get-departments.query';
import { GetPositionsHandler } from './application/queries/get-positions.query';
import { GetOrgChartHandler } from './application/queries/get-org-chart.query';
import { GetMyPanelHandler } from './application/queries/get-my-panel.query';

import { PanelsController } from './presentation/panels.controller';

const commandHandlers = [
  CreateDepartmentHandler,
  UpdateDepartmentHandler,
  DeleteDepartmentHandler,
  CreatePositionHandler,
  UpdatePositionHandler,
  DeletePositionHandler,
  SavePanelHandler,
];

const queryHandlers = [
  GetDepartmentsHandler,
  GetPositionsHandler,
  GetOrgChartHandler,
  GetMyPanelHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [PanelsController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    {
      provide: CORE_REPO,
      useClass: DrizzleCoreRepo,
    },
  ],
  exports: [CORE_REPO],
})
export class CoreModule {}
