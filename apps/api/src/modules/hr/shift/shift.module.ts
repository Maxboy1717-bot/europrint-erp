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
  // ShiftRepository exported so hr-employees-ext.repository.ts can proxy its
  // swap-request query to the canonical repo instead of a duplicate pgTable.
  exports: [ShiftService, ShiftRepository],
})
export class ShiftModule {}
