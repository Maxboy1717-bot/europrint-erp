/**
 * @module reception.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { ReceptionService } from './reception.service';
import { ReceptionController } from './reception.controller';
import { ReceptionRepository } from './reception.repository';

@Module({
  controllers: [ReceptionController],
  providers: [ReceptionRepository, ReceptionService],
  exports: [ReceptionService],
})
export class ReceptionModule {}
