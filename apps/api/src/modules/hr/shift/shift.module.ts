/**
 * @module shift.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { ShiftController } from './shift.controller';
import { ShiftRepository } from './shift.repository';

@Module({
  controllers: [ShiftController],
  providers: [ShiftService, ShiftRepository],
  exports: [ShiftService],
})
export class ShiftModule {}
