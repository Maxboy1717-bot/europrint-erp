/**
 * @module sales.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';

@Module({
  controllers: [SalesController],
  providers: [SalesRepository, SalesService],
  exports: [SalesService],
})
export class SalesModule {}
