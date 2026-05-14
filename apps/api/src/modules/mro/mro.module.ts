/**
 * @module mro.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StopMachineHandler } from './application/commands/stop-machine.handler';
import { AssignMaintenanceHandler } from './application/commands/assign-maintenance.handler';
import { CompleteMaintenanceHandler } from './application/commands/complete-maintenance.handler';
import { GetMaintenanceOrdersHandler } from './application/queries/get-maintenance-orders.handler';
import { MachineStoppedListener } from './infrastructure/event-handlers/machine-stopped.listener';
import { MroController } from './presentation/mro.controller';
import { MAINTENANCE_REPO } from './domain/repositories/i-maintenance.repo';
import { DrizzleMaintenanceRepository } from './infrastructure/repositories/drizzle-maintenance.repo';
import { MaintenanceService } from './maintenance/maintenance.service';
import { DrizzleMaintenanceSvcRepository } from './maintenance/drizzle-maintenance-svc.repo';
import { MAINTENANCE_SVC_REPO } from './maintenance/i-maintenance-svc.repo';

const commandHandlers = [StopMachineHandler, AssignMaintenanceHandler, CompleteMaintenanceHandler];
const eventHandlers = [MachineStoppedListener];
const queryHandlers = [GetMaintenanceOrdersHandler];
const repositories = [
  {
    provide: MAINTENANCE_REPO,
    useClass: DrizzleMaintenanceRepository,
  },
  { provide: MAINTENANCE_SVC_REPO, useClass: DrizzleMaintenanceSvcRepository },
];

@Module({
  imports: [CqrsModule],
  controllers: [MroController],
  providers: [...commandHandlers, ...eventHandlers, ...queryHandlers, ...repositories, MaintenanceService],
  exports: [MAINTENANCE_REPO, MAINTENANCE_SVC_REPO, MaintenanceService],
})
export class MroModule {}
