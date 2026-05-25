/**
 * @module pip.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { PipService } from './pip.service';
import { PipController } from './pip.controller';
import { PipRepository } from './pip.repository';
import { PipWorkflowService } from './pip-workflow.service';

@Module({
  controllers: [PipController],
  providers: [PipRepository, PipWorkflowService, PipService],
  exports: [PipService],
})
export class PipModule {}
