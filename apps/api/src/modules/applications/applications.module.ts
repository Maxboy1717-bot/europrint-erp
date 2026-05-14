/**
 * @module applications.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationResponsesController } from './application-responses.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';

@Module({
  controllers: [ApplicationsController, ApplicationResponsesController],
  providers: [ApplicationsRepository, ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
