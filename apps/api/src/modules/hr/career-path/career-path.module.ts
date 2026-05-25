/**
 * @module career-path.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CareerPathService } from './career-path.service';
import { CareerPathRepository } from './career-path.repository';
import { CareerPathController } from './career-path.controller';

@Module({
  controllers: [CareerPathController],
  providers: [CareerPathRepository, CareerPathService],
  exports: [CareerPathService],
})
export class CareerPathModule {}
