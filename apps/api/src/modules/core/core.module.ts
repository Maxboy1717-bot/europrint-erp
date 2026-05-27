/**
 * @module core.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleCoreRepo } from './infrastructure/repositories/drizzle-core.repo';
import { CORE_REPO } from './domain/repositories/i-core.repo';

import { SavePanelHandler } from './application/commands/save-panel.command';
import { GetMyPanelHandler } from './application/queries/get-my-panel.query';

import { PanelsController } from './presentation/panels.controller';

const commandHandlers = [SavePanelHandler];

const queryHandlers = [GetMyPanelHandler];

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
